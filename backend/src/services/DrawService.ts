// ============================================================
// DRAW SERVICE — orchestrates the full draw lifecycle
// Strategy pattern consumed here via DrawStrategyFactory
// ============================================================

import { IDrawRepository, IScoreRepository, ISubscriptionRepository } from '../repositories/interfaces';
import { IDraw, IDrawEntry, DrawType, PrizeTier } from '../entities/types';
import { Draw } from '../entities/Draw';
import { DrawStrategyFactory, StrategyType } from '../strategies/DrawStrategy';
import { PrizePoolCalculator } from './PrizePoolCalculator';
import { config } from '../config';
import { ConflictError, NotFoundError, ValidationError } from '../errors/AppError';
import { logger } from '../config/logger';

export interface IDrawSimulationResult {
  draw: IDraw;
  winningNumbers: number[];
  entries: Array<{ userId: string; scores: number[]; matchCount: number; tier: PrizeTier; prizeAmount: number }>;
  tierSummary: { '5-match': number; '4-match': number; '3-match': number; none: number };
  distribution: { jackpotTier: number; fourMatchTier: number; threeMatchTier: number; total: number };
  jackpotRollover: number;
}

export class DrawService {
  constructor(
    private readonly drawRepo: IDrawRepository,
    private readonly scoreRepo: IScoreRepository,
    private readonly subscriptionRepo: ISubscriptionRepository
  ) {}

  /**
   * Create a new draw (draft status) for this month.
   */
  async createDraw(drawType: DrawType, month?: Date): Promise<IDraw> {
    const targetMonth = month ?? new Date();
    const monthStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);

    const existing = await this.drawRepo.findByMonth(monthStart);
    if (existing) throw new ConflictError('A draw already exists for this month');

    // Get rollover jackpot from previous draw
    const lastPublished = await this.drawRepo.findLatestPublished();
    const rollover = lastPublished?.jackpotAmount ?? 0;

    // Calculate prize pool
    const userIds = await this.subscriptionRepo.findAllActiveUserIds();
    const activeCount = userIds.length;

    const prizePool = PrizePoolCalculator.calculatePool(
      activeCount,
      config.stripe.prizeContributionMonthly,
      rollover
    );

    const draw = await this.drawRepo.create({
      month: monthStart,
      drawType,
      winningNumbers: [],
      status: 'draft',
      jackpotAmount: rollover,
      prizePoolTotal: prizePool.total,
    });

    logger.info(`Draw created for ${monthStart.toISOString().slice(0, 7)} | Pool: £${prizePool.total}`);
    return draw;
  }

  /**
   * Simulate or run the draw: generates winning numbers and calculates entries.
   * If simulate=true → does NOT persist entries (preview only).
   * If simulate=false → persists all entries and updates draw status.
   */
  async runDraw(drawId: string, simulate = true): Promise<IDrawSimulationResult> {
    const drawData = await this.drawRepo.findById(drawId);
    if (!drawData) throw new NotFoundError('Draw');
    if (drawData.status === 'published') {
      throw new ConflictError('Draw has already been published');
    }

    // Get all active subscribers and their scores
    const userIds = await this.subscriptionRepo.findAllActiveUserIds();

    // Generate winning numbers using Strategy Pattern
    let allScores: number[] = [];
    if (drawData.drawType === 'algorithmic') {
      allScores = await this.scoreRepo.findAllActiveScores();
    }

    const strategy = DrawStrategyFactory.create(drawData.drawType as StrategyType);
    const winningNumbers = strategy.generateNumbers(allScores);

    logger.info(`Draw ${drawId} | Strategy: ${strategy.description} | Numbers: [${winningNumbers}]`);

    // Build draw entity for matching
    const draw = new Draw({ ...drawData, winningNumbers, prizePoolTotal: drawData.prizePoolTotal });
    const distribution = PrizePoolCalculator.calculatePool(
      userIds.length,
      config.stripe.prizeContributionMonthly,
      drawData.jackpotAmount
    );

    // Process each user's scores
    const entryResults: IDrawSimulationResult['entries'] = [];
    const tierCounts: Record<PrizeTier, number> = { '5-match': 0, '4-match': 0, '3-match': 0, none: 0 };

    for (const userId of userIds) {
      const scores = await this.scoreRepo.findByUserId(userId);
      const scoreValues = scores.map((s) => s.score);
      const matchCount = draw.matchScores(scoreValues);
      const tier = Draw.getTier(matchCount);
      tierCounts[tier]++;
      entryResults.push({ userId, scores: scoreValues, matchCount, tier, prizeAmount: 0 });
    }

    // Calculate per-winner amounts
    for (const tier of (['5-match', '4-match', '3-match'] as PrizeTier[])) {
      const tierResult = PrizePoolCalculator.distributeTier(tier, distribution, tierCounts[tier]);
      entryResults
        .filter((e) => e.tier === tier)
        .forEach((e) => { e.prizeAmount = tierResult.perWinner; });
    }

    const hasJackpotWinner = tierCounts['5-match'] > 0;
    const jackpotRollover = PrizePoolCalculator.getRolloverAmount(distribution, hasJackpotWinner);

    // Persist if not simulation
    if (!simulate) {
      await this.drawRepo.update(drawId, {
        winningNumbers,
        status: 'simulated',
        jackpotAmount: hasJackpotWinner ? 0 : jackpotRollover,
      });

      for (const entry of entryResults) {
        await this.drawRepo.createEntry({
          drawId,
          userId: entry.userId,
          scoresSnapshot: entry.scores,
          matchCount: entry.matchCount,
          prizeTier: entry.tier,
          prizeAmount: entry.prizeAmount,
        });
      }
    }

    return {
      draw: { ...drawData, winningNumbers },
      winningNumbers,
      entries: entryResults,
      tierSummary: { '5-match': tierCounts['5-match'], '4-match': tierCounts['4-match'], '3-match': tierCounts['3-match'], none: tierCounts.none },
      distribution,
      jackpotRollover,
    };
  }

  /**
   * Publish a simulated draw — makes results public-facing.
   */
  async publishDraw(drawId: string): Promise<IDraw> {
    const draw = await this.drawRepo.findById(drawId);
    if (!draw) throw new NotFoundError('Draw');
    if (draw.status === 'published') throw new ConflictError('Draw already published');
    if (draw.status === 'draft') throw new ValidationError('Draw must be simulated before publishing');

    const updated = await this.drawRepo.update(drawId, {
      status: 'published',
      publishedAt: new Date(),
    });
    logger.info(`Draw ${drawId} published`);
    return updated;
  }

  async getLatestPublished(): Promise<IDraw | null> {
    return this.drawRepo.findLatestPublished();
  }

  async getAllDraws(): Promise<IDraw[]> {
    return this.drawRepo.findAll();
  }

  async getDrawResults(drawId: string): Promise<IDrawEntry[]> {
    return this.drawRepo.findEntriesByDraw(drawId);
  }

  async getUserDrawEntry(userId: string, drawId: string): Promise<IDrawEntry | null> {
    return this.drawRepo.findEntryByUserAndDraw(userId, drawId);
  }
}
