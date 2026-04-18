// ============================================================
// DRAW STRATEGY INTERFACE + IMPLEMENTATIONS
// Strategy Pattern — random vs algorithmic draw
// ============================================================

export interface IDrawStrategy {
  generateNumbers(pool?: number[]): number[];
  description: string;
}

// ------------------------------------------------------------------
// RANDOM DRAW STRATEGY (standard lottery-style)
// ------------------------------------------------------------------
export class RandomDrawStrategy implements IDrawStrategy {
  readonly description = 'Standard lottery: 5 random numbers from 1–45';

  generateNumbers(): number[] {
    const pool = Array.from({ length: 45 }, (_, i) => i + 1);
    // Fisher-Yates shuffle → take first 5
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 5).sort((a, b) => a - b);
  }
}

// ------------------------------------------------------------------
// ALGORITHMIC DRAW STRATEGY (weighted by score frequency)
// Weights are inversely proportional to frequency — rarest scores
// have higher probability of being drawn, creating more competition.
// ------------------------------------------------------------------
export class AlgorithmicDrawStrategy implements IDrawStrategy {
  readonly description = 'Algorithmic: weighted draw based on score rarity across subscribers';

  generateNumbers(allUserScores: number[]): number[] {
    // Build frequency map across all active subscribers
    const frequencyMap = new Map<number, number>();
    for (let i = 1; i <= 45; i++) frequencyMap.set(i, 0);
    for (const s of allUserScores) {
      frequencyMap.set(s, (frequencyMap.get(s) ?? 0) + 1);
    }

    // Build weighted pool: rare numbers get more entries (inverse weight)
    const maxFreq = Math.max(...frequencyMap.values()) + 1;
    const weightedPool: number[] = [];
    for (const [num, freq] of frequencyMap.entries()) {
      const weight = maxFreq - freq; // rarer = higher weight
      for (let w = 0; w < weight; w++) weightedPool.push(num);
    }

    // Shuffle weighted pool and draw 5 unique numbers
    const drawn = new Set<number>();
    const shuffled = [...weightedPool].sort(() => Math.random() - 0.5);
    for (const n of shuffled) {
      if (drawn.size === 5) break;
      drawn.add(n);
    }

    // Fallback: if not enough unique numbers, fill from random
    if (drawn.size < 5) {
      for (let i = 1; i <= 45 && drawn.size < 5; i++) drawn.add(i);
    }

    return Array.from(drawn).sort((a, b) => a - b);
  }
}

// ------------------------------------------------------------------
// DRAW STRATEGY FACTORY
// Factory Pattern — instantiates strategy by type
// ------------------------------------------------------------------
export type StrategyType = 'random' | 'algorithmic';

export class DrawStrategyFactory {
  static create(type: StrategyType): IDrawStrategy {
    switch (type) {
      case 'random':
        return new RandomDrawStrategy();
      case 'algorithmic':
        return new AlgorithmicDrawStrategy();
      default:
        throw new Error(`Unknown draw strategy type: ${type}`);
    }
  }
}
