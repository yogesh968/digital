// ============================================================
// REPOSITORY INTERFACES — ISP: each domain has its own contract
// ============================================================

import {
  IUser, IScore, ICharity, IDraw, IDrawEntry,
  IWinnerVerification, ISubscription, ICharityContribution,
  DrawType, DrawStatus, VerificationStatus, PayoutStatus
} from '../entities/types';

// ── USER REPOSITORY ────────────────────────────────────────
export interface IUserRepository {
  findById(id: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  create(data: Omit<IUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<IUser>;
  update(id: string, data: Partial<IUser>): Promise<IUser>;
  findAll(page: number, limit: number): Promise<{ users: IUser[]; total: number }>;
  findActiveSubscriberCount(): Promise<number>;
}

// ── SCORE REPOSITORY ───────────────────────────────────────
export interface IScoreRepository {
  findByUserId(userId: string): Promise<IScore[]>;
  create(data: Omit<IScore, 'id' | 'createdAt'>): Promise<IScore>;
  deleteOldest(userId: string): Promise<void>;
  countByUserId(userId: string): Promise<number>;
  findAllActiveScores(): Promise<number[]>; // for algorithmic draw
}

// ── SUBSCRIPTION REPOSITORY ────────────────────────────────
export interface ISubscriptionRepository {
  findByUserId(userId: string): Promise<ISubscription | null>;
  findByStripeId(stripeSubId: string): Promise<ISubscription | null>;
  create(data: Omit<ISubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<ISubscription>;
  update(id: string, data: Partial<ISubscription>): Promise<ISubscription>;
  findAllActiveUserIds(): Promise<string[]>;
}

// ── CHARITY REPOSITORY ─────────────────────────────────────
export interface ICharityRepository {
  findAll(search?: string): Promise<ICharity[]>;
  findById(id: string): Promise<ICharity | null>;
  findFeatured(): Promise<ICharity[]>;
  create(data: Omit<ICharity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ICharity>;
  update(id: string, data: Partial<ICharity>): Promise<ICharity>;
  delete(id: string): Promise<void>;
}

// ── DRAW REPOSITORY ────────────────────────────────────────
export interface IDrawRepository {
  findAll(): Promise<IDraw[]>;
  findById(id: string): Promise<IDraw | null>;
  findLatestPublished(): Promise<IDraw | null>;
  findByMonth(month: Date): Promise<IDraw | null>;
  create(data: Omit<IDraw, 'id' | 'createdAt'>): Promise<IDraw>;
  update(id: string, data: Partial<IDraw>): Promise<IDraw>;
  createEntry(data: Omit<IDrawEntry, 'id' | 'createdAt'>): Promise<IDrawEntry>;
  findEntriesByDraw(drawId: string): Promise<IDrawEntry[]>;
  findEntryByUserAndDraw(userId: string, drawId: string): Promise<IDrawEntry | null>;
  findWinnersByTier(drawId: string, tier: string): Promise<IDrawEntry[]>;
}

// ── WINNER REPOSITORY ──────────────────────────────────────
export interface IWinnerRepository {
  findAll(): Promise<IWinnerVerification[]>;
  findById(id: string): Promise<IWinnerVerification | null>;
  findByUser(userId: string): Promise<IWinnerVerification[]>;
  create(data: Omit<IWinnerVerification, 'id' | 'createdAt'>): Promise<IWinnerVerification>;
  updateStatus(id: string, status: VerificationStatus, reviewedBy: string): Promise<IWinnerVerification>;
  updatePayoutStatus(id: string, status: PayoutStatus): Promise<IWinnerVerification>;
}

// ── CHARITY CONTRIBUTION REPOSITORY ───────────────────────
export interface ICharityContributionRepository {
  create(data: Omit<ICharityContribution, 'id' | 'createdAt'>): Promise<ICharityContribution>;
  findByCharity(charityId: string): Promise<ICharityContribution[]>;
  totalByCharity(charityId: string): Promise<number>;
  totalAll(): Promise<number>;
}
