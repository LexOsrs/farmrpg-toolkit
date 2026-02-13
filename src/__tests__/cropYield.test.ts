import { describe, it, expect } from 'vitest';
import { calculateCropYield } from '../calculators/cropYield';

describe('calculateCropYield', () => {
  it('computes basic yield with no bonuses', () => {
    const result = calculateCropYield({
      cropSpaces: 48, harvests: 1, regularSeeds: 48, megaSeeds: 0,
      cookieTypes: 0, doublePrizes1: false, doublePrizes2: false,
    });
    expect(result.avgPerHarvest).toBe(48);
    expect(result.totalCrops).toBe(48);
    expect(result.seedWarning).toBeNull();
  });

  it('applies mega seed multiplier', () => {
    const result = calculateCropYield({
      cropSpaces: 48, harvests: 1, regularSeeds: 0, megaSeeds: 48,
      cookieTypes: 0, doublePrizes1: false, doublePrizes2: false,
    });
    expect(result.totalCrops).toBe(480);
  });

  it('applies cookie multiplier', () => {
    const result = calculateCropYield({
      cropSpaces: 48, harvests: 1, regularSeeds: 48, megaSeeds: 0,
      cookieTypes: 3, doublePrizes1: false, doublePrizes2: false,
    });
    expect(result.totalCrops).toBe(48 * 9);
  });

  it('applies double prizes', () => {
    const result = calculateCropYield({
      cropSpaces: 48, harvests: 1, regularSeeds: 48, megaSeeds: 0,
      cookieTypes: 0, doublePrizes1: true, doublePrizes2: true,
    });
    expect(result.totalCrops).toBe(Math.round(48 * 1.40));
  });

  it('shows seed warning when over capacity', () => {
    const result = calculateCropYield({
      cropSpaces: 48, harvests: 1, regularSeeds: 30, megaSeeds: 30,
      cookieTypes: 0, doublePrizes1: false, doublePrizes2: false,
    });
    expect(result.seedWarning).not.toBeNull();
  });
});
