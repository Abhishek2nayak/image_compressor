export type SubscriptionTier = 'FREE' | 'PRO' | 'ENTERPRISE';
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING';

export interface UserProfile {
  id: string;
  email: string;
  name?: string;
  tier: SubscriptionTier;
  createdAt: string;
}

export interface UsageStats {
  dailyUploads: number;
  dailyLimit: number;
  totalJobs: number;
  totalBytesSaved: number;
  resetAt: string;
}

export interface ApiKey {
  id: string;
  prefix: string;
  name: string;
  lastUsedAt?: string;
  rateLimit: number;
  isActive: boolean;
  createdAt: string;
}

export interface Subscription {
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  currentPeriodEnd?: string;
  cancelAtEnd: boolean;
}

export const TIER_LIMITS: Record<SubscriptionTier, { dailyUploads: number; apiRateLimit: number }> = {
  FREE: { dailyUploads: 10, apiRateLimit: 20 },
  PRO: { dailyUploads: 500, apiRateLimit: 500 },
  ENTERPRISE: { dailyUploads: Infinity, apiRateLimit: 2000 },
};
