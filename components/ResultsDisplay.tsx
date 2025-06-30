import React, { useMemo } from 'react';
import { Claim, VerificationStatus } from '../types';
import ClaimCard from './ClaimCard';
import StatisticsChart from './StatisticsChart';
import { DownloadIcon } from './icons/Icons';

interface ResultsDisplayProps {
  claims: Claim[];
  onReset: () => void;
  onDownloadReport: () => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ claims, onReset, onDownloadReport }) => {
  const summary = useMemo(() => {
    const total = claims.length;
    const verified = claims.filter(c => c.status === VerificationStatus.VERIFIED).length;
    const unverified = claims.filter(c => c.status === VerificationStatus.UNVERIFIED).length;
    const misleading = claims.filter(c => c.status === VerificationStatus.MISLEADING).length;
    const pending = claims.filter(c => c.status === VerificationStatus.PENDING).length;
    const errors = claims.filter(c => c.status === VerificationStatus.ERROR).length;
    
    const completedClaims = claims.filter(c => c.verification);
    const averageConfidence = completedClaims.length > 0
      ? Math.round(completedClaims.reduce((acc, c) => acc + (c.verification?.confidence || 0), 0) / completedClaims.length)
      : 0;

    return { total, verified, unverified, misleading, pending, errors, averageConfidence };
  }, [claims]);

  const analysisComplete = summary.pending === 0;

  return (
    <div className="mt-8">
      <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 mb-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
                <h2 className="text-xl font-bold text-gray-800">
                  📊 Fact-Check Report
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {analysisComplete ? 'Verification complete.' : 'Verification in progress...'}
                </p>
            </div>
            {analysisComplete && (
                 <div className="flex items-center gap-2">
                    <button 
                        onClick={onReset}
                        className="px-4 py-2 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 transition-colors duration-200 text-sm"
                    >
                        New Analysis
                    </button>
                    <button
                        onClick={onDownloadReport}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 text-sm"
                    >
                        <DownloadIcon className="w-4 h-4" />
                        Download Report
                    </button>
                 </div>
            )}
        </div>
        
        {/* Statistics Chart */}
        {analysisComplete && summary.total > 0 && (
          <div className="mt-6">
            <StatisticsChart 
              verified={summary.verified}
              unverified={summary.unverified}
              misleading={summary.misleading}
              total={summary.total}
            />
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{summary.total}</div>
            <div className="text-sm font-medium text-blue-800">Total Facts</div>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{summary.verified}</div>
            <div className="text-sm font-medium text-green-800">Verified</div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{summary.unverified}</div>
            <div className="text-sm font-medium text-red-800">Unverified</div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{summary.misleading}</div>
            <div className="text-sm font-medium text-yellow-800">Misleading</div>
          </div>
        </div>
        {analysisComplete && summary.total > 0 && (
            <div className="mt-6">
                <label className="font-semibold text-gray-700">Overall Confidence</label>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${summary.averageConfidence}%` }}></div>
                </div>
                <p className="text-right text-sm text-gray-600 font-medium mt-1">{summary.averageConfidence}%</p>
            </div>
        )}

      </div>

      <div className="space-y-4">
        {claims.map((claim) => (
          <ClaimCard key={claim.id} claim={claim} />
        ))}
      </div>
    </div>
  );
};

export default ResultsDisplay;