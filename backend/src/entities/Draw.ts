// ============================================================
// DRAW ENTITY — encapsulates draw state & matching logic
// ============================================================

import { IDraw, DrawStatus, DrawType, PrizeTier } from './types';

export class Draw implements IDraw {
  id: string;
  month: Date;
  drawType: DrawType;
  winningNumbers: number[];
  status: DrawStatus;
  jackpotAmount: number;
  prizePoolTotal: number;
  publishedAt?: Date;
  createdAt: Date;

  constructor(data: IDraw) {
    this.id = data.id;
    this.month = data.month;
    this.drawType = data.drawType;
    this.winningNumbers = data.winningNumbers;
    this.status = data.status;
    this.jackpotAmount = data.jackpotAmount;
    this.prizePoolTotal = data.prizePoolTotal;
    this.publishedAt = data.publishedAt;
    this.createdAt = data.createdAt;
  }

  /**
   * Match user scores against winning numbers.
   * Returns: count of matching numbers (intersection size).
   */
  matchScores(userScores: number[]): number {
    const winSet = new Set(this.winningNumbers);
    return userScores.filter((s) => winSet.has(s)).length;
  }

  /**
   * Determines prize tier from match count.
   */
  static getTier(matchCount: number): PrizeTier {
    if (matchCount >= 5) return '5-match';
    if (matchCount === 4) return '4-match';
    if (matchCount === 3) return '3-match';
    return 'none';
  }

  isDraft(): boolean { return this.status === 'draft'; }
  isPublished(): boolean { return this.status === 'published'; }

  /**
   * Prize pool per tier based on the PRD:
   * 5-match: 40%, 4-match: 35%, 3-match: 25%
   */
  getTierPool(tier: PrizeTier): number {
    const base = this.prizePoolTotal;
    const jackpot =
      tier === '5-match'
        ? base * 0.4 + this.jackpotAmount
        : tier === '4-match'
        ? base * 0.35
        : tier === '3-match'
        ? base * 0.25
        : 0;
    return Math.round(jackpot * 100) / 100;
  }
}
