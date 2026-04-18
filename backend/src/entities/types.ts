// ============================================================
// CORE ENTITY INTERFACES — strongly typed domain models
// ============================================================

export type UserRole = 'subscriber' | 'admin';
export type SubscriptionPlan = 'monthly' | 'yearly';
export type SubscriptionStatus = 'active' | 'cancelled' | 'lapsed';
export type DrawStatus = 'draft' | 'simulated' | 'published';
export type DrawType = 'random' | 'algorithmic';
export type PrizeTier = 'none' | '3-match' | '4-match' | '5-match';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type PayoutStatus = 'pending' | 'paid';

// ------------------------------------------------------------------
export interface IUser {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  role: UserRole;
  charityId?: string;
  charityPercentage: number; // min 10
  createdAt: Date;
  updatedAt: Date;
}

// ------------------------------------------------------------------
export interface ISubscription {
  id: string;
  userId: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ------------------------------------------------------------------
export interface IScore {
  id: string;
  userId: string;
  score: number; // 1–45 Stableford
  playedAt: Date;
  createdAt: Date;
}

// ------------------------------------------------------------------
export interface ICharity {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  websiteUrl?: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ------------------------------------------------------------------
export interface IDraw {
  id: string;
  month: Date; // First day of the draw month
  drawType: DrawType;
  winningNumbers: number[]; // 5 numbers
  status: DrawStatus;
  jackpotAmount: number; // Rolled-over jackpot from previous draw
  prizePoolTotal: number;
  publishedAt?: Date;
  createdAt: Date;
}

// ------------------------------------------------------------------
export interface IDrawEntry {
  id: string;
  drawId: string;
  userId: string;
  scoresSnapshot: number[]; // User scores at time of draw
  matchCount: number;
  prizeTier: PrizeTier;
  prizeAmount: number;
  createdAt: Date;
}

// ------------------------------------------------------------------
export interface IWinnerVerification {
  id: string;
  drawEntryId: string;
  userId: string;
  proofUrl: string;
  status: VerificationStatus;
  payoutStatus: PayoutStatus;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
}

// ------------------------------------------------------------------
export interface ICharityContribution {
  id: string;
  userId: string;
  charityId: string;
  subscriptionId: string;
  amount: number;
  period: Date;
  createdAt: Date;
}

// ------------------------------------------------------------------
// AUTH Payloads
export interface ITokenPayload {
  userId: string;
  role: UserRole;
  email: string;
}

export interface IAuthResult {
  user: Omit<IUser, 'passwordHash'>;
  accessToken: string;
  refreshToken?: string;
}

// ------------------------------------------------------------------
// API Response wrapper
export interface IApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
