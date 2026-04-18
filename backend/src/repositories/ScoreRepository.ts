// ============================================================
// SCORE REPOSITORY — MongoDB/Mongoose implementation
// ============================================================

import { ScoreModel } from '../models';
import { IScore } from '../entities/types';
import { IScoreRepository } from './interfaces';

export class ScoreRepository implements IScoreRepository {
  private toEntity(doc: any): IScore {
    return {
      id: doc._id.toString(),
      userId: doc.userId.toString(),
      score: doc.score,
      playedAt: doc.playedAt,
      createdAt: doc.createdAt,
    };
  }

  async findByUserId(userId: string): Promise<IScore[]> {
    const docs = await ScoreModel.find({ userId }).sort({ playedAt: -1 });
    return docs.map(d => this.toEntity(d));
  }

  async create(data: Omit<IScore, 'id' | 'createdAt'>): Promise<IScore> {
    const doc = await ScoreModel.create({
      userId: data.userId,
      score: data.score,
      playedAt: data.playedAt,
    });
    return this.toEntity(doc);
  }

  async deleteOldest(userId: string): Promise<void> {
    const oldest = await ScoreModel.findOne({ userId }).sort({ playedAt: 1 });
    if (oldest) await ScoreModel.findByIdAndDelete(oldest._id);
  }

  async countByUserId(userId: string): Promise<number> {
    return ScoreModel.countDocuments({ userId });
  }

  async findAllActiveScores(): Promise<number[]> {
    const docs = await ScoreModel.find({}, { score: 1 });
    return docs.map(d => d.score);
  }
}
