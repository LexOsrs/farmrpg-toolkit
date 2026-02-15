import { buildings } from '../data/buildings';

export function upgradeCost(initialCost: number, costIncrement: number, fromLevel: number, toLevel: number): number {
  if (toLevel <= fromLevel) return 0;
  const a = fromLevel;
  const b = toLevel;
  return (b - a) * initialCost + costIncrement * (b * (b - 1) - a * (a - 1)) / 2;
}

export interface ProductLevel {
  currentLevel: number;
  addLevels: number;
}

export interface BuildingCost {
  buildingName: string;
  total: number;
}

export interface ProductionSummary {
  buildingCosts: BuildingCost[];
  grandTotal: number;
}

export function calculateProductionSummary(levels: Record<string, ProductLevel>): ProductionSummary {
  const buildingCosts: BuildingCost[] = [];
  let grandTotal = 0;

  for (const building of buildings) {
    let buildingTotal = 0;
    for (const product of building.products) {
      const raw = levels[product.id];
      const currentLevel = raw?.currentLevel ?? 0;
      const addLevels = raw?.addLevels ?? 0;
      buildingTotal += upgradeCost(product.initialCost, product.costIncrement, currentLevel, currentLevel + addLevels);
    }
    buildingCosts.push({ buildingName: building.name, total: buildingTotal });
    grandTotal += buildingTotal;
  }

  return { buildingCosts, grandTotal };
}
