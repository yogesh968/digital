// ============================================================
// CHARITY SERVICE
// ============================================================

import { ICharityRepository, ICharityContributionRepository } from '../repositories/interfaces';
import { ICharity } from '../entities/types';
import { NotFoundError, ValidationError } from '../errors/AppError';

export class CharityService {
  constructor(
    private readonly charityRepo: ICharityRepository,
    private readonly contributionRepo: ICharityContributionRepository
  ) {}

  async listCharities(search?: string): Promise<ICharity[]> {
    return this.charityRepo.findAll(search);
  }

  async getFeatured(): Promise<ICharity[]> {
    return this.charityRepo.findFeatured();
  }

  async getById(id: string): Promise<ICharity> {
    const charity = await this.charityRepo.findById(id);
    if (!charity) throw new NotFoundError('Charity');
    return charity;
  }

  async create(data: Omit<ICharity, 'id' | 'createdAt' | 'updatedAt'>): Promise<ICharity> {
    if (!data.name || !data.description) {
      throw new ValidationError('Charity name and description are required');
    }
    return this.charityRepo.create(data);
  }

  async update(id: string, data: Partial<ICharity>): Promise<ICharity> {
    await this.getById(id);
    return this.charityRepo.update(id, data);
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    return this.charityRepo.delete(id);
  }

  async getTotalContributions(): Promise<number> {
    return this.contributionRepo.totalAll();
  }

  async getCharityContributions(charityId: string): Promise<number> {
    return this.contributionRepo.totalByCharity(charityId);
  }
}

// ============================================================
// WINNER SERVICE
// ============================================================

import { IWinnerRepository, IDrawRepository } from '../repositories/interfaces';
import { IWinnerVerification, VerificationStatus } from '../entities/types';
import fs from 'fs';
import path from 'path';

export class WinnerService {
  constructor(
    private readonly winnerRepo: IWinnerRepository,
    private readonly drawRepo: IDrawRepository
  ) {}

  async submitProof(userId: string, drawEntryId: string, proofFile: Buffer, filename: string): Promise<IWinnerVerification> {
    // Save proof to local uploads folder
    const uploadsDir = path.join(__dirname, '../../uploads', userId);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const finalFilename = `${Date.now()}_${filename}`;
    const filePath = path.join(uploadsDir, finalFilename);
    fs.writeFileSync(filePath, proofFile);
    
    // In production this would be S3/GCS. For now, it's served statically.
    const publicUrl = `/uploads/${userId}/${finalFilename}`;

    return this.winnerRepo.create({
      drawEntryId,
      userId,
      proofUrl: publicUrl,
      status: 'pending',
      payoutStatus: 'pending',
    });
  }

  async reviewSubmission(verificationId: string, status: VerificationStatus, adminId: string): Promise<IWinnerVerification> {
    return this.winnerRepo.updateStatus(verificationId, status, adminId);
  }

  async markPaid(verificationId: string): Promise<IWinnerVerification> {
    return this.winnerRepo.updatePayoutStatus(verificationId, 'paid');
  }

  async getAllVerifications(): Promise<IWinnerVerification[]> {
    return this.winnerRepo.findAll();
  }

  async getUserVerifications(userId: string): Promise<IWinnerVerification[]> {
    return this.winnerRepo.findByUser(userId);
  }
}

// ============================================================
// ANALYTICS SERVICE (Admin Reports)
// ============================================================

import { IUserRepository } from '../repositories/interfaces';
import { DrawModel, WinnerVerificationModel } from '../models';

export interface IAnalyticsReport {
  totalUsers: number;
  activeSubscribers: number;
  totalPrizePool: number;
  totalCharityContributions: number;
  publishedDraws: number;
  pendingVerifications: number;
}

export class AnalyticsService {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly contributionRepo: ICharityContributionRepository,
    private readonly winnerRepo: IWinnerRepository
  ) {}

  async getReport(): Promise<IAnalyticsReport> {
    const [{ total: totalUsers }, activeSubscribers, totalCharityContributions] = await Promise.all([
      this.userRepo.findAll(1, 1),
      this.userRepo.findActiveSubscriberCount(),
      this.contributionRepo.totalAll(),
    ]);

    const publishedDraws = await DrawModel.countDocuments({ status: 'published' });
    const pendingVerifications = await WinnerVerificationModel.countDocuments({ status: 'pending' });

    const publishedDocs = await DrawModel.find({ status: 'published' }, { prizePoolTotal: 1 });
    const totalPrizePool = publishedDocs.reduce((sum, d) => sum + (d.prizePoolTotal || 0), 0);

    return {
      totalUsers: totalUsers ?? 0,
      activeSubscribers,
      totalPrizePool,
      totalCharityContributions,
      publishedDraws: publishedDraws ?? 0,
      pendingVerifications: pendingVerifications ?? 0,
    };
  }
}
