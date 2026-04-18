// ============================================================
// SCORE SERVICE — rolling-5 logic, validation
// ============================================================

import { IScoreRepository } from '../repositories/interfaces';
import { IScore } from '../entities/types';
import { Score } from '../entities/Score';
import { ValidationError, ForbiddenError } from '../errors/AppError';
import { ISubscriptionRepository } from '../repositories/interfaces';
import { logger } from '../config/logger';

export class ScoreService {
  constructor(
    private readonly scoreRepo: IScoreRepository,
    private readonly subscriptionRepo: ISubscriptionRepository
  ) {}

  /**
   * Add a score for a user.
   * Enforces:
   *  1. Active subscription required
   *  2. Score range 1–45
   *  3. Rolling max-5: if user has 5 scores, delete oldest before inserting new
   */
  async addScore(userId: string, score: number, playedAt: Date): Promise<IScore> {
    // 1. Check active subscription
    const sub = await this.subscriptionRepo.findByUserId(userId);
    if (!sub || sub.status !== 'active') {
      throw new ForbiddenError('An active subscription is required to submit scores');
    }

    // 2. Validate range
    if (!Score.isValid(score)) {
      throw new ValidationError(`Score must be between ${Score.MIN_SCORE} and ${Score.MAX_SCORE}`);
    }

    // 3. Rolling-5: remove oldest if already at limit
    const count = await this.scoreRepo.countByUserId(userId);
    if (count >= Score.MAX_STORED) {
      logger.debug(`User ${userId} at ${count} scores — removing oldest`);
      await this.scoreRepo.deleteOldest(userId);
    }

    const saved = await this.scoreRepo.create({ userId, score, playedAt });
    logger.info(`Score ${score} saved for user ${userId}`);
    return saved;
  }

  /**
   * Retrieve scores for a user in reverse chronological order (most recent first).
   */
  async getScores(userId: string): Promise<IScore[]> {
    return this.scoreRepo.findByUserId(userId);
  }

  /**
   * Get only the score values (numbers) for draw matching.
   */
  async getScoreValues(userId: string): Promise<number[]> {
    const scores = await this.scoreRepo.findByUserId(userId);
    return Score.getValues(scores);
  }
}
