import React, { useState } from 'react';
import { Claim, ClaimStage } from '../types';
import SearchProgress from './SearchProgress';

interface FactVerificationDisplayProps {
  claims: Claim[];
  currentlyVerifyingIndex: number;
  searchStage: 'wikipedia' | 'duckduckgo' | 'analyzing' | 'completed';
  searchProgress: number;
  foundSources: number;
  onStartVerification: () => void;
  isLoading: boolean;
}

const FactVerificationDisplay: React.FC<FactVerificationDisplayProps> = ({
  claims,
  currentlyVerifyingIndex,
  searchStage,
  searchProgress,
  foundSources,
  onStartVerification,
  isLoading,
}) => {
  const [showDetails, setShowDetails] = useState(true);
  
  const publishedClaims = claims.filter(claim => claim.stage === ClaimStage.PUBLISHED);
  const verifiedClaims = claims.filter(claim => claim.stage === ClaimStage.VERIFIED);
  const currentClaim = publishedClaims[currentlyVerifyingIndex];

  if (publishedClaims.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
        <div className="text-yellow-600 text-4xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-yellow-800 mb-2">
          No published facts for verification
        </h3>
        <p className="text-yellow-700">
          First, extract and publish facts from your text.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок секции */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              🔍 Fact verification using external sources
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Internet search with subsequent AI analysis
            </p>
          </div>
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-gray-500 hover:text-gray-700"
          >
            {showDetails ? '🔼' : '🔽'}
          </button>
        </div>

        {/* Статистика */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{publishedClaims.length}</div>
            <div className="text-sm text-blue-800">To verify</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{verifiedClaims.length}</div>
            <div className="text-sm text-green-800">Verified</div>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{foundSources}</div>
            <div className="text-sm text-purple-800">Sources found</div>
          </div>
        </div>

        {/* Кнопка запуска */}
        {!isLoading && verifiedClaims.length < publishedClaims.length && (
          <div className="text-center">
            <button
              onClick={onStartVerification}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {verifiedClaims.length === 0 
                ? '🚀 Начать проверку фактов' 
                : `📝 Продолжить проверку (${publishedClaims.length - verifiedClaims.length} осталось)`
              }
            </button>
          </div>
        )}
      </div>

      {/* Детали процесса */}
      {showDetails && (
        <div className="space-y-4">
          {/* Прогресс поиска */}
          {isLoading && currentClaim && (
            <SearchProgress
              currentClaim={currentClaim.claimText}
              searchStage={searchStage}
              progress={searchProgress}
              foundSources={foundSources}
            />
          )}

          {/* Список фактов для проверки */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              📋 Facts for Verification
            </h3>
            <div className="space-y-3">
              {publishedClaims.map((claim, index) => {
                const isCurrentlyVerifying = isLoading && index === currentlyVerifyingIndex;
                const isVerified = claim.stage === ClaimStage.VERIFIED;
                const isNext = !isLoading && index === verifiedClaims.length && !isVerified;

                return (
                  <div
                    key={claim.id}
                    className={`p-4 border rounded-lg transition-all duration-300 break-words ${
                      isCurrentlyVerifying
                        ? 'border-blue-400 bg-blue-50'
                        : isVerified
                        ? 'border-green-300 bg-green-50'
                        : isNext
                        ? 'border-yellow-300 bg-yellow-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isCurrentlyVerifying
                          ? 'bg-blue-500 text-white animate-pulse'
                          : isVerified
                          ? 'bg-green-500 text-white'
                          : isNext
                          ? 'bg-yellow-500 text-white'
                          : 'bg-gray-300 text-gray-700'
                      }`}>
                        {isVerified ? '✓' : isCurrentlyVerifying ? '🔍' : index + 1}
                      </span>
                      <div className="flex-1 min-w-0 container-responsive">
                        <p className="text-sm text-gray-800 leading-relaxed text-wrap-enhanced">
                          {claim.claimText}
                        </p>
                        {isCurrentlyVerifying && (
                          <div className="mt-2 flex items-center text-xs text-blue-600">
                            <div className="animate-spin mr-2">⏳</div>
                            Checking now...
                          </div>
                        )}
                        {isVerified && claim.verification && (
                          <div className="mt-2 flex items-center text-xs text-green-600">
                            <span>✅ Проверено ({claim.verification.confidence}% уверенности)</span>
                          </div>
                        )}
                        {isNext && (
                          <div className="mt-2 text-xs text-yellow-600">
                            📌 Следующий для проверки
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FactVerificationDisplay;
