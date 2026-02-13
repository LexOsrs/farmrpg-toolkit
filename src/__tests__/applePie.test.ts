import { describe, it, expect } from 'vitest';
import { calculateApplePie } from '../calculators/applePie';

describe('calculateApplePie', () => {
  it('computes basic break-even scenario', () => {
    const result = calculateApplePie({
      numPies: 1,
      exploringLevel: 99,
      currentTower: 50,
      targetTower: 100,
      waitAmount: 1,
      waitUnit: 'months',
    });
    expect(result.lostStamina).toBeGreaterThan(0);
    expect(result.extraDaily).toBeGreaterThan(0);
    expect(result.breakEvenDays).toBeGreaterThan(0);
  });

  it('returns zero when deltaS is zero', () => {
    const result = calculateApplePie({
      numPies: 1,
      exploringLevel: 99,
      currentTower: 50,
      targetTower: 50,
      waitAmount: 1,
      waitUnit: 'days',
    });
    expect(result.lostStamina).toBe(0);
    expect(result.extraDaily).toBe(0);
    expect(result.breakEvenDays).toBe(0);
  });

  it('shows exploring warning when below 99', () => {
    const result = calculateApplePie({
      numPies: 1,
      exploringLevel: 50,
      currentTower: 50,
      targetTower: 100,
      waitAmount: 1,
      waitUnit: 'days',
    });
    expect(result.exploringWarning).not.toBeNull();
    expect(result.exploringWarning).toContain('490');
  });

  it('no exploring warning at level 99', () => {
    const result = calculateApplePie({
      numPies: 1,
      exploringLevel: 99,
      currentTower: 50,
      targetTower: 100,
      waitAmount: 1,
      waitUnit: 'days',
    });
    expect(result.exploringWarning).toBeNull();
  });

  it('handles weeks and months correctly', () => {
    const weeks = calculateApplePie({
      numPies: 1, exploringLevel: 99, currentTower: 50, targetTower: 100,
      waitAmount: 1, waitUnit: 'weeks',
    });
    const days = calculateApplePie({
      numPies: 1, exploringLevel: 99, currentTower: 50, targetTower: 100,
      waitAmount: 7, waitUnit: 'days',
    });
    expect(weeks.lostStamina).toBe(days.lostStamina);
  });
});
