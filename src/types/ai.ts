export type MatchStatus = 'auto_matched' | 'manual_review' | 'rejected' | 'accepted';

export interface MatchResult {
  storeName: string;
  storeOptions: string;
  systemName: string;
  storeSku: string;
  systemSku: string;
  confidence: number;
  status: MatchStatus;
}
