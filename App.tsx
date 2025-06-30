import React, { useState, useCallback } from 'react';
import { Claim, VerificationStatus, ProcessStage, ClaimStage } from './types';
import * as geminiService from './services/geminiService';
import * as publicationService from './services/publicationService';
import * as factVerificationService from './services/factVerificationService';
import { generateReportHtml } from './services/reportGenerator';
import Header from './components/Header';
import TextInputArea from './components/TextInputArea';
import ProcessSteps from './components/ProcessSteps';
import ExtractedFacts from './components/ExtractedFacts';
import FactVerificationDisplay from './components/FactVerificationDisplay';
import ResultsDisplay from './components/ResultsDisplay';
import Loader from './components/Loader';
import ErrorMessage from './components/ErrorMessage';
import Methodology from './components/Methodology';
import ExtractionProgress from './components/ExtractionProgress';

const App: React.FC = () => {
  const [inputText, setInputText] = useState<string>('');
  const [claims, setClaims] = useState<Claim[]>([]);
  const [currentStage, setCurrentStage] = useState<ProcessStage>(ProcessStage.INPUT);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // State for tracking fact verification progress
  const [verificationProgress, setVerificationProgress] = useState({
    currentIndex: 0,
    searchStage: 'wikipedia' as 'wikipedia' | 'duckduckgo' | 'analyzing' | 'completed',
    progress: 0,
    foundSources: 0,
  });

  // State for tracking fact extraction progress
  const [extractionProgress, setExtractionProgress] = useState({
    currentChunk: 0,
    totalChunks: 0,
    totalFacts: 0,
  });

  // Step 1: Fact extraction
  const handleExtractFacts = useCallback(async () => {
    if (!inputText.trim()) {
      setError("Please enter text for analysis.");
      return;
    }
    
    setError(null);
    setClaims([]);
    setIsLoading(true);
    setCurrentStage(ProcessStage.FACT_EXTRACTION);
    setExtractionProgress({
      currentChunk: 0,
      totalChunks: 0,
      totalFacts: 0,
    });

    try {
      setLoadingMessage('Extracting facts from your text...');
      
      // Check if the text is very large
      const textLength = inputText.length;
      if (textLength > 5000) {
        setLoadingMessage('Large text detected. Processing in chunks...');
      }
      
      // Progress callback to update UI during extraction
      const onProgress = (message: string) => {
        setLoadingMessage(message);
        
        // Parse progress information for chunk processing
        const chunkMatch = message.match(/Processing chunk (\d+) of (\d+)/);
        const factsMatch = message.match(/Found (\d+) facts \((\d+) total so far\)/);
        const chunksMatch = message.match(/Breaking text into (\d+) chunks/);
        
        if (chunksMatch) {
          setExtractionProgress(prev => ({
            ...prev,
            totalChunks: parseInt(chunksMatch[1])
          }));
        }
        
        if (chunkMatch) {
          setExtractionProgress(prev => ({
            ...prev,
            currentChunk: parseInt(chunkMatch[1]),
            totalChunks: parseInt(chunkMatch[2])
          }));
        }
        
        if (factsMatch) {
          setExtractionProgress(prev => ({
            ...prev,
            totalFacts: parseInt(factsMatch[2])
          }));
        }
      };
      
      const extractedClaimsText = await geminiService.extractClaims(inputText, onProgress);

      if (extractedClaimsText.length === 0) {
        // If no claims were extracted, provide more helpful error message
        const chunks = inputText.split(/\n\s*\n|\n/).filter(p => p.trim().length > 0);
        if (chunks.length > 1) {
          setError("Failed to extract verifiable facts from the text. The text may be too complex or contain mainly opinions rather than factual statements. Try simplifying the text or breaking it into smaller sections with clear factual claims.");
        } else {
          setError("Failed to extract verifiable facts from the text. Please ensure your text contains factual statements that can be verified, rather than opinions or subjective content.");
        }
        setIsLoading(false);
        setCurrentStage(ProcessStage.INPUT);
        return;
      }
      
      const extractedClaims: Claim[] = extractedClaimsText.map((claimText, index) => ({
        id: `claim-${index}-${Date.now()}`,
        claimText,
        status: VerificationStatus.PENDING,
        stage: ClaimStage.EXTRACTED,
        extractedAt: new Date(),
      }));
      
      setClaims(extractedClaims);
      setLoadingMessage('');
      setIsLoading(false);
    } catch (error) {
      console.error('Error extracting facts:', error);
      setError('An error occurred while extracting facts. Please try again with a shorter text or check your internet connection.');
      setIsLoading(false);
      setCurrentStage(ProcessStage.INPUT);
    }
  }, [inputText]);

  // Publishing a single fact
  const handlePublishClaim = useCallback(async (claimId: string) => {
    setIsLoading(true);
    setLoadingMessage('Publishing fact to the system...');

    try {
      const claimToPublish = claims.find(c => c.id === claimId);
      if (!claimToPublish) {
        throw new Error('Fact not found');
      }

      await publicationService.publishClaimToSystem(claimToPublish);
      
      setClaims(prevClaims => 
        prevClaims.map(claim => 
          claim.id === claimId 
            ? { ...claim, stage: ClaimStage.PUBLISHED, publishedAt: new Date() }
            : claim
        )
      );
    } catch (error) {
      console.error('Error publishing fact:', error);
      setError('Failed to publish fact. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [claims]);

  // Publishing all facts
  const handlePublishAllClaims = useCallback(async () => {
    const unpublishedClaims = claims.filter(claim => claim.stage === ClaimStage.EXTRACTED);
    
    if (unpublishedClaims.length === 0) {
      return;
    }

    setIsLoading(true);
    setLoadingMessage(`Publishing ${unpublishedClaims.length} facts to the system...`);

    try {
      // Publish all facts in parallel
      await Promise.all(
        unpublishedClaims.map(async (claim) => {
          await publicationService.publishClaimToSystem(claim);
          setClaims(prevClaims =>
            prevClaims.map(c =>
              c.id === claim.id
                ? { ...c, stage: ClaimStage.PUBLISHED, publishedAt: new Date() }
                : c
            )
          );
        })
      );
    } catch (error) {
      console.error('Error publishing facts:', error);
      setError('Failed to publish all facts. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [claims]);

  // Editing a fact
  const handleEditClaim = useCallback((claimId: string, newText: string) => {
    setClaims(prevClaims => 
      prevClaims.map(claim => 
        claim.id === claimId 
          ? { ...claim, claimText: newText.trim() }
          : claim
      )
    );
  }, []);

  // Deleting a fact
  const handleDeleteClaim = useCallback((claimId: string) => {
    setClaims(prevClaims => prevClaims.filter(claim => claim.id !== claimId));
  }, []);

  // Step 2: Verification of published facts using external sources
  const handleVerifyPublishedFacts = useCallback(async () => {
    const publishedClaims = claims.filter(claim => claim.stage === ClaimStage.PUBLISHED);
    
    if (publishedClaims.length === 0) {
      setError("No published facts available for verification.");
      return;
    }

    setIsLoading(true);
    setCurrentStage(ProcessStage.FACT_VERIFICATION);

    try {
      for (let i = 0; i < publishedClaims.length; i++) {
        const claim = publishedClaims[i];
        
        // Update progress state
        setVerificationProgress({
          currentIndex: i,
          searchStage: 'wikipedia',
          progress: 0,
          foundSources: 0,
        });
        
        setLoadingMessage(`Verifying fact ${i + 1} of ${publishedClaims.length}...`);
        
        // Function to update search progress
        const onProgress: factVerificationService.ProgressCallback = (stage, progress, foundSources = 0) => {
          setVerificationProgress({
            currentIndex: i,
            searchStage: stage,
            progress,
            foundSources,
          });
        };
        
        // Using the new fact verification service with external sources
        const verificationResult = await factVerificationService.verifyFactWithSources(claim.claimText, onProgress);
        
        const verifiedClaim: Claim = {
          ...claim,
          verification: verificationResult,
          status: verificationResult.status,
          stage: ClaimStage.VERIFIED,
          verifiedAt: new Date(),
        };
        
        setClaims(prevClaims => 
          prevClaims.map(c => c.id === claim.id ? verifiedClaim : c)
        );

        // Small pause between verifications
        if (i < publishedClaims.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      setCurrentStage(ProcessStage.COMPLETED);
    } catch (error) {
      console.error('Error verifying facts:', error);
      setError('An error occurred while verifying facts. Please try again.');
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
      setVerificationProgress({
        currentIndex: 0,
        searchStage: 'completed',
        progress: 100,
        foundSources: 0,
      });
    }
  }, [claims]);

  const handleReset = () => {
    setInputText('');
    setClaims([]);
    setError(null);
    setIsLoading(false);
    setCurrentStage(ProcessStage.INPUT);
    setExtractionProgress({
      currentChunk: 0,
      totalChunks: 0,
      totalFacts: 0,
    });
  };

  const handleDownloadReport = () => {
    const verifiedClaims = claims.filter(claim => claim.stage === ClaimStage.VERIFIED);
    const reportHtml = generateReportHtml(verifiedClaims, inputText);
    const reportWindow = window.open('', '_blank');
    if (reportWindow) {
      reportWindow.document.write(reportHtml);
      reportWindow.document.close();
    } else {
      setError("Failed to open a new window for the report. Check your popup blocker settings.");
    }
  };

  const publishedClaims = claims.filter(claim => claim.stage === ClaimStage.PUBLISHED);
  const verifiedClaims = claims.filter(claim => claim.stage === ClaimStage.VERIFIED);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {error && <ErrorMessage message={error} onClose={() => setError(null)} />}

          <ProcessSteps currentStage={currentStage} isLoading={isLoading} />

          {currentStage === ProcessStage.INPUT && (
            <TextInputArea
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onSubmit={handleExtractFacts}
              isLoading={isLoading}
            />
          )}

          {isLoading && currentStage === ProcessStage.FACT_EXTRACTION && (
            <ExtractionProgress
              message={loadingMessage}
              currentChunk={extractionProgress.currentChunk}
              totalChunks={extractionProgress.totalChunks}
              totalFacts={extractionProgress.totalFacts}
            />
          )}

          {isLoading && currentStage !== ProcessStage.FACT_EXTRACTION && <Loader message={loadingMessage} />}

          {claims.length > 0 && currentStage === ProcessStage.FACT_EXTRACTION && (
            <div>
              <ExtractedFacts
                claims={claims}
                onPublishClaim={handlePublishClaim}
                onPublishAll={handlePublishAllClaims}
                onEditClaim={handleEditClaim}
                onDeleteClaim={handleDeleteClaim}
                isLoading={isLoading}
              />
              {publishedClaims.length > 0 && (
                <div className="text-center mt-6">
                  <button
                    onClick={handleVerifyPublishedFacts}
                    disabled={isLoading || publishedClaims.length === 0}
                    className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    Proceed to fact verification ({publishedClaims.length})
                  </button>
                </div>
              )}
            </div>
          )}

          {currentStage === ProcessStage.FACT_VERIFICATION && (
            <FactVerificationDisplay
              claims={claims}
              currentlyVerifyingIndex={verificationProgress.currentIndex}
              searchStage={verificationProgress.searchStage}
              searchProgress={verificationProgress.progress}
              foundSources={verificationProgress.foundSources}
              onStartVerification={handleVerifyPublishedFacts}
              isLoading={isLoading}
            />
          )}

          {(currentStage === ProcessStage.FACT_VERIFICATION || currentStage === ProcessStage.COMPLETED) && verifiedClaims.length > 0 && (
            <div>              
              {/* Showing results */}
              <ResultsDisplay
                claims={verifiedClaims}
                onReset={handleReset}
                onDownloadReport={handleDownloadReport}
              />
            </div>
          )}

          {currentStage === ProcessStage.COMPLETED && <Methodology />}
        </div>
      </main>
      <footer className="text-left p-4 text-xs text-gray-500 max-w-4xl mx-auto">
        <p>Multi-stage fact checking using LLM to extract facts from the provided material and search the Internet for verification. The natural limitations of the system are the availability of relevant information on the Internet. Three external sources are used for verification.</p>
        <p className="mt-2">DISCLAIMER: This system is provided "as is" without warranties of any kind. For informational purposes only and not intended as professional advice. We are not responsible for the accuracy, completeness, or reliability of the information provided. Users are solely responsible for any decisions made based on this information. Please verify manually if necessary.</p>
        <p className="mt-2">© Artem Kazakov Kozlov 2025 · <a href="https://github.com/KazKozDev" className="underline hover:text-blue-600" target="_blank" rel="noopener noreferrer">KazKozDev</a> · <a href="mailto:kazkozdev@gmail.com" className="underline hover:text-blue-600">kazkozdev@gmail.com</a></p>
      </footer>
    </div>
  );
};

export default App;