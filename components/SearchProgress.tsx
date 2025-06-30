import React from 'react';

interface SearchProgressProps {
  currentClaim: string;
  searchStage: 'wikipedia' | 'duckduckgo' | 'analyzing' | 'completed';
  progress: number;
  foundSources: number;
}

const SearchProgress: React.FC<SearchProgressProps> = ({ 
  currentClaim, 
  searchStage, 
  progress, 
  foundSources 
}) => {
  const getStageInfo = () => {
    switch (searchStage) {
      case 'wikipedia':
        return {
          icon: '📚',
          text: 'Searching Wikipedia',
          color: 'text-blue-600'
        };
      case 'duckduckgo':
        return {
          icon: '🔍',
          text: 'Searching DuckDuckGo',
          color: 'text-green-600'
        };
      case 'analyzing':
        return {
          icon: '🤖',
          text: 'AI Analysis',
          color: 'text-purple-600'
        };
      case 'completed':
        return {
          icon: '✅',
          text: 'Completed',
          color: 'text-green-700'
        };
      default:
        return {
          icon: '',
          text: '',
          color: ''
        };
    }
  };

  const stageInfo = getStageInfo();

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
      <div className="flex items-center space-x-3 mb-3">
        <span className="text-2xl">{stageInfo.icon}</span>
        <div className="flex-1 min-w-0 container-responsive">
          <h4 className={`font-semibold ${stageInfo.color}`}>
            {stageInfo.text}
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed text-wrap-enhanced">
            {currentClaim}
          </p>
        </div>
        {foundSources > 0 && (
          <div className="text-right">
            <span className="text-sm font-medium text-gray-700">
              Sources found: {foundSources}
            </span>
          </div>
        )}
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500 mt-1">
        <span>Progress</span>
        <span>{Math.round(progress)}%</span>
      </div>
      
      {searchStage === 'analyzing' && (
        <div className="mt-3 flex items-center text-sm text-gray-600">
          <div className="animate-pulse mr-2">🧠</div>
          <span>AI is analyzing the found information...</span>
        </div>
      )}
    </div>
  );
};

export default SearchProgress;
