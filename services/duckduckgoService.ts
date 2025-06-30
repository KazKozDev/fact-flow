// Service for working with DuckDuckGo via our Python API
export interface DuckDuckGoResult {
  abstract: string;
  abstractText: string;
  abstractSource: string;
  abstractURL: string;
  answer: string;
  answerType: string;
  definition: string;
  definitionSource: string;
  definitionURL: string;
  heading: string;
  image: string;
  redirect: string;
  relatedTopics: Array<{
    firstURL: string;
    text: string;
  }>;
  results: Array<{
    firstURL: string;
    text: string;
  }>;
  type: string;
}

export interface SimplifiedSearchResult {
  title: string;
  snippet: string;
  url: string;
  source: 'duckduckgo' | 'wikipedia';
}

// URL of our backend API
const BACKEND_API_URL = 'http://localhost:3001';

// Search via our Python backend
export const searchDuckDuckGoViaPython = async (query: string): Promise<SimplifiedSearchResult[]> => {
  try {
    console.log(`Searching DuckDuckGo via Python API for: "${query}"`);
    
    const response = await fetch(`${BACKEND_API_URL}/api/search/duckduckgo`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Backend API error: ${response.status} ${response.statusText} - ${errorData.error || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(`Search failed: ${data.error || 'Unknown error'}`);
    }
    
    console.log(`Found ${data.results.length} results from Python DuckDuckGo search`);
    return data.results || [];
    
  } catch (error) {
    console.error('Error in DuckDuckGo Python search:', error);
    
    // Fallback to simulation if backend is unavailable
    console.log('Falling back to simulated search...');
    return await simulateDuckDuckGoSearch(query);
  }
};

// Search via DuckDuckGo Instant Answer API
export const searchDuckDuckGo = async (query: string): Promise<DuckDuckGoResult | null> => {
  try {
    // DuckDuckGo Instant Answer API
    const searchUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FactChecker/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo search failed: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching DuckDuckGo:', error);
    return null;
  }
};

// Alternative search via HTML scraping (fallback)
export const searchDuckDuckGoWeb = async (query: string): Promise<SimplifiedSearchResult[]> => {
  try {
    // Use public API or create a proxy for search
    // Here we simulate results, as direct HTML scraping may be blocked by CORS
    console.log(`Searching DuckDuckGo for: ${query}`);
    
    // In a real application, there would be a request to your backend API here,
    // which performs the search and returns the results
    return await simulateDuckDuckGoSearch(query);
  } catch (error) {
    console.error('Error in DuckDuckGo web search:', error);
    return [];
  }
};

// Simulate DuckDuckGo search (replace with real API in production)
const simulateDuckDuckGoSearch = async (_query: string): Promise<SimplifiedSearchResult[]> => {
  // Вместо возврата мок-результатов возвращаем пустой массив
  return [];
};

// Fact search via DuckDuckGo (now uses Python backend)
export const searchFactInDuckDuckGo = async (fact: string): Promise<SimplifiedSearchResult[]> => {
  console.log(`Searching fact in DuckDuckGo: "${fact}"`);
  
  try {
    // Use new Python API
    const pythonResults = await searchDuckDuckGoViaPython(fact);
    
    if (pythonResults.length > 0) {
      console.log(`Python search returned ${pythonResults.length} results`);
      return pythonResults.slice(0, 3); // Limit to 3 results
    }
    
    // Fallback to old API if Python returned no results
    console.log('Python search returned no results, trying Instant Answer API...');
    return await searchFactInDuckDuckGoLegacy(fact);
    
  } catch (error) {
    console.error('Error in DuckDuckGo fact search:', error);
    
    // Fallback to old method
    console.log('Falling back to legacy search method...');
    return await searchFactInDuckDuckGoLegacy(fact);
  }
};

// Old search method (kept as fallback)
const searchFactInDuckDuckGoLegacy = async (fact: string): Promise<SimplifiedSearchResult[]> => {
  // First, try Instant Answer API
  const instantResult = await searchDuckDuckGo(fact);
  
  const results: SimplifiedSearchResult[] = [];
  
  if (instantResult) {
    // Process Instant Answer results
    if (instantResult.abstract) {
      results.push({
        title: instantResult.heading || 'DuckDuckGo Instant Answer',
        snippet: instantResult.abstractText || instantResult.abstract,
        url: instantResult.abstractURL || '#',
        source: 'duckduckgo'
      });
    }
    
    if (instantResult.answer) {
      results.push({
        title: 'Direct Answer',
        snippet: instantResult.answer,
        url: '#',
        source: 'duckduckgo'
      });
    }
    
    // Add related topics
    if (instantResult.relatedTopics && instantResult.relatedTopics.length > 0) {
      instantResult.relatedTopics.slice(0, 2).forEach(topic => {
        results.push({
          title: 'Related Topic',
          snippet: topic.text,
          url: topic.firstURL || '#',
          source: 'duckduckgo'
        });
      });
    }
  }
  
  // If there are few results, add simulation
  if (results.length < 2) {
    const webResults = await simulateDuckDuckGoSearch(fact);
    results.push(...webResults);
  }
  
  return results.slice(0, 3); // Limit the number of results
};
