import { VerificationResult, VerificationStatus, Source } from '../types';
import * as wikipediaService from './wikipediaService';
import * as duckduckgoService from './duckduckgoService';

export interface SearchEvidence {
  sources: Array<{
    title: string;
    snippet: string;
    url: string;
    source: 'wikipedia' | 'duckduckgo';
  }>;
  searchQuery: string;
}

export interface ProgressCallback {
  (stage: 'wikipedia' | 'duckduckgo' | 'analyzing' | 'completed', progress: number, foundSources?: number): void;
}

// Main function for fact verification using external sources
export const verifyFactWithSources = async (
  claim: string, 
  onProgress?: ProgressCallback
): Promise<VerificationResult> => {
  try {
    console.log(`Starting fact verification for: "${claim}"`);
    
    // Step 1: Search for evidence
    const evidence = await gatherEvidence(claim, onProgress);
    
    if (evidence.sources.length === 0) {
      onProgress?.('completed', 100, 0);
      return {
        status: VerificationStatus.UNVERIFIED,
        explanation: 'Not enough information found to verify this fact.',
        confidence: 0,
        sources: [],
      };
    }
    
    // Step 2: Interpret results using LLM
    onProgress?.('analyzing', 70, evidence.sources.length);
    const interpretation = await interpretEvidenceWithLLM(claim, evidence);
    
    onProgress?.('completed', 100, evidence.sources.length);
    return interpretation;
  } catch (error) {
    console.error('Error in fact verification:', error);
    return {
      status: VerificationStatus.ERROR,
      explanation: `An error occurred while verifying the fact: ${error instanceof Error ? error.message : 'Unknown error'}`,
      confidence: 0,
      sources: [],
    };
  }
};

// Сбор доказательств из различных источников
const gatherEvidence = async (claim: string, onProgress?: ProgressCallback): Promise<SearchEvidence> => {
  console.log(`Gathering evidence for: "${claim}"`);
  
  const sources: SearchEvidence['sources'] = [];
  
  try {
    // Поиск в Wikipedia
    onProgress?.('wikipedia', 10);
    console.log('Searching Wikipedia...');
    const wikipediaResults = await wikipediaService.searchFactInWikipedia(claim);
    
    for (const result of wikipediaResults) {
      sources.push({
        title: result.title,
        snippet: result.snippet,
        url: result.url,
        source: 'wikipedia'
      });
    }
    
    onProgress?.('wikipedia', 40, sources.length);
    
    // Поиск в DuckDuckGo
    onProgress?.('duckduckgo', 50);
    console.log('Searching DuckDuckGo...');
    const duckduckgoResults = await duckduckgoService.searchFactInDuckDuckGo(claim);
    
    for (const result of duckduckgoResults) {
      sources.push({
        title: result.title,
        snippet: result.snippet,
        url: result.url,
        source: 'duckduckgo'
      });
    }
    
    onProgress?.('duckduckgo', 70, sources.length);
    console.log(`Found ${sources.length} sources for fact verification`);
    
  } catch (error) {
    console.error('Error gathering evidence:', error);
  }
  
  return {
    sources: sources.slice(0, 6), // Ограничиваем количество источников
    searchQuery: claim
  };
};

// Интерпретация доказательств с помощью LLM
const interpretEvidenceWithLLM = async (claim: string, evidence: SearchEvidence): Promise<VerificationResult> => {
  const sourcesText = evidence.sources
    .map((source, index) => 
      `Источник ${index + 1} (${source.source}):\nЗаголовок: ${source.title}\nСодержание: ${source.snippet}\nURL: ${source.url}\n`
    ).join('\n');

  const prompt = `You are a fact-checking expert. Your task is to analyze the claim based on the provided sources and give an objective assessment.

**CLAIM TO VERIFY:**
"${claim}"

**FOUND SOURCES:**
${sourcesText}

**INSTRUCTIONS:**
1. Carefully analyze the claim and compare it with the information from the sources.
2. Determine the status EXACTLY based on factual correspondence:
   - "Verified": The claim FULLY and ACCURATELY MATCHES the sources
   - "Misleading": The claim CONTRADICTS the sources, DISTORTS facts, or contains INACCURACIES
   - "Unverified": Not enough information to determine
3. In the explanation, you MUST specify:
   - What exactly the claim says
   - What the sources show
   - Whether there is a contradiction or correspondence
   - Use words like "contradicts", "does not match", "confirmed", "matches"
4. Assess confidence from 0 to 100

**CRITICALLY IMPORTANT - CONTRADICTION CHECK:**
- NEGATION vs AFFIRMATION: "does NOT have" vs "HAS" = Misleading
- DIFFERENT FACTS: "YES" vs "NO", different dates, numbers, names = Misleading
- OPPOSITES: any contradiction between the claim and the sources = Misleading
- DISTORTIONS: even minor factual inaccuracies = Misleading

**ANALYSIS EXAMPLES:**
- Claim: "Elon Musk has no children" + Source: "Elon Musk has children" → Misleading (contradicts sources)
- Claim: "Bitcoin was created in 2009" + Source: "Bitcoin was created in 2008" → Misleading (inaccurate date)
- Claim: "Paris is the capital of France" + Source: "Paris is the capital of France" → Verified (fully matches)

In the explanation, you MUST use phrases like:
- "The claim contradicts the sources..."
- "Sources show that..."
- "This claim does not match the facts..."
- "The claim is confirmed by the sources..."

Respond in JSON format:
{
  "status": "Verified | Unverified | Misleading",
  "explanation": "Detailed explanation with clear indication of correspondence/contradiction and references to sources",
  "confidence": <number from 0 to 100>
}`;

  try {
    // Используем существующий метод callOllama из geminiService
    const result = await callOllamaForFactCheck(prompt);
    
    if (!result) {
      throw new Error('LLM не вернул результат');
    }
    
    // Преобразуем источники в нужный формат
    const formattedSources: Source[] = evidence.sources.map(source => ({
      web: {
        uri: source.url,
        title: source.title
      }
    }));
    
    // Дополнительная проверка логики на основе анализа объяснения
    console.log(`🔍 Original LLM response: status="${result.status}", confidence=${result.confidence}`);
    console.log(`📝 LLM explanation preview: "${result.explanation.substring(0, 150)}..."`);
    
    const correctedStatus = validateStatusAgainstExplanation(
      claim, 
      result.status, 
      result.explanation
    );
    
    if (correctedStatus !== result.status) {
      console.log(`🔧 Status corrected: ${result.status} → ${correctedStatus}`);
    }
    
    return {
      status: mapStatusToEnum(correctedStatus),
      explanation: result.explanation,
      confidence: result.confidence,
      sources: formattedSources,
    };
    
  } catch (error) {
    console.error('Error interpreting evidence with LLM:', error);
    
    // Fallback: базовая интерпретация без LLM
    return createFallbackInterpretation(claim, evidence);
  }
};

// Вспомогательная функция для вызова LLM (копируем логику из geminiService)
const callOllamaForFactCheck = async (prompt: string): Promise<{status: string, explanation: string, confidence: number} | null> => {
  const OLLAMA_API_URL = 'http://localhost:11434/api/generate';
  const OLLAMA_MODEL = 'gemma3n:e4b';

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
        format: 'json',
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API responded with status ${response.status}`);
    }

    const data = await response.json();
    if (data.response) {
      return JSON.parse(data.response);
    }
    return null;
  } catch (error) {
    console.error("Error calling Ollama for fact check:", error);
    return null;
  }
};

// Валидация статуса на основе анализа объяснения LLM
const validateStatusAgainstExplanation = (
  claim: string, 
  originalStatus: string, 
  explanation: string
): string => {
  console.log(`Validating status: ${originalStatus} against explanation for claim: "${claim}"`);
  
  // Ключевые слова и фразы, указывающие на ложность утверждения
  const misleadingKeywords = [
    'противоречит',
    'не соответствует',
    'неверно',
    'ложно',
    'ошибочно',
    'неточно',
    'искажает',
    'не подтверждается',
    'опровергается',
    'несоответствие',
    'противоположно',
    'неправильно',
    'не имеет',
    'нет детей',
    'нет жены',
    'нет мужа',
    'отрицает',
    'опровергнуто',
    'фактически неверно',
    'на самом деле',
    'в действительности',
    'показывают обратное',
    'указывают на то, что',
    'свидетельствуют о том, что не'
  ];

  // Ключевые слова, указывающие на подтверждение
  const verifiedKeywords = [
    'подтверждается',
    'соответствует',
    'верно',
    'правильно',
    'точно',
    'корректно',
    'подтверждают',
    'согласуется',
    'совпадает',
    'подкрепляется'
  ];

  const explanationLower = explanation.toLowerCase();
  // Проверяем на наличие ключевых слов, указывающих на ложность
  const hasMisleadingIndicators = misleadingKeywords.some(keyword => 
    explanationLower.includes(keyword.toLowerCase())
  );
  // Проверяем на наличие ключевых слов, указывающих на подтверждение
  const hasVerifiedIndicators = verifiedKeywords.some(keyword => 
    explanationLower.includes(keyword.toLowerCase())
  );
  // Специфичные паттерны для анализа противоречий
  const contradictionPatterns = [
    /(?:источники?\s+(?:показывают|указывают|утверждают|говорят)\s+(?:что\s+)?(?:у\s+\w+\s+(?:есть|имеется)|существует))/i,
    /(?:на\s+самом\s+деле|в\s+действительности|фактически)\s+(?:у\s+\w+\s+(?:есть|имеется)|существует)/i,
    /(?:утверждение\s+(?:неверно|ложно|неточно|противоречит))/i,
    /(?:не\s+соответствует\s+(?:данным|информации|фактам))/i
  ];
  const hasContradictionPattern = contradictionPatterns.some(pattern => 
    pattern.test(explanation)
  );
  
  console.log(`Analysis results:
    - Original status: ${originalStatus}
    - Has misleading indicators: ${hasMisleadingIndicators}
    - Has verified indicators: ${hasVerifiedIndicators}
    - Has contradiction pattern: ${hasContradictionPattern}
    - Explanation preview: ${explanation.substring(0, 200)}...`);
  
  // Логика принятия решения
  if (originalStatus.toLowerCase() === 'verified') {
    // Если статус "Verified", но объяснение указывает на противоречие - меняем на Misleading
    if (hasMisleadingIndicators || hasContradictionPattern) {
      console.log('⚠️ Status correction: Verified -> Misleading (based on explanation analysis)');
      return 'Misleading';
    }
  }
  
  if (originalStatus.toLowerCase() === 'misleading') {
    // Если статус "Misleading", но объяснение четко подтверждает - можем оставить или поменять
    if (hasVerifiedIndicators && !hasMisleadingIndicators && !hasContradictionPattern) {
      console.log('⚠️ Status correction: Misleading -> Verified (based on explanation analysis)');
      return 'Verified';
    }
  }
  
  if (originalStatus.toLowerCase() === 'unverified') {
    // Если статус "Unverified", но есть четкие индикаторы - корректируем
    if (hasMisleadingIndicators || hasContradictionPattern) {
      console.log('⚠️ Status correction: Unverified -> Misleading (based on explanation analysis)');
      return 'Misleading';
    } else if (hasVerifiedIndicators && !hasMisleadingIndicators) {
      console.log('⚠️ Status correction: Unverified -> Verified (based on explanation analysis)');
      return 'Verified';
    }
  }
  
  console.log(`✅ Status validation passed: keeping original status "${originalStatus}"`);
  return originalStatus;
};

// Преобразование статуса в enum
const mapStatusToEnum = (status: string): VerificationStatus => {
  switch (String(status).toLowerCase()) {
    case 'verified':
      return VerificationStatus.VERIFIED;
    case 'unverified':
      return VerificationStatus.UNVERIFIED;
    case 'misleading':
      return VerificationStatus.MISLEADING;
    default:
      return VerificationStatus.ERROR;
  }
};

// Fallback интерпретация без LLM
const createFallbackInterpretation = (_claim: string, evidence: SearchEvidence): VerificationResult => {
  const sourceCount = evidence.sources.length;
  const wikipediaSources = evidence.sources.filter(s => s.source === 'wikipedia').length;
  
  let status: VerificationStatus;
  let confidence: number;
  let explanation: string;
  
  if (sourceCount === 0) {
    status = VerificationStatus.UNVERIFIED;
    confidence = 0;
    explanation = 'No sources found to verify this statement.';
  } else if (wikipediaSources > 0) {
    status = VerificationStatus.VERIFIED;
    confidence = Math.min(60 + (sourceCount * 10), 85);
    explanation = `Found ${sourceCount} sources, including ${wikipediaSources} from Wikipedia. Additional verification is required for a final conclusion.`;
  } else {
    status = VerificationStatus.UNVERIFIED;
    confidence = Math.min(30 + (sourceCount * 5), 50);
    explanation = `Found ${sourceCount} sources, but more detailed analysis is required for a final conclusion.`;
  }
  
  const formattedSources: Source[] = evidence.sources.map(source => ({
    web: {
      uri: source.url,
      title: source.title
    }
  }));
  
  return {
    status,
    explanation,
    confidence,
    sources: formattedSources,
  };
};
