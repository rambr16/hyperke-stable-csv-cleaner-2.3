// ... existing types ...

export interface MXProviderConfig {
  name: string;
  patterns: string[];
  priority: number;
}

export interface MXProviderResult {
  provider: string;
  confidence: number;
  mxRecords?: string[];
}