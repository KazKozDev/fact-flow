
export enum VerificationStatus {
  VERIFIED = 'Verified',
  UNVERIFIED = 'Unverified',
  MISLEADING = 'Misleading',
  PENDING = 'Pending',
  ERROR = 'Error',
}

export enum ProcessStage {
  INPUT = 'input',
  FACT_EXTRACTION = 'fact_extraction',
  FACT_VERIFICATION = 'fact_verification',
  COMPLETED = 'completed',
}

export enum ClaimStage {
  EXTRACTED = 'extracted',
  PUBLISHED = 'published',
  VERIFIED = 'verified',
}

export interface Source {
  web: {
    uri: string;
    title: string;
  };
}

export interface VerificationResult {
  status: VerificationStatus;
  explanation: string;
  confidence: number;
  sources: Source[];
}

export interface Claim {
  id: string;
  claimText: string;
  verification?: VerificationResult;
  status: VerificationStatus;
  stage: ClaimStage;
  extractedAt?: Date;
  publishedAt?: Date;
  verifiedAt?: Date;
}

export interface FactCheckResponse {
  status: VerificationStatus;
  explanation: string;
  confidence: number;
}

export interface ProcessState {
  stage: ProcessStage;
  inputText: string;
  extractedClaims: Claim[];
  publishedClaims: Claim[];
  verifiedClaims: Claim[];
  isLoading: boolean;
  loadingMessage: string;
  error?: string;
}
