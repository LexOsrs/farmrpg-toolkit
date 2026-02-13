import { describe, it, expect } from 'vitest';
import { calculateFriendship } from '../calculators/friendship';

describe('calculateFriendship', () => {
  it('computes basic loved gift XP', () => {
    const result = calculateFriendship({
      giftType: 'loved', giftCount: 1, currentLevel: 1.0,
      totd: false, meal: false, primer: false, omg1: false, omg2: false,
    });
    expect(result.gainedXP).toBe(150);
    expect(result.newLevel).toBeGreaterThan(1);
  });

  it('applies townsfolk of the day multiplier', () => {
    const base = calculateFriendship({
      giftType: 'loved', giftCount: 10, currentLevel: 1.0,
      totd: false, meal: false, primer: false, omg1: false, omg2: false,
    });
    const withTotd = calculateFriendship({
      giftType: 'loved', giftCount: 10, currentLevel: 1.0,
      totd: true, meal: false, primer: false, omg1: false, omg2: false,
    });
    expect(withTotd.gainedXP).toBe(base.gainedXP * 2);
  });

  it('includes OMG section when enabled', () => {
    const result = calculateFriendship({
      giftType: 'loved', giftCount: 1, currentLevel: 1.0,
      totd: false, meal: false, primer: false, omg1: true, omg2: false,
    });
    expect(result.omg).not.toBeNull();
    expect(result.omg!.minXP).toBe(result.gainedXP * 7);
    expect(result.omg!.maxXP).toBe(result.gainedXP * 10);
  });

  it('returns null OMG when disabled', () => {
    const result = calculateFriendship({
      giftType: 'loved', giftCount: 1, currentLevel: 1.0,
      totd: false, meal: false, primer: false, omg1: false, omg2: false,
    });
    expect(result.omg).toBeNull();
  });

  it('clamps level at 99', () => {
    const result = calculateFriendship({
      giftType: 'heart', giftCount: 100, currentLevel: 98.0,
      totd: false, meal: false, primer: false, omg1: false, omg2: false,
    });
    expect(result.newLevel).toBeLessThanOrEqual(99);
  });
});
