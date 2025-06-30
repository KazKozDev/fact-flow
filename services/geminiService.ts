import { VerificationResult, VerificationStatus } from '../types';
import { verifyFactWithSources } from './factVerificationService';

const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
const OLLAMA_MODEL = 'gemma3n:e4b';

const parseJsonFromResponse = <T,>(text: string): T | null => {
    try {
        return JSON.parse(text) as T;
    } catch (e) {
        console.error("Failed to parse JSON response from Ollama:", e, "Raw text:", text);
        return null;
    }
};

async function callOllama<T>(prompt: string, format: 'json' | '' = ''): Promise<T | null> {
    try {
        const response = await fetch(OLLAMA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: prompt,
                stream: false,
                format: format,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Ollama API error: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`Ollama API responded with status ${response.status}`);
        }

        const data = await response.json();
        if (data.response) {
            // Ollama with format: 'json' returns a string that needs to be parsed.
            return parseJsonFromResponse<T>(data.response);
        }
        console.error("Ollama response did not contain a 'response' field.", data);
        return null;
    } catch (error) {
        console.error("Error calling Ollama API:", error);
        return null;
    }
}

// Helper function to split text into paragraphs/chunks
function splitTextIntoChunks(text: string): string[] {
    // Split by paragraphs (double newlines or single newlines)
    const paragraphs = text.split(/\n\s*\n|\n/).filter(p => p.trim().length > 0);
    
    // If no clear paragraphs, split by sentences
    if (paragraphs.length <= 1) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        return sentences.map(s => s.trim() + '.');
    }
    
    return paragraphs.map(p => p.trim());
}

// Helper function to extract claims from a single chunk
async function extractClaimsFromChunk(chunk: string): Promise<string[]> {
    const prompt = `You are an expert in information analysis. Your task is to extract all verifiable factual claims from the given text. Each claim must be COMPLETE and SELF-CONTAINED with all necessary context for verification.

CRITICAL REQUIREMENTS:
1. Include ALL names, titles, dates, and specific details
2. Never use pronouns (he, she, it, they) - always use the actual names
3. Each claim must be independently verifiable without referring to other claims
4. Include full titles of books, movies, works, etc.
5. Be specific about WHO did WHAT, WHEN, and WHERE

GOOD Examples:
- "Robert Heinlein wrote the novel 'The Unpleasant Profession of Jonathan Hoag'"
- "The novel 'The Unpleasant Profession of Jonathan Hoag' was first published in October 1942"
- "The Eiffel Tower is 324 meters tall"

BAD Examples (DO NOT DO THIS):
- "The novel is about..." (which novel?)
- "He wrote it in 1942" (who is "he"? what is "it"?)
- "It was published..." (what was published?)

Example Input:
"The novel 'Dune' by Frank Herbert was published in 1965. The book won the Hugo Award. It tells the story of Paul Atreides."

Example Output:
{
  "claims": [
    "Frank Herbert wrote the novel 'Dune'",
    "The novel 'Dune' was published in 1965",
    "The novel 'Dune' won the Hugo Award",
    "The novel 'Dune' tells the story of Paul Atreides"
  ]
}

**Text to Analyze:**
"${chunk}"
`;

    try {
        const result = await callOllama<{ claims: string[] }>(prompt, 'json');
        return result?.claims || [];
    } catch (error) {
        console.error("Error extracting claims from chunk:", error);
        return [];
    }
}

export async function extractClaims(text: string, onProgress?: (message: string) => void): Promise<string[]> {
    onProgress?.('Starting fact extraction...');
    
    // First, try to extract claims from the entire text
    try {
        onProgress?.('Analyzing full text...');
        const prompt = `You are an expert in information analysis. Your task is to extract all verifiable factual claims from the given text. Each claim must be COMPLETE and SELF-CONTAINED with all necessary context for verification.

CRITICAL REQUIREMENTS:
1. Include ALL names, titles, dates, and specific details
2. Never use pronouns (he, she, it, they) - always use the actual names
3. Each claim must be independently verifiable without referring to other claims
4. Include full titles of books, movies, works, etc.
5. Be specific about WHO did WHAT, WHEN, and WHERE

GOOD Examples:
- "Robert Heinlein wrote the novel 'The Unpleasant Profession of Jonathan Hoag'"
- "The novel 'The Unpleasant Profession of Jonathan Hoag' was first published in October 1942"
- "The Eiffel Tower is 324 meters tall"

BAD Examples (DO NOT DO THIS):
- "The novel is about..." (which novel?)
- "He wrote it in 1942" (who is "he"? what is "it"?)
- "It was published..." (what was published?)

Example Input:
"The novel 'Dune' by Frank Herbert was published in 1965. The book won the Hugo Award. It tells the story of Paul Atreides."

Example Output:
{
  "claims": [
    "Frank Herbert wrote the novel 'Dune'",
    "The novel 'Dune' was published in 1965",
    "The novel 'Dune' won the Hugo Award",
    "The novel 'Dune' tells the story of Paul Atreides"
  ]
}

**Text to Analyze:**
"${text}"
`;

        const result = await callOllama<{ claims: string[] }>(prompt, 'json');
        const claims = result?.claims || [];
        
        // If we got some claims, return them
        if (claims.length > 0) {
            console.log(`Successfully extracted ${claims.length} claims from full text`);
            onProgress?.(`Successfully extracted ${claims.length} facts from full text`);
            return claims;
        }
        
        // If no claims were extracted, fall back to chunk processing
        console.log("No claims extracted from full text, trying chunk-based approach...");
        onProgress?.('Full text analysis failed. Switching to chunk-based processing...');
        return await extractClaimsWithChunks(text, onProgress);
        
    } catch (error) {
        console.error("Error extracting claims from full text:", error);
        console.log("Falling back to chunk-based processing...");
        onProgress?.('Full text processing error. Falling back to chunk processing...');
        return await extractClaimsWithChunks(text, onProgress);
    }
}

// Fallback function that processes text in chunks
async function extractClaimsWithChunks(text: string, onProgress?: (message: string) => void): Promise<string[]> {
    const chunks = splitTextIntoChunks(text);
    console.log(`Processing text in ${chunks.length} chunks...`);
    onProgress?.(`Breaking text into ${chunks.length} chunks for processing...`);
    
    const allClaims: string[] = [];
    
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const progressMessage = `Processing chunk ${i + 1} of ${chunks.length}...`;
        console.log(`Processing chunk ${i + 1}/${chunks.length}: "${chunk.substring(0, 50)}..."`);
        onProgress?.(progressMessage);
        
        try {
            const chunkClaims = await extractClaimsFromChunk(chunk);
            if (chunkClaims.length > 0) {
                allClaims.push(...chunkClaims);
                console.log(`Extracted ${chunkClaims.length} claims from chunk ${i + 1}`);
                onProgress?.(`Chunk ${i + 1}: Found ${chunkClaims.length} facts (${allClaims.length} total so far)`);
            } else {
                onProgress?.(`Chunk ${i + 1}: No facts found`);
            }
            
            // Small delay between chunks to avoid overloading and allow UI updates
            if (i < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100)); // Reduced delay for better UX
            }
        } catch (error) {
            console.error(`Error processing chunk ${i + 1}:`, error);
            onProgress?.(`Error processing chunk ${i + 1}, continuing with next chunk...`);
            // Continue with next chunk even if this one fails
        }
    }
    
    // Remove duplicate claims
    const uniqueClaims = [...new Set(allClaims)];
    console.log(`Total claims extracted: ${uniqueClaims.length} (after deduplication)`);
    onProgress?.(`Completed! Found ${uniqueClaims.length} unique facts after removing duplicates`);
    
    return uniqueClaims;
}

export async function verifyClaim(claim: string): Promise<VerificationResult> {
    // Используем новый сервис проверки фактов с поиском по внешним источникам
    console.log(`Verifying claim with external sources: "${claim}"`);
    
    try {
        return await verifyFactWithSources(claim);
    } catch (error) {
        console.error(`Error verifying claim "${claim}":`, error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
        return {
            status: VerificationStatus.ERROR,
            explanation: `Произошла ошибка при проверке факта: ${errorMessage}`,
            confidence: 0,
            sources: [],
        };
    }
}

// No translation needed for geminiService.ts (already in English)
