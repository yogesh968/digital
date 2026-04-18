// ============================================================
// DRAW REPOSITORY — MongoDB/Mongoose implementation
// ============================================================

import { DrawModel, DrawEntryModel } from '../models';
import { IDraw, IDrawEntry } from '../entities/types';
import { IDrawRepository } from './interfaces';
import { NotFoundError } from '../errors/AppError';

export class DrawRepository implements IDrawRepository {
  private toDrawEntity(doc: any): IDraw {
    return {
      id: doc._id.toString(),
      month: doc.month,
      drawType: doc.drawType,
      winningNumbers: doc.winningNumbers,
      status: doc.status,
      jackpotAmount: doc.jackpotAmount,
      prizePoolTotal: doc.prizePoolTotal,
      publishedAt: doc.publishedAt,
      createdAt: doc.createdAt,
    };
  }

  private toEntryEntity(doc: any): IDrawEntry {
    return {
      id: doc._id.toString(),
      drawId: doc.drawId.toString(),
      userId: doc.userId.toString(),
      scoresSnapshot: doc.scoresSnapshot,
      matchCount: doc.matchCount,
      prizeTier: doc.prizeTier,
      prizeAmount: doc.prizeAmount,
      createdAt: doc.createdAt,
    };
  }

  async findAll(): Promise<IDraw[]> {
    const docs = await DrawModel.find().sort({ createdAt: -1 });
    return docs.map(d => this.toDrawEntity(d));
  }

  async findById(id: string): Promise<IDraw | null> {
    const doc = await DrawModel.findById(id);
    return doc ? this.toDrawEntity(doc) : null;
  }

  async findLatestPublished(): Promise<IDraw | null> {
    const doc = await DrawModel.findOne({ status: 'published' }).sort({ month: -1 });
    return doc ? this.toDrawEntity(doc) : null;
  }

  async findByMonth(month: Date): Promise<IDraw | null> {
    const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
    const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 1);
    const doc = await DrawModel.findOne({ month: { $gte: startOfMonth, $lt: endOfMonth } });
    return doc ? this.toDrawEntity(doc) : null;
  }

  async create(data: Omit<IDraw, 'id' | 'createdAt'>): Promise<IDraw> {
    const doc = await DrawModel.create({
      month: data.month,
      drawType: data.drawType,
      winningNumbers: data.winningNumbers,
      status: data.status,
      jackpotAmount: data.jackpotAmount,
      prizePoolTotal: data.prizePoolTotal,
      publishedAt: data.publishedAt,
    });
    return this.toDrawEntity(doc);
  }

  async update(id: string, data: Partial<IDraw>): Promise<IDraw> {
    const update: Record<string, unknown> = {};
    if (data.winningNumbers !== undefined) update.winningNumbers = data.winningNumbers;
    if (data.status !== undefined) update.status = data.status;
    if (data.jackpotAmount !== undefined) update.jackpotAmount = data.jackpotAmount;
    if (data.prizePoolTotal !== undefined) update.prizePoolTotal = data.prizePoolTotal;
    if (data.publishedAt !== undefined) update.publishedAt = data.publishedAt;

    const doc = await DrawModel.findByIdAndUpdate(id, update, { new: true });
    if (!doc) throw new NotFoundError('Draw');
    return this.toDrawEntity(doc);
  }

  async createEntry(data: Omit<IDrawEntry, 'id' | 'createdAt'>): Promise<IDrawEntry> {
    const doc = await DrawEntryModel.create({
      drawId: data.drawId,
      userId: data.userId,
      scoresSnapshot: data.scoresSnapshot,
      matchCount: data.matchCount,
      prizeTier: data.prizeTier,
      prizeAmount: data.prizeAmount,
    });
    return this.toEntryEntity(doc);
  }

  async findEntriesByDraw(drawId: string): Promise<IDrawEntry[]> {
    const docs = await DrawEntryModel.find({ drawId });
    return docs.map(d => this.toEntryEntity(d));
  }

  async findEntryByUserAndDraw(userId: string, drawId: string): Promise<IDrawEntry | null> {
    const doc = await DrawEntryModel.findOne({ userId, drawId });
    return doc ? this.toEntryEntity(doc) : null;
  }

  async findWinnersByTier(drawId: string, tier: string): Promise<IDrawEntry[]> {
    const docs = await DrawEntryModel.find({ drawId, prizeTier: tier });
    return docs.map(d => this.toEntryEntity(d));
  }
}
