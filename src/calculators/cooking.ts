import { getMealByName } from '../data/meals';

export interface CookingInputs {
  mealName: string;
  batchSize: number;
  maxOvens: number;
  eventBonus: number;
  doStir: boolean;
  doTaste: boolean;
  doSeason: boolean;
  doCollect: boolean;
  perkAlmanac: boolean;
  perkAlmanac2: boolean;
  perkPrimer: boolean;
  perkPrimer2: boolean;
  perkHotterOvens: boolean;
  perkQuicker1: boolean;
  perkQuicker2: boolean;
  perkFishChips: boolean;
}

export interface CookingResults {
  totalXP: number;
  xpPerHour: number;
  xpPerAction: number;
  stirXP: number;
  tasteXP: number;
  seasonXP: number;
  collectXP: number;
  stirActions: number;
  tasteActions: number;
  seasonActions: number;
  collectActions: number;
  totalActions: number;
  totalMastery: number;
  finishTime: number;
  ingredients: Record<string, number>;
}

export function calculateCooking(inputs: CookingInputs): CookingResults {
  const meal = getMealByName(inputs.mealName);
  if (!meal) {
    return {
      totalXP: 0, xpPerHour: 0, xpPerAction: 0,
      stirXP: 0, tasteXP: 0, seasonXP: 0, collectXP: 0,
      stirActions: 0, tasteActions: 0, seasonActions: 0, collectActions: 0,
      totalActions: 0, totalMastery: 0, finishTime: 0, ingredients: {},
    };
  }

  const { batchSize, maxOvens, eventBonus, doStir, doTaste, doSeason, doCollect,
    perkAlmanac, perkAlmanac2, perkPrimer, perkPrimer2,
    perkHotterOvens, perkQuicker1, perkQuicker2, perkFishChips } = inputs;

  const baseTime = meal.time;

  // Speed multiplier (single computation)
  let speedMult = 1;
  if (perkHotterOvens) speedMult -= 0.10;
  if (perkQuicker1) speedMult -= 0.05;
  if (perkQuicker2) speedMult -= 0.10;
  const baseTimeWithPerks = Math.round(baseTime * speedMult);

  // XP multiplier — computed ONCE (fixes xpMult shadowing bug)
  let xpMult = 1;
  if (perkAlmanac) xpMult += 0.10;
  if (perkAlmanac2) xpMult += 0.10;
  if (perkPrimer) xpMult += 0.10;
  if (perkPrimer2) xpMult += 0.10;

  // Fish & Chips multiplier — applied uniformly (fixes Fish&Chips bug)
  const fishChipsMult = perkFishChips ? 20 : 1;

  // Stir XP: simulate the timeline for stirs
  let stirXP = 0;
  let stirActionCount = 0;
  if (doStir) {
    let remaining = baseTimeWithPerks;
    let lastActionTime = 0;
    const stirTimes: number[] = [];
    for (let t = 60; t < 24 * 3600; t += 15 * 60) stirTimes.push(t);
    for (const t of stirTimes) {
      if (t >= remaining + lastActionTime) break;
      const elapsed = t - lastActionTime;
      remaining = Math.max(0, remaining - elapsed);
      const secondsReduced = Math.floor(remaining * 0.1);
      const minutesReduced = Math.ceil(secondsReduced / 60);
      if (minutesReduced > 0) {
        stirXP += 17 * maxOvens * minutesReduced * (1 + eventBonus) * fishChipsMult;
      }
      stirActionCount++;
      remaining = Math.max(0, remaining - secondsReduced);
      lastActionTime = t;
      if (remaining <= 0) break;
    }
  }

  // Taste XP
  let tasteXP = 0;
  let mastery = 0;
  let tasteActionCount = 0;
  if (doTaste) {
    const masteryPerTaste = 1 + Math.floor(baseTime / 1800);
    tasteXP = 30 * maxOvens * masteryPerTaste * (1 + eventBonus) * fishChipsMult;
    mastery = masteryPerTaste * maxOvens;
    tasteActionCount = 1;
  }

  // Season XP
  let seasonXP = 0;
  let seasonActionCount = 0;
  if (doSeason) {
    const seasonBase = (baseTime / 60) / 2;
    seasonXP = 3.5 * maxOvens * seasonBase * (1 + eventBonus) * xpMult * fishChipsMult;
    seasonActionCount = 1;
  }

  // Collect XP
  let collectXPTotal = 0;
  let collectActionCount = 0;
  if (doCollect) {
    collectXPTotal = (meal.collectXP) * xpMult * fishChipsMult;
    collectActionCount = 1;
  }

  // Count timeline actions for per-batch
  const timeline = computeTimeline(inputs);
  const timelineActions = timeline.filter(s => s.action !== 'Start' && s.action !== 'Finish');
  stirActionCount = timelineActions.filter(s => s.actionType === 'stir').length;
  tasteActionCount = timelineActions.filter(s => s.actionType === 'taste').length;
  seasonActionCount = timelineActions.filter(s => s.actionType === 'season').length;
  collectActionCount = timelineActions.filter(s => s.actionType === 'collect').length;

  // Re-compute stir XP from timeline (single source of truth)
  stirXP = 0;
  for (const step of timelineActions) {
    if (step.actionType === 'stir') {
      stirXP += step.xpGained;
    }
  }

  // Re-compute taste/season/collect from timeline
  tasteXP = 0;
  seasonXP = 0;
  collectXPTotal = 0;
  for (const step of timelineActions) {
    if (step.actionType === 'taste') tasteXP += step.xpGained;
    if (step.actionType === 'season') seasonXP += step.xpGained;
    if (step.actionType === 'collect') collectXPTotal += step.xpGained;
  }

  const totalXPPerBatch = stirXP + tasteXP + seasonXP + collectXPTotal;
  const totalXP = Math.round(totalXPPerBatch * batchSize);

  const finishTime = timeline.length > 0 ? timeline[timeline.length - 1]!.time : 0;
  const hours = finishTime / 3600;
  const xpPerHour = hours > 0 ? Math.round(totalXP / hours) : 0;

  const totalActionsPerBatch = stirActionCount + tasteActionCount + seasonActionCount + collectActionCount;
  const totalActionsTotal = totalActionsPerBatch * batchSize;
  const xpPerAction = totalActionsTotal > 0 ? totalXP / totalActionsTotal : 0;

  // Mastery: from taste + 1 per collect
  const collectMastery = collectActionCount * batchSize;
  const totalMastery = (mastery * batchSize) + collectMastery;

  // Ingredients
  const ingredients: Record<string, number> = {};
  for (const ing of meal.ingredients) {
    ingredients[ing.name] = (ingredients[ing.name] ?? 0) + ing.qty * batchSize;
  }

  return {
    totalXP,
    xpPerHour,
    xpPerAction,
    stirXP: Math.round(stirXP * batchSize),
    tasteXP: Math.round(tasteXP * batchSize),
    seasonXP: Math.round(seasonXP * batchSize),
    collectXP: Math.round(collectXPTotal * batchSize),
    stirActions: stirActionCount * batchSize,
    tasteActions: tasteActionCount * batchSize,
    seasonActions: seasonActionCount * batchSize,
    collectActions: collectActionCount * batchSize,
    totalActions: totalActionsTotal,
    totalMastery,
    finishTime,
    ingredients,
  };
}

// Exported for the timeline component to use
export interface TimelineStep {
  time: number;
  action: string;
  actionType: 'start' | 'stir' | 'taste' | 'season' | 'collect' | 'finish';
  remainingTime: number;
  xpGained: number;
}

export function computeTimeline(inputs: CookingInputs): TimelineStep[] {
  const meal = getMealByName(inputs.mealName);
  if (!meal) return [];

  const { maxOvens, eventBonus, doStir, doTaste, doSeason, doCollect,
    perkAlmanac, perkAlmanac2, perkPrimer, perkPrimer2,
    perkHotterOvens, perkQuicker1, perkQuicker2, perkFishChips } = inputs;

  const baseTime = meal.time;

  let speedMult = 1;
  if (perkHotterOvens) speedMult -= 0.10;
  if (perkQuicker1) speedMult -= 0.05;
  if (perkQuicker2) speedMult -= 0.10;
  const baseTimeWithPerks = Math.round(baseTime * speedMult);

  let xpMult = 1;
  if (perkAlmanac) xpMult += 0.10;
  if (perkAlmanac2) xpMult += 0.10;
  if (perkPrimer) xpMult += 0.10;
  if (perkPrimer2) xpMult += 0.10;

  const fishChipsMult = perkFishChips ? 20 : 1;

  const steps: TimelineStep[] = [];
  let remainingTime = baseTimeWithPerks;

  steps.push({ time: 0, action: 'Start', actionType: 'start', remainingTime, xpGained: 0 });

  // Build action schedule
  const stirTimes: number[] = [];
  const tasteTimes: number[] = [];
  const seasonTimes: number[] = [];
  if (doStir) for (let t = 60; t < 24 * 3600; t += 15 * 60) stirTimes.push(t);
  if (doTaste) for (let t = 180; t < 24 * 3600; t += 20 * 60) tasteTimes.push(t);
  if (doSeason) for (let t = 300; t < 24 * 3600; t += 30 * 60) seasonTimes.push(t);

  interface ScheduledAction { type: 'stir' | 'taste' | 'season'; time: number }
  const allActions: ScheduledAction[] = [];
  stirTimes.forEach(t => allActions.push({ type: 'stir', time: t }));
  tasteTimes.forEach(t => allActions.push({ type: 'taste', time: t }));
  seasonTimes.forEach(t => allActions.push({ type: 'season', time: t }));
  allActions.sort((a, b) => a.time - b.time);

  let finishTime = baseTimeWithPerks;
  let lastActionTime = 0;
  let i = 0;

  while (i < allActions.length && remainingTime > 0) {
    const action = allActions[i]!;
    if (action.time >= finishTime) break;

    const elapsed = action.time - lastActionTime;
    remainingTime = Math.max(0, remainingTime - elapsed);
    const currentTime = action.time;

    if (action.type === 'stir') {
      const secondsReduced = Math.floor(remainingTime * 0.1);
      let label: string;
      if (secondsReduced < 60) {
        label = `Stir (-${secondsReduced}s)`;
      } else if (secondsReduced % 60 === 0) {
        label = `Stir (-${secondsReduced / 60}m)`;
      } else {
        label = `Stir (-${Math.floor(secondsReduced / 60)}m${secondsReduced % 60}s)`;
      }

      const minutesReduced = Math.ceil(secondsReduced / 60);
      const xpGained = minutesReduced > 0 ? 17 * maxOvens * minutesReduced * (1 + eventBonus) * fishChipsMult : 0;

      steps.push({ time: currentTime, action: label, actionType: 'stir', remainingTime, xpGained });
      remainingTime = Math.max(0, remainingTime - secondsReduced);
      finishTime = currentTime + remainingTime;
      if (remainingTime <= 0) { lastActionTime = currentTime; break; }
      if (i + 1 < allActions.length && allActions[i + 1]!.time >= finishTime) { lastActionTime = currentTime; break; }
    }

    if (action.type === 'taste') {
      const masteryPerTaste = 1 + Math.floor(baseTime / 1800);
      const xpGained = 30 * maxOvens * masteryPerTaste * (1 + eventBonus) * fishChipsMult;
      steps.push({ time: currentTime, action: 'Taste', actionType: 'taste', remainingTime, xpGained });
    }

    if (action.type === 'season') {
      const seasonBase = (baseTime / 60) / 2;
      const xpGained = 3.5 * maxOvens * seasonBase * xpMult * (1 + eventBonus) * fishChipsMult;
      steps.push({ time: currentTime, action: 'Season', actionType: 'season', remainingTime, xpGained });
    }

    lastActionTime = currentTime;
    i++;
  }

  const actualFinishTime = lastActionTime + remainingTime;
  steps.push({ time: actualFinishTime, action: 'Finish', actionType: 'finish', remainingTime: 0, xpGained: 0 });

  if (doCollect) {
    const collectXPVal = meal.collectXP * xpMult * fishChipsMult;
    steps.push({ time: actualFinishTime, action: 'Collect', actionType: 'collect', remainingTime: 0, xpGained: collectXPVal });
  }

  return steps;
}
