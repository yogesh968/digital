// ============================================================
// SCORE ENTITY — enforces Stableford range
// ============================================================

import { IScore } from './types';

export class Score implements IScore {
  static readonly MIN_SCORE = 1;
  static readonly MAX_SCORE = 45;
  static readonly MAX_STORED = 5;

  id: string;
  userId: string;
  score: number;
  playedAt: Date;
  createdAt: Date;

  constructor(data: IScore) {
    if (!Score.isValid(data.score)) {
      throw new Error(`Score must be between ${Score.MIN_SCORE} and ${Score.MAX_SCORE}. Got: ${data.score}`);
    }
    this.id = data.id;
    this.userId = data.userId;
    this.score = data.score;
    this.playedAt = data.playedAt;
    this.createdAt = data.createdAt;
  }

  static isValid(score: number): boolean {
    return score >= Score.MIN_SCORE && score <= Score.MAX_SCORE;
  }

  static getValues(scores: IScore[]): number[] {
    return scores.map((s) => s.score);
  }
}
