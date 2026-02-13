import { getXPFromLevel, getLevelFromXP } from '../data/friendshipLevels';

export type GiftType = 'loved' | 'liked' | 'other' | 'heart' | 'bouquet' | 'prism' | 'mask' | 'corn' | 'mace' | 'palette' | 'garebear';

export interface FriendshipInputs {
  giftType: GiftType;
  giftCount: number;
  currentLevel: number;
  totd: boolean;
  meal: boolean;
  primer: boolean;
  omg1: boolean;
  omg2: boolean;
}

export interface FriendshipResults {
  currentXP: number;
  gainedXP: number;
  newXP: number;
  newLevel: number;
  omg: {
    minXP: number;
    maxXP: number;
    minNewXP: number;
    maxNewXP: number;
    minLevel: number;
    maxLevel: number;
  } | null;
}

function getBaseXP(type: GiftType): number {
  switch (type) {
    case 'loved': return 150;
    case 'liked': return 25;
    case 'other': return 1;
    case 'heart': return 10000000;
    case 'bouquet': return 1000;
    case 'prism':
    case 'mask':
    case 'corn':
    case 'mace':
    case 'palette':
    case 'garebear':
      return 100000000;
    default: return 0;
  }
}

export function calculateFriendship(inputs: FriendshipInputs): FriendshipResults {
  const { giftType, giftCount, currentLevel, totd, meal, primer, omg1, omg2 } = inputs;

  const clampedLevel = Math.min(currentLevel, 99);
  const currentXP = getXPFromLevel(clampedLevel);

  const baseXP = getBaseXP(giftType) * giftCount;
  let mult = 1;
  if (totd) mult *= 2;
  if (primer) mult *= 1.1;
  if (meal) mult *= 1.1;
  const gainedXP = baseXP * mult;
  const newXP = currentXP + gainedXP;
  const newLevel = getLevelFromXP(newXP);

  let omg = null;
  if (omg1 || omg2) {
    const minOMG = gainedXP * 7;
    const maxOMG = gainedXP * 10;
    omg = {
      minXP: minOMG,
      maxXP: maxOMG,
      minNewXP: currentXP + minOMG,
      maxNewXP: currentXP + maxOMG,
      minLevel: getLevelFromXP(currentXP + minOMG),
      maxLevel: getLevelFromXP(currentXP + maxOMG),
    };
  }

  return { currentXP, gainedXP, newXP, newLevel, omg };
}
