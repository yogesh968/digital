// ============================================================
// CHARITY + SUBSCRIPTION + WINNER + CONTRIBUTION REPOSITORIES
// MongoDB/Mongoose implementation
// ============================================================

import { CharityModel, SubscriptionModel, WinnerVerificationModel, CharityContributionModel } from '../models';
import { ICharity, ISubscription, IWinnerVerification, ICharityContribution, VerificationStatus, PayoutStatus } from '../entities/types';
import { ICharityRepository, ISubscriptionRepository, IWinnerRepository, ICharityContributionRepository } from './interfaces';
import { NotFoundError } from '../errors/AppError';

// -------------------------------------------------------------------
// CHARITY REPOSITORY
// -------------------------------------------------------------------
export class CharityRepository implements ICharityRepository {
  private toEntity(doc: any): ICharity {
    return {
      id: doc._id.toString(),
      name: doc.name,
      description: doc.description,
      imageUrl: doc.imageUrl ?? undefined,
      websiteUrl: doc.websiteUrl ?? undefined,
      isFeatured: doc.isFeatured,
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async findAll(search?: string): Promise<ICharity[]> {
    const filter: Record<string, unknown> = { isActive: true };
    if (search) filter.name = { $regex: search, $options: 'i' };
    const docs = await CharityModel.find(filter).sort({ name: 1 });
    return docs.map(d => this.toEntity(d));
  }

  async findById(id: string): Promise<ICharity | null> {
    const doc = await CharityModel.findById(id);
    return doc ? this.toEntity(doc) : null;
  }

  async findFeatured(): Promise<ICharity[]> {
    const docs = await CharityModel.find({ isFeatured: true, isActive: true });
    return docs.map(d => this.toEntity(d));
  }

  async create(data: Omit<ICharity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ICharity> {
    const doc = await CharityModel.create({
      name: data.name,
      description: data.description,
      imageUrl: data.imageUrl,
      websiteUrl: data.websiteUrl,
      isFeatured: data.isFeatured,
      isActive: data.isActive,
    });
    return this.toEntity(doc);
  }

  async update(id: string, data: Partial<ICharity>): Promise<ICharity> {
    const update: Record<string, unknown> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.description !== undefined) update.description = data.description;
    if (data.imageUrl !== undefined) update.imageUrl = data.imageUrl;
    if (data.websiteUrl !== undefined) update.websiteUrl = data.websiteUrl;
    if (data.isFeatured !== undefined) update.isFeatured = data.isFeatured;
    if (data.isActive !== undefined) update.isActive = data.isActive;

    const doc = await CharityModel.findByIdAndUpdate(id, update, { new: true });
    if (!doc) throw new NotFoundError('Charity');
    return this.toEntity(doc);
  }

  async delete(id: string): Promise<void> {
    await CharityModel.findByIdAndUpdate(id, { isActive: false });
  }
}

// -------------------------------------------------------------------
// SUBSCRIPTION REPOSITORY
// -------------------------------------------------------------------
export class SubscriptionRepository implements ISubscriptionRepository {
  private toEntity(doc: any): ISubscription {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      plan: doc.plan,
      status: doc.status,
      stripeSubscriptionId: doc.stripeSubscriptionId ?? undefined,
      stripeCustomerId: doc.stripeCustomerId ?? undefined,
      currentPeriodEnd: doc.currentPeriodEnd,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }

  async findByUserId(userId: string): Promise<ISubscription | null> {
    const doc = await SubscriptionModel.findOne({ userId }).sort({ createdAt: -1 });
    return doc ? this.toEntity(doc) : null;
  }

  async findByStripeId(stripeSubId: string): Promise<ISubscription | null> {
    const doc = await SubscriptionModel.findOne({ stripeSubscriptionId: stripeSubId });
    return doc ? this.toEntity(doc) : null;
  }

  async create(data: Omit<ISubscription, 'id' | 'createdAt' | 'updatedAt'>): Promise<ISubscription> {
    const doc = await SubscriptionModel.create({
      userId: data.userId,
      plan: data.plan,
      status: data.status,
      stripeSubscriptionId: data.stripeSubscriptionId || undefined,
      stripeCustomerId: data.stripeCustomerId || undefined,
      currentPeriodEnd: data.currentPeriodEnd,
    });
    return this.toEntity(doc);
  }

  async update(id: string, data: Partial<ISubscription>): Promise<ISubscription> {
    const update: Record<string, unknown> = {};
    if (data.status !== undefined) update.status = data.status;
    if (data.currentPeriodEnd !== undefined) update.currentPeriodEnd = data.currentPeriodEnd;
    if (data.stripeSubscriptionId !== undefined) update.stripeSubscriptionId = data.stripeSubscriptionId;

    const doc = await SubscriptionModel.findByIdAndUpdate(id, update, { new: true });
    if (!doc) throw new NotFoundError('Subscription');
    return this.toEntity(doc);
  }

  async findAllActiveUserIds(): Promise<string[]> {
    const docs = await SubscriptionModel.find({ status: 'active' }, { userId: 1 });
    return docs.map(d => d.userId.toString());
  }
}

// -------------------------------------------------------------------
// WINNER REPOSITORY
// -------------------------------------------------------------------
export class WinnerRepository implements IWinnerRepository {
  private toEntity(doc: any): IWinnerVerification {
    return {
      id: doc._id.toString(),
      drawEntryId: doc.drawEntryId.toString(),
      userId: doc.userId.toString(),
      proofUrl: doc.proofUrl,
      status: doc.status,
      payoutStatus: doc.payoutStatus,
      reviewedBy: doc.reviewedBy?.toString(),
      reviewedAt: doc.reviewedAt ?? undefined,
      createdAt: doc.createdAt,
    };
  }

  async findAll(): Promise<IWinnerVerification[]> {
    const docs = await WinnerVerificationModel.find().sort({ createdAt: -1 });
    return docs.map(d => this.toEntity(d));
  }

  async findById(id: string): Promise<IWinnerVerification | null> {
    const doc = await WinnerVerificationModel.findById(id);
    return doc ? this.toEntity(doc) : null;
  }

  async findByUser(userId: string): Promise<IWinnerVerification[]> {
    const docs = await WinnerVerificationModel.find({ userId });
    return docs.map(d => this.toEntity(d));
  }

  async create(data: Omit<IWinnerVerification, 'id' | 'createdAt'>): Promise<IWinnerVerification> {
    const doc = await WinnerVerificationModel.create({
      drawEntryId: data.drawEntryId,
      userId: data.userId,
      proofUrl: data.proofUrl,
      status: data.status,
      payoutStatus: data.payoutStatus,
      reviewedBy: data.reviewedBy || undefined,
      reviewedAt: data.reviewedAt || undefined,
    });
    return this.toEntity(doc);
  }

  async updateStatus(id: string, status: VerificationStatus, reviewedBy: string): Promise<IWinnerVerification> {
    const doc = await WinnerVerificationModel.findByIdAndUpdate(id, { status, reviewedBy, reviewedAt: new Date() }, { new: true });
    if (!doc) throw new NotFoundError('Winner Verification');
    return this.toEntity(doc);
  }

  async updatePayoutStatus(id: string, status: PayoutStatus): Promise<IWinnerVerification> {
    const doc = await WinnerVerificationModel.findByIdAndUpdate(id, { payoutStatus: status }, { new: true });
    if (!doc) throw new NotFoundError('Winner Verification');
    return this.toEntity(doc);
  }
}

// -------------------------------------------------------------------
// CHARITY CONTRIBUTION REPOSITORY
// -------------------------------------------------------------------
export class CharityContributionRepository implements ICharityContributionRepository {
  async create(data: Omit<ICharityContribution, 'id' | 'createdAt'>): Promise<ICharityContribution> {
    const doc = await CharityContributionModel.create({
      userId: data.userId,
      charityId: data.charityId,
      subscriptionId: data.subscriptionId,
      amount: data.amount,
      period: data.period,
    });
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      charityId: doc.charityId.toString(),
      subscriptionId: doc.subscriptionId.toString(),
      amount: doc.amount,
      period: doc.period,
      createdAt: doc.createdAt,
    };
  }

  async findByCharity(charityId: string): Promise<ICharityContribution[]> {
    const docs = await CharityContributionModel.find({ charityId });
    return docs.map(d => ({
      id: d._id.toString(),
      userId: d.userId.toString(),
      charityId: d.charityId.toString(),
      subscriptionId: d.subscriptionId.toString(),
      amount: d.amount,
      period: d.period,
      createdAt: d.createdAt,
    }));
  }

  async totalByCharity(charityId: string): Promise<number> {
    const result = await CharityContributionModel.aggregate([
      { $match: { charityId } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total ?? 0;
  }

  async totalAll(): Promise<number> {
    const result = await CharityContributionModel.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    return result[0]?.total ?? 0;
  }
}
