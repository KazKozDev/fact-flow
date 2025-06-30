import React from 'react';
import { Source } from '../types';

interface SourcesDisplayProps {
  sources: Source[];
  className?: string;
}

const SourcesDisplay: React.FC<SourcesDisplayProps> = ({ sources, className = '' }) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className={`mt-4 ${className}`}>
      <h4 className="text-sm font-semibold text-gray-700 mb-2">
        📚 Sources ({sources.length}):
      </h4>
      <div className="space-y-2">
        {sources.map((source, index) => (
          <div
            key={index}
            className="p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-start space-x-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium">
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                    {getSourceType(source.web.uri)}
                  </span>
                </div>
                <h5 className="text-sm font-medium text-gray-900 mt-1 line-clamp-2">
                  {source.web.title}
                </h5>
                <a
                  href={source.web.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-1 block truncate"
                >
                  {formatUrl(source.web.uri)}
                </a>
              </div>
              <button
                onClick={() => window.open(source.web.uri, '_blank', 'noopener,noreferrer')}
                className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Open in new tab"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Определение типа источника по URL
const getSourceType = (url: string): string => {
  if (url.includes('wikipedia.org')) {
    return 'Wikipedia';
  } else if (url.includes('duckduckgo.com') || url === '#') {
    return 'DuckDuckGo';
  } else if (url.includes('.edu')) {
    return 'Education';
  } else if (url.includes('.gov')) {
    return 'Government';
  } else if (url.includes('.org')) {
    return 'Organization';
  } else {
    return 'Web Resource';
  }
};

// Форматирование URL для отображения
const formatUrl = (url: string): string => {
  if (url === '#') {
    return 'Search Result';
  }
  
  try {
    const urlObj = new URL(url);
    return urlObj.hostname + (urlObj.pathname !== '/' ? urlObj.pathname.slice(0, 30) + '...' : '');
  } catch {
    return url.slice(0, 50) + (url.length > 50 ? '...' : '');
  }
};

export default SourcesDisplay;
