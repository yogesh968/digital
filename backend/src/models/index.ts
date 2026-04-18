// ============================================================
// MONGOOSE MODELS — all MongoDB schemas in one file
// ============================================================

import mongoose, { Schema, Document } from 'mongoose';

// ── USER ─────────────────────────────────────────────────────
export interface IUserDocument extends Document {
  email: string;
  fullName: string;
  passwordHash: string;
  role: 'subscriber' | 'admin';
  charityId?: mongoose.Types.ObjectId;
  charityPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUserDocument>({
  email:             { type: String, required: true, unique: true, lowercase: true, trim: true },
  fullName:          { type: String, required: true, trim: true },
  passwordHash:      { type: String, required: true },
  role:              { type: String, enum: ['subscriber', 'admin'], default: 'subscriber' },
  charityId:         { type: Schema.Types.ObjectId, ref: 'Charity', default: null },
  charityPercentage: { type: Number, default: 10, min: 10, max: 100 },
}, { timestamps: true });

userSchema.index({ email: 1 });

export const UserModel = mongoose.model<IUserDocument>('User', userSchema);

// ── SUBSCRIPTION ─────────────────────────────────────────────
export interface ISubscriptionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  plan: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'lapsed';
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  currentPeriodEnd: Date;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscriptionDocument>({
  userId:               { type: Schema.Types.ObjectId, ref: 'User', required: true },
  plan:                 { type: String, enum: ['monthly', 'yearly'], required: true },
  status:               { type: String, enum: ['active', 'cancelled', 'lapsed'], default: 'active' },
  stripeSubscriptionId: { type: String, default: null },
  stripeCustomerId:     { type: String, default: null },
  currentPeriodEnd:     { type: Date, required: true },
}, { timestamps: true });

subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });
subscriptionSchema.index({ status: 1 });

export const SubscriptionModel = mongoose.model<ISubscriptionDocument>('Subscription', subscriptionSchema);

// ── SCORE ────────────────────────────────────────────────────
export interface IScoreDocument extends Document {
  userId: mongoose.Types.ObjectId;
  score: number;
  playedAt: Date;
  createdAt: Date;
}

const scoreSchema = new Schema<IScoreDocument>({
  userId:   { type: Schema.Types.ObjectId, ref: 'User', required: true },
  score:    { type: Number, required: true, min: 1, max: 45 },
  playedAt: { type: Date, required: true },
}, { timestamps: true });

scoreSchema.index({ userId: 1, playedAt: -1 });

export const ScoreModel = mongoose.model<IScoreDocument>('Score', scoreSchema);

// ── CHARITY ──────────────────────────────────────────────────
export interface ICharityDocument extends Document {
  name: string;
  description: string;
  imageUrl?: string;
  websiteUrl?: string;
  isFeatured: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const charitySchema = new Schema<ICharityDocument>({
  name:        { type: String, required: true, trim: true },
  description: { type: String, required: true },
  imageUrl:    { type: String, default: null },
  websiteUrl:  { type: String, default: null },
  isFeatured:  { type: Boolean, default: false },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

charitySchema.index({ isActive: 1 });
charitySchema.index({ isFeatured: 1 });

export const CharityModel = mongoose.model<ICharityDocument>('Charity', charitySchema);

// ── DRAW ─────────────────────────────────────────────────────
export interface IDrawDocument extends Document {
  month: Date;
  drawType: 'random' | 'algorithmic';
  winningNumbers: number[];
  status: 'draft' | 'simulated' | 'published';
  jackpotAmount: number;
  prizePoolTotal: number;
  publishedAt?: Date;
  createdAt: Date;
}

const drawSchema = new Schema<IDrawDocument>({
  month:          { type: Date, required: true, unique: true },
  drawType:       { type: String, enum: ['random', 'algorithmic'], required: true },
  winningNumbers: { type: [Number], default: [] },
  status:         { type: String, enum: ['draft', 'simulated', 'published'], default: 'draft' },
  jackpotAmount:  { type: Number, default: 0 },
  prizePoolTotal: { type: Number, default: 0 },
  publishedAt:    { type: Date, default: null },
}, { timestamps: true });

drawSchema.index({ status: 1 });
drawSchema.index({ month: -1 });

export const DrawModel = mongoose.model<IDrawDocument>('Draw', drawSchema);

// ── DRAW ENTRY ───────────────────────────────────────────────
export interface IDrawEntryDocument extends Document {
  drawId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  scoresSnapshot: number[];
  matchCount: number;
  prizeTier: 'none' | '3-match' | '4-match' | '5-match';
  prizeAmount: number;
  createdAt: Date;
}

const drawEntrySchema = new Schema<IDrawEntryDocument>({
  drawId:         { type: Schema.Types.ObjectId, ref: 'Draw', required: true },
  userId:         { type: Schema.Types.ObjectId, ref: 'User', required: true },
  scoresSnapshot: { type: [Number], required: true },
  matchCount:     { type: Number, default: 0, min: 0, max: 5 },
  prizeTier:      { type: String, enum: ['none', '3-match', '4-match', '5-match'], default: 'none' },
  prizeAmount:    { type: Number, default: 0 },
}, { timestamps: true });

drawEntrySchema.index({ drawId: 1, userId: 1 }, { unique: true });
drawEntrySchema.index({ drawId: 1, prizeTier: 1 });

export const DrawEntryModel = mongoose.model<IDrawEntryDocument>('DrawEntry', drawEntrySchema);

// ── WINNER VERIFICATION ──────────────────────────────────────
export interface IWinnerVerificationDocument extends Document {
  drawEntryId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  proofUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  payoutStatus: 'pending' | 'paid';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  createdAt: Date;
}

const winnerVerificationSchema = new Schema<IWinnerVerificationDocument>({
  drawEntryId: { type: Schema.Types.ObjectId, ref: 'DrawEntry', required: true },
  userId:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
  proofUrl:    { type: String, required: true },
  status:      { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  payoutStatus:{ type: String, enum: ['pending', 'paid'], default: 'pending' },
  reviewedBy:  { type: Schema.Types.ObjectId, ref: 'User', default: null },
  reviewedAt:  { type: Date, default: null },
}, { timestamps: true });

winnerVerificationSchema.index({ status: 1 });
winnerVerificationSchema.index({ userId: 1 });

export const WinnerVerificationModel = mongoose.model<IWinnerVerificationDocument>('WinnerVerification', winnerVerificationSchema);

// ── CHARITY CONTRIBUTION ─────────────────────────────────────
export interface ICharityContributionDocument extends Document {
  userId: mongoose.Types.ObjectId;
  charityId: mongoose.Types.ObjectId;
  subscriptionId: mongoose.Types.ObjectId;
  amount: number;
  period: Date;
  createdAt: Date;
}

const charityContributionSchema = new Schema<ICharityContributionDocument>({
  userId:         { type: Schema.Types.ObjectId, ref: 'User', required: true },
  charityId:      { type: Schema.Types.ObjectId, ref: 'Charity', required: true },
  subscriptionId: { type: Schema.Types.ObjectId, ref: 'Subscription', required: true },
  amount:         { type: Number, required: true, min: 0 },
  period:         { type: Date, required: true },
}, { timestamps: true });

charityContributionSchema.index({ charityId: 1 });
charityContributionSchema.index({ userId: 1 });
charityContributionSchema.index({ period: -1 });

export const CharityContributionModel = mongoose.model<ICharityContributionDocument>('CharityContribution', charityContributionSchema);
