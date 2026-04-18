// ============================================================
// PRIZE POOL CALCULATOR SERVICE
// Encapsulates all prize distribution logic per the PRD
// ============================================================

import { PrizeTier } from '../entities/types';

export interface IPrizeDistribution {
  total: number;
  jackpotTier: number;   // 40% + rollovers
  fourMatchTier: number; // 35%
  threeMatchTier: number; // 25%
}

export interface ITierResult {
  tier: PrizeTier;
  totalPool: number;
  winnerCount: number;
  perWinner: number;
}

export class PrizePoolCalculator {
  private static readonly JACKPOT_SHARE = 0.40;
  private static readonly FOUR_MATCH_SHARE = 0.35;
  private static readonly THREE_MATCH_SHARE = 0.25;

  /**
   * Calculate the prize pool from active subscriber count.
   * pricePerSubscriber is the portion of the fee allocated to prize pool.
   */
  static calculatePool(
    activeSubscriberCount: number,
    prizeContributionPerSubscriber: number,
    rolledOverJackpot: number = 0
  ): IPrizeDistribution {
    const total = activeSubscriberCount * prizeContributionPerSubscriber;
    return {
      total,
      jackpotTier: Math.round((total * this.JACKPOT_SHARE + rolledOverJackpot) * 100) / 100,
      fourMatchTier: Math.round(total * this.FOUR_MATCH_SHARE * 100) / 100,
      threeMatchTier: Math.round(total * this.THREE_MATCH_SHARE * 100) / 100,
    };
  }

  /**
   * Distribute a tier's prize pool among all winners in that tier equally.
   */
  static distributeTier(
    tier: PrizeTier,
    distribution: IPrizeDistribution,
    winnerCount: number
  ): ITierResult {
    let totalPool = 0;
    if (tier === '5-match') totalPool = distribution.jackpotTier;
    else if (tier === '4-match') totalPool = distribution.fourMatchTier;
    else if (tier === '3-match') totalPool = distribution.threeMatchTier;

    const perWinner = winnerCount > 0 ? Math.round((totalPool / winnerCount) * 100) / 100 : 0;
    return { tier, totalPool, winnerCount, perWinner };
  }

  /**
   * When 5-match has no winner: return the jackpot amount to roll over.
   */
  static getRolloverAmount(distribution: IPrizeDistribution, hasJackpotWinner: boolean): number {
    return hasJackpotWinner ? 0 : distribution.jackpotTier;
  }

  /**
   * Calculate charity contribution from a single subscription payment.
   */
  static calculateCharityContribution(
    subscriptionAmount: number,
    charityPercentage: number
  ): number {
    const pct = Math.max(10, Math.min(100, charityPercentage)); // clamp to 10–100
    return Math.round(subscriptionAmount * (pct / 100) * 100) / 100;
  }
}
