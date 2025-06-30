import React from 'react';
import { Claim, ClaimStage } from '../types';

interface ExtractedFactsProps {
  claims: Claim[];
  onPublishClaim: (claimId: string) => void;
  onPublishAll: () => void;
  onEditClaim: (claimId: string, newText: string) => void;
  onDeleteClaim: (claimId: string) => void;
  isLoading: boolean;
}

const ExtractedFacts: React.FC<ExtractedFactsProps> = ({
  claims,
  onPublishClaim,
  onPublishAll,
  onEditClaim,
  onDeleteClaim,
  isLoading,
}) => {
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editText, setEditText] = React.useState<string>('');

  const handleEditStart = (claim: Claim) => {
    setEditingId(claim.id);
    setEditText(claim.claimText);
  };

  const handleEditSave = (claimId: string) => {
    onEditClaim(claimId, editText);
    setEditingId(null);
    setEditText('');
  };

  const handleEditCancel = () => {
    setEditingId(null);
    setEditText('');
  };

  const extractedClaims = claims.filter(claim => claim.stage === ClaimStage.EXTRACTED);
  const publishedClaims = claims.filter(claim => claim.stage === ClaimStage.PUBLISHED);

  if (claims.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          📋 Facts for Verification ({claims.length})
        </h2>
        {extractedClaims.length > 0 && (
          <button
            onClick={onPublishAll}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Publishing...' : 'Publish All'}
          </button>
        )}
      </div>

      <div className="space-y-4">
        {claims.map((claim) => (
          <div
            key={claim.id}
            className={`border rounded-lg p-4 transition-all duration-300 ${
              claim.stage === ClaimStage.PUBLISHED
                ? 'border-green-300 bg-green-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                {editingId === claim.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditSave(claim.id)}
                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleEditCancel}
                        className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-gray-800 leading-relaxed text-wrap-enhanced">{claim.claimText}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            claim.stage === ClaimStage.PUBLISHED
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {claim.stage === ClaimStage.PUBLISHED ? '✓ Published' : '⏳ Extracted'}
                        </span>
                        {claim.extractedAt && (
                          <span className="text-xs text-gray-500">
                            Extracted: {claim.extractedAt.toLocaleTimeString()}
                          </span>
                        )}
                        {claim.publishedAt && (
                          <span className="text-xs text-gray-500">
                            Published: {claim.publishedAt.toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      <div className="flex space-x-2">
                        {claim.stage === ClaimStage.EXTRACTED && (
                          <>
                            <button
                              onClick={() => handleEditStart(claim)}
                              className="text-gray-800 hover:text-blue-800 text-sm"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => onDeleteClaim(claim.id)}
                              className="text-gray-800 hover:text-red-800 text-sm"
                            >
                              🗑️ Delete
                            </button>
                            <button
                              onClick={() => onPublishClaim(claim.id)}
                              disabled={isLoading}
                              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
                            >
                              Publish
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {publishedClaims.length > 0 && (
        <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">
            ✅ Published facts: {publishedClaims.length} out of {claims.length}
          </p>
          <p className="text-green-600 text-sm mt-1">
            Published facts are ready for review in the next stage.
          </p>
        </div>
      )}
    </div>
  );
};

export default ExtractedFacts;
