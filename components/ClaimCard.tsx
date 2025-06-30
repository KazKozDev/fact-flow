import React from 'react';
import { Claim, VerificationStatus, Source } from '../types';
import { VerifiedIcon, UnverifiedIcon, MisleadingIcon, PendingIcon, ErrorIcon } from './icons/Icons';
import SourcesDisplay from './SourcesDisplay';

interface ClaimCardProps {
  claim: Claim;
}

const getStatusInfo = (status: VerificationStatus) => {
  switch (status) {
    case VerificationStatus.VERIFIED:
      return {
        Icon: VerifiedIcon,
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-300',
        title: '✅ Verified',
      };
    case VerificationStatus.UNVERIFIED:
      return {
        Icon: UnverifiedIcon,
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-300',
        title: '❌ Not Verified',
      };
    case VerificationStatus.MISLEADING:
      return {
        Icon: MisleadingIcon,
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-300',
        title: '⚠️ Misleading',
      };
    case VerificationStatus.ERROR:
      return {
        Icon: ErrorIcon,
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-300',
        title: 'Error',
      };
    case VerificationStatus.PENDING:
      return {
        Icon: PendingIcon,
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-300',
        title: '⏳ Pending',
      };
    default:
      return {
        Icon: PendingIcon,
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-300',
        title: 'Unknown',
      };
  }
};

const ConfidenceBar: React.FC<{ value: number; status: VerificationStatus }> = ({ value, status }) => {
    const colorClasses = {
        [VerificationStatus.VERIFIED]: 'bg-green-500',
        [VerificationStatus.UNVERIFIED]: 'bg-red-500',
        [VerificationStatus.MISLEADING]: 'bg-yellow-500',
        [VerificationStatus.ERROR]: 'bg-gray-400',
        [VerificationStatus.PENDING]: 'bg-blue-400 animate-pulse',
    };
    return (
        <div>
            <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">📊 Confidence</span>
                <span className="text-sm font-medium text-gray-700">{value}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div className={`${colorClasses[status]} h-2 rounded-full`} style={{ width: `${value}%` }}></div>
            </div>
        </div>
    );
};

const renderExplanationWithLinks = (explanation: string, sources: Source[]) => {
    if (!sources || sources.length === 0) {
        return <p className="text-gray-600 text-sm mt-1">{explanation}</p>;
    }

    // This regex splits the string by citation markers like [1], keeping the markers in the resulting array.
    const parts = explanation.split(/(\[\d+\])/g);

    return (
        <p className="text-gray-600 text-sm mt-1 leading-relaxed">
            {parts.map((part, index) => {
                const match = part.match(/\[(\d+)\]/);
                if (match) {
                    const sourceIndex = parseInt(match[1], 10) - 1;
                    if (sources[sourceIndex] && sources[sourceIndex].web.uri) {
                        return (
                            <a
                                key={index}
                                href={sources[sourceIndex].web.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mx-0.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 font-bold rounded-md text-xs hover:bg-blue-200 hover:underline align-middle"
                                title={`Source: ${sources[sourceIndex].web.title || sources[sourceIndex].web.uri}`}
                            >
                                {match[1]}
                            </a>
                        );
                    }
                }
                return part;
            })}
        </p>
    );
};


const ClaimCard: React.FC<ClaimCardProps> = ({ claim }) => {
  const { Icon, bgColor, textColor, borderColor, title } = getStatusInfo(claim.status);

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${borderColor} overflow-hidden`}>
      <div className={`p-4 ${bgColor}`}>
        <div className="flex items-center">
          <Icon className={`w-6 h-6 mr-3 ${textColor}`} />
          <h3 className={`text-lg font-bold ${textColor}`}>{title}</h3>
        </div>
      </div>

      <div className="p-5">
        <blockquote className="border-l-4 border-gray-300 pl-4 py-2 my-2">
            <p className="text-base text-gray-700 italic text-wrap-enhanced">"{claim.claimText}"</p>
        </blockquote>
        
        {claim.verification && (
          <div className="mt-4 space-y-4">
            <div>
              <h4 className="font-semibold text-gray-800">📋 Explanation</h4>
              {renderExplanationWithLinks(claim.verification.explanation, claim.verification.sources)}
            </div>
            <ConfidenceBar value={claim.verification.confidence} status={claim.status} />
            <SourcesDisplay sources={claim.verification.sources} />
          </div>
        )}

        {claim.status === VerificationStatus.PENDING && (
            <div className="mt-4 flex items-center text-gray-500">
                 <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                <span>Checking fact...</span>
            </div>
        )}
      </div>
    </div>
  );
};

export default ClaimCard;