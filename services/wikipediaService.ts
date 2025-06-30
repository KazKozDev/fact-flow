// Service for working with Wikipedia API
export interface WikipediaSearchResult {
  title: string;
  snippet: string;
  url: string;
  pageid: number;
}

export interface WikipediaPageContent {
  title: string;
  extract: string;
  url: string;
  pageid: number;
}

// Search for articles in Wikipedia
export const searchWikipedia = async (query: string, limit: number = 5): Promise<WikipediaSearchResult[]> => {
  try {
    const searchUrl = `https://en.wikipedia.org/api/rest_v1/page/search?q=${encodeURIComponent(query)}&limit=${limit}`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FactChecker/1.0 (https://example.com/contact)'
      }
    });

    if (!response.ok) {
      throw new Error(`Wikipedia search failed: ${response.status}`);
    }

    const data = await response.json();
    
    return data.pages?.map((page: any) => ({
      title: page.title,
      snippet: page.snippet || page.description || '',
      url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
      pageid: page.id
    })) || [];
  } catch (error) {
    console.error('Error searching Wikipedia:', error);
    return [];
  }
};

// Получение содержимого страницы Wikipedia
export const getWikipediaPageContent = async (title: string): Promise<WikipediaPageContent | null> => {
  try {
    const pageUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    
    const response = await fetch(pageUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'FactChecker/1.0 (https://example.com/contact)'
      }
    });

    if (!response.ok) {
      throw new Error(`Wikipedia page fetch failed: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      title: data.title,
      extract: data.extract || '',
      url: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
      pageid: data.pageid
    };
  } catch (error) {
    console.error('Error fetching Wikipedia page:', error);
    return null;
  }
};

// Поиск информации по конкретному факту
export const searchFactInWikipedia = async (fact: string): Promise<WikipediaSearchResult[]> => {
  // Извлекаем ключевые слова из факта для более точного поиска
  const keywords = extractKeywords(fact);
  const searchQuery = keywords.join(' ');
  
  return await searchWikipedia(searchQuery, 3);
};

// Простая функция для извлечения ключевых слов
const extractKeywords = (text: string): string[] => {
  // Удаляем стоп-слова и получаем значимые слова
  const stopWords = new Set([
    'the', 'is', 'are', 'was', 'were', 'has', 'have', 'had', 'will', 'would',
    'could', 'should', 'may', 'might', 'can', 'must', 'shall', 'a', 'an',
    'and', 'or', 'but', 'in', 'on', 'at', 'by', 'for', 'with', 'to', 'of',
    'это', 'есть', 'был', 'была', 'было', 'были', 'имеет', 'имел', 'будет',
    'мог', 'может', 'должен', 'и', 'или', 'но', 'в', 'на', 'с', 'для', 'от'
  ]);

  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
    .slice(0, 5); // Берем только первые 5 ключевых слов
};
