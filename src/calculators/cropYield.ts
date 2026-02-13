export interface CropYieldInputs {
  cropSpaces: number;
  harvests: number;
  regularSeeds: number;
  megaSeeds: number;
  cookieTypes: number;
  doublePrizes1: boolean;
  doublePrizes2: boolean;
}

export interface CropYieldResults {
  avgPerHarvest: number;
  totalCrops: number;
  seedWarning: string | null;
}

export function calculateCropYield(inputs: CropYieldInputs): CropYieldResults {
  const { cropSpaces, harvests, regularSeeds, megaSeeds, cookieTypes, doublePrizes1, doublePrizes2 } = inputs;

  const totalSeeds = regularSeeds + megaSeeds;
  const seedWarning = totalSeeds > cropSpaces
    ? 'Warning: The total number of seeds (regular + mega) cannot exceed your crop spaces!'
    : null;

  const regularYield = regularSeeds * 1;
  const megaYield = megaSeeds * 10;
  const totalBaseYield = (regularYield + megaYield) * harvests;

  const cookieMult = [1, 3, 6, 9][cookieTypes] ?? 1;
  const yieldWithCookies = totalBaseYield * cookieMult;

  let doubleChance = 0;
  if (doublePrizes1) doubleChance += 0.15;
  if (doublePrizes2) doubleChance += 0.25;
  const totalCrops = yieldWithCookies * (1 + doubleChance);

  return {
    avgPerHarvest: Math.round(totalCrops / harvests),
    totalCrops: Math.round(totalCrops),
    seedWarning,
  };
}
