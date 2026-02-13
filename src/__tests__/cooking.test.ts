import { describe, it, expect } from 'vitest';
import { computeTimeline, calculateCooking } from '../calculators/cooking';

describe('computeTimeline', () => {
  const baseInputs = {
    mealName: 'Bone Broth',
    batchSize: 1,
    maxOvens: 1,
    eventBonus: 0,
    doStir: true,
    doTaste: true,
    doSeason: true,
    doCollect: false,
    perkAlmanac: false,
    perkAlmanac2: false,
    perkPrimer: false,
    perkPrimer2: false,
    perkHotterOvens: true,
    perkQuicker1: true,
    perkQuicker2: true,
    perkFishChips: false,
  };

  it('matches expected Bone Broth timeline', () => {
    const timeline = computeTimeline(baseInputs);
    const expected = [
      { time: 0, action: 'Start' },
      { time: 60, action: 'Stir (-39s)' },
      { time: 180, action: 'Taste' },
      { time: 300, action: 'Season' },
      { time: 411, action: 'Finish' },
    ];
    expect(timeline.length).toBe(expected.length);
    timeline.forEach((step, i) => {
      expect(step.time).toBe(expected[i]!.time);
      expect(step.action).toBe(expected[i]!.action);
    });
  });

  it('matches expected Onion Soup timeline', () => {
    const timeline = computeTimeline({ ...baseInputs, mealName: 'Onion Soup' });
    const expected = [
      { time: 0, action: 'Start' },
      { time: 60, action: 'Stir (-4m24s)' },
      { time: 180, action: 'Taste' },
      { time: 300, action: 'Season' },
      { time: 960, action: 'Stir (-2m27s)' },
      { time: 1380, action: 'Taste' },
      { time: 1860, action: 'Stir (-42s)' },
      { time: 2100, action: 'Season' },
      { time: 2247, action: 'Finish' },
    ];
    expect(timeline.length).toBe(expected.length);
    timeline.forEach((step, i) => {
      expect(step.time).toBe(expected[i]!.time);
      expect(step.action).toBe(expected[i]!.action);
    });
  });
});

describe('calculateCooking', () => {
  it('applies fish and chips multiplier consistently', () => {
    const base = calculateCooking({
      mealName: 'Bone Broth', batchSize: 1, maxOvens: 1, eventBonus: 0,
      doStir: true, doTaste: true, doSeason: true, doCollect: true,
      perkAlmanac: false, perkAlmanac2: false, perkPrimer: false, perkPrimer2: false,
      perkHotterOvens: false, perkQuicker1: false, perkQuicker2: false,
      perkFishChips: false,
    });
    const withFish = calculateCooking({
      mealName: 'Bone Broth', batchSize: 1, maxOvens: 1, eventBonus: 0,
      doStir: true, doTaste: true, doSeason: true, doCollect: true,
      perkAlmanac: false, perkAlmanac2: false, perkPrimer: false, perkPrimer2: false,
      perkHotterOvens: false, perkQuicker1: false, perkQuicker2: false,
      perkFishChips: true,
    });
    // Fish and Chips should multiply total XP by ~20 (rounding may differ slightly)
    // The ratio should be exactly 20 before final rounding
    expect(withFish.totalXP / base.totalXP).toBeCloseTo(20, 0);
  });

  it('returns zero for unknown meal', () => {
    const result = calculateCooking({
      mealName: 'Nonexistent Meal', batchSize: 1, maxOvens: 1, eventBonus: 0,
      doStir: true, doTaste: true, doSeason: true, doCollect: true,
      perkAlmanac: false, perkAlmanac2: false, perkPrimer: false, perkPrimer2: false,
      perkHotterOvens: false, perkQuicker1: false, perkQuicker2: false,
      perkFishChips: false,
    });
    expect(result.totalXP).toBe(0);
  });
});
