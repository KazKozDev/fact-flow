import { Claim, ClaimStage } from '../types';

// API simulation for publishing facts to the system
export const publishClaimToSystem = async (claim: Claim): Promise<boolean> => {
  // No artificial delay
  // Simulate successful publication
  console.log(`Fact published to the system: ${claim.claimText}`);
  return true;
};

export const publishMultipleClaimsToSystem = async (claims: Claim[]): Promise<Claim[]> => {
  const publishedClaims: Claim[] = [];
  
  for (const claim of claims) {
    try {
      await publishClaimToSystem(claim);
      publishedClaims.push({
        ...claim,
        stage: ClaimStage.PUBLISHED,
        publishedAt: new Date(),
      });
    } catch (error) {
      console.error(`Error publishing claim "${claim.claimText}":`, error);
      // You can add error handling logic here
      throw error;
    }
  }
  
  return publishedClaims;
};

// Simulate getting publication status
export const getPublicationStatus = async (_claimId: string): Promise<'published' | 'pending' | 'failed'> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return 'published'; // For demo, always return success
};

// Simulate getting publication metrics
export const getPublicationMetrics = async (): Promise<{
  totalPublished: number;
  publishedToday: number;
  averagePublicationTime: number;
}> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return {
    totalPublished: 1247,
    publishedToday: 23,
    averagePublicationTime: 1.8, // seconds
  };
};
