const REGEN_RATE = 8;

export interface ApplePieInputs {
  numPies: number;
  exploringLevel: number;
  currentTower: number;
  targetTower: number;
  waitAmount: number;
  waitUnit: 'days' | 'weeks' | 'months';
}

export interface ApplePieResults {
  lostStamina: number;
  extraDaily: number;
  breakEvenDays: number;
  staminaNow: number;
  staminaLater: number;
  exploringWarning: string | null;
}

export function calculateApplePie(inputs: ApplePieInputs): ApplePieResults {
  const { numPies, exploringLevel, currentTower, targetTower, waitAmount, waitUnit } = inputs;

  let D = waitAmount;
  if (waitUnit === 'weeks') D = waitAmount * 7;
  if (waitUnit === 'months') D = waitAmount * 30;

  const staminaNow = (exploringLevel * 10) + currentTower;
  const staminaLater = (exploringLevel * 10) + targetTower;
  const deltaS = Math.max(staminaLater - staminaNow, 0);
  const valid = numPies > 0 && D > 0 && staminaNow > 0 && deltaS > 0;

  const lostStamina = valid ? numPies * staminaNow * REGEN_RATE * D : 0;
  const extraDaily = valid ? numPies * deltaS * REGEN_RATE : 0;

  let breakEvenDays = 0;
  if (valid && extraDaily > 0) {
    breakEvenDays = lostStamina / extraDaily;
  }

  let exploringWarning: string | null = null;
  if (exploringLevel < 99) {
    const extraPerPie = (99 - exploringLevel) * 10;
    const totalExtra = numPies * extraPerPie;
    const perDay = totalExtra * REGEN_RATE;
    const pieWord = numPies === 1 ? 'pie' : 'pies';
    exploringWarning = `Tip: Each Exploring level is worth 10\u00d7 as much as a Tower level. If you reach level 99, each pie will give an extra ${extraPerPie.toLocaleString('en-US')} max stamina (${perDay.toLocaleString('en-US')} more stamina per day for ${numPies} ${pieWord}). Consider waiting to maximize your pies.`;
  }

  return { lostStamina, extraDaily, breakEvenDays, staminaNow, staminaLater, exploringWarning };
}
