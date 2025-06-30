import React from 'react';

interface ExtractionProgressProps {
  message: string;
  currentChunk: number;
  totalChunks: number;
  totalFacts: number;
}

const ExtractionProgress: React.FC<ExtractionProgressProps> = ({
  message,
  currentChunk,
  totalChunks,
  totalFacts
}) => {
  const progressPercentage = totalChunks > 0 ? Math.round((currentChunk / totalChunks) * 100) : 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 mb-4">
      <div className="flex items-center space-x-3 mb-4">
        <span className="text-2xl">⚡</span>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-blue-600 mb-1">
            Extracting Facts from Text
          </h4>
          <p className="text-sm text-gray-600 text-wrap-enhanced">
            {message}
          </p>
        </div>
        {totalFacts > 0 && (
          <div className="text-right">
            <span className="text-sm font-medium text-green-600">
              Facts found: {totalFacts}
            </span>
          </div>
        )}
      </div>
      
      {totalChunks > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress: {currentChunk} / {totalChunks} chunks</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>
      )}
      
      {totalChunks === 0 && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      )}
    </div>
  );
};

export default ExtractionProgress;
