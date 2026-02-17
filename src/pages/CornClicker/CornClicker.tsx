import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { formatSilver } from '../../utils/format';
import Card from '../../components/Card/Card';
import styles from './CornClicker.module.css';

type BuyAmount = 1 | 10 | 'max';

interface GameState {
  corn: number;
  totalCorn: number;
  totalClicks: number;
  upgrades: Record<string, number>;
  achievements: string[];
  goldenSeeds: number;
  lifetimeSeeds: number;
  totalPrestiges: number;
  fields: Record<string, number>;
  pets: Record<string, number>;
  crates: number;
  completed: boolean;
  lastTick: number;
}

const MAX_OFFLINE_SECONDS = 8 * 60 * 60; // 8 hours
const CORNUCOPIA_COST = 10_000;

const defaultState: GameState = {
  corn: 0,
  totalCorn: 0,
  totalClicks: 0,
  upgrades: {},
  achievements: [],
  goldenSeeds: 0,
  lifetimeSeeds: 0,
  totalPrestiges: 0,
  fields: {},
  pets: {},
  crates: 0,
  completed: false,
  lastTick: 0,
};

const acreMultipliers = [0, 0.2, 0.5, 1, 2, 4, 7, 10, 15, 20, 30];

function calcBaseSeeds(totalCorn: number): number {
  return Math.floor(Math.sqrt(totalCorn / 100_000));
}

function calcGoldenSeeds(totalCorn: number, goldenAcreLevel: number): number {
  const bonus = 1 + (acreMultipliers[goldenAcreLevel] ?? 0);
  return Math.floor(calcBaseSeeds(totalCorn) * bonus);
}


// --- Upgrades ---

interface UpgradeDef {
  id: string;
  name: string;
  desc: string;
  baseCost: number;
  scaling: number;
  perClick?: number;
  perSecond?: number;
  multiplier?: number;
}

const upgrades: UpgradeDef[] = [
  { id: 'basket', name: 'Bigger Basket', desc: '+1 per click', baseCost: 10, scaling: 1.5, perClick: 1 },
  { id: 'scarecrow', name: 'Scarecrow', desc: '+1 per second', baseCost: 50, scaling: 1.6, perSecond: 1 },
  { id: 'fertilizer', name: 'Fertilizer', desc: '+5 per second', baseCost: 300, scaling: 1.7, perSecond: 5 },
  { id: 'tractor', name: 'Tractor', desc: '+25 per second', baseCost: 2_000, scaling: 1.8, perSecond: 25 },
  { id: 'megaseeds', name: 'Mega Seeds', desc: '+100 per second', baseCost: 15_000, scaling: 1.9, perSecond: 100 },
  { id: 'cookieboost', name: 'Cookie Boost', desc: '2x all production', baseCost: 100_000, scaling: 3, multiplier: 2 },
];

// --- Fields ---

interface FieldDef {
  id: string;
  name: string;
  emoji: string;
  desc: (level: number) => string;
  costs: number[];
}

const FIELD_MAX = 10;
const fieldCosts = [1, 2, 4, 8, 15, 25, 40, 60, 85, 120];

const fieldDefs: FieldDef[] = [
  {
    id: 'meadow', name: 'Sunny Meadow', emoji: '☀️',
    desc: (l) => l === 0 ? 'Passive corn/sec through prestige' : `+${formatSilver([0, 1, 3, 8, 20, 50, 100, 200, 500, 1000, 2500][l] ?? 0)}/sec (persists through prestige)`,
    costs: fieldCosts,
  },
  {
    id: 'valley', name: 'Fertile Valley', emoji: '🌿',
    desc: (l) => l === 0 ? 'Multiply click power' : `${[0, 1.5, 2, 3, 5, 8, 12, 18, 25, 35, 50][l]}x click power`,
    costs: fieldCosts,
  },
  {
    id: 'acre', name: 'Golden Acre', emoji: '✨',
    desc: (l) => l === 0 ? 'Bonus Golden Seeds on prestige' : `+${[0, 20, 50, 100, 200, 400, 700, 1000, 1500, 2000, 3000][l] ?? 0}% seeds on prestige`,
    costs: fieldCosts,
  },
  {
    id: 'moon', name: 'Harvest Moon', emoji: '🌙',
    desc: (l) => l === 0 ? 'Reduce upgrade costs' : `-${[0, 5, 10, 15, 20, 30, 40, 50, 60, 70, 80][l]}% upgrade costs`,
    costs: fieldCosts,
  },
  {
    id: 'grove', name: 'Enchanted Grove', emoji: '🌳',
    desc: (l) => l === 0 ? 'Auto-clicks per second' : `${[0, 1, 2, 3, 5, 8, 12, 18, 25, 35, 50][l]} auto-clicks/sec`,
    costs: fieldCosts,
  },
];

// --- Pets ---

type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

interface PetDef {
  id: string;
  name: string;
  emoji: string;
  noise: string;
  rarity: Rarity;
  bonusDesc: string;
  clickMult: number;
  idleMult: number;
  seedMult: number;
}

const petDefs: PetDef[] = [
  { id: 'chicken', name: 'Chicken', emoji: '🐔', noise: 'Cluck!', rarity: 'common', bonusDesc: '+5% click/lvl', clickMult: 0.05, idleMult: 0, seedMult: 0 },
  { id: 'cat', name: 'Barn Cat', emoji: '🐱', noise: 'Meow!', rarity: 'common', bonusDesc: '+5% idle/lvl', clickMult: 0, idleMult: 0.05, seedMult: 0 },
  { id: 'mouse', name: 'Field Mouse', emoji: '🐭', noise: 'Squeak!', rarity: 'common', bonusDesc: '+3% all/lvl', clickMult: 0.03, idleMult: 0.03, seedMult: 0 },
  { id: 'dog', name: 'Sheepdog', emoji: '🐕', noise: 'Woof!', rarity: 'uncommon', bonusDesc: '+10% idle/lvl', clickMult: 0, idleMult: 0.1, seedMult: 0 },
  { id: 'goat', name: 'Goat', emoji: '🐐', noise: 'Baa!', rarity: 'uncommon', bonusDesc: '+10% click/lvl', clickMult: 0.1, idleMult: 0, seedMult: 0 },
  { id: 'pig', name: 'Pig', emoji: '🐷', noise: 'Oink!', rarity: 'uncommon', bonusDesc: '+8% seeds/lvl', clickMult: 0, idleMult: 0, seedMult: 0.08 },
  { id: 'cow', name: 'Cow', emoji: '🐄', noise: 'Moo!', rarity: 'rare', bonusDesc: '+10% all/lvl', clickMult: 0.1, idleMult: 0.1, seedMult: 0 },
  { id: 'horse', name: 'Horse', emoji: '🐴', noise: 'Neigh!', rarity: 'rare', bonusDesc: '+15% idle/lvl', clickMult: 0, idleMult: 0.15, seedMult: 0 },
  { id: 'owl', name: 'Owl', emoji: '🦉', noise: 'Hoot!', rarity: 'rare', bonusDesc: '+15% seeds/lvl', clickMult: 0, idleMult: 0, seedMult: 0.15 },
  { id: 'goose', name: 'Golden Goose', emoji: '🪿', noise: 'Honk!', rarity: 'legendary', bonusDesc: '+20% all/lvl', clickMult: 0.2, idleMult: 0.2, seedMult: 0.2 },
];

const rarityWeights: Record<Rarity, number> = { common: 50, uncommon: 30, rare: 15, legendary: 5 };
const rarityColors: Record<Rarity, string> = { common: '#6b7280', uncommon: '#2e7d4f', rare: '#4a7abb', legendary: '#d4a017' };

function rollPet(): PetDef {
  const totalWeight = Object.values(rarityWeights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;
  let selectedRarity: Rarity = 'common';
  for (const [rarity, weight] of Object.entries(rarityWeights) as [Rarity, number][]) {
    roll -= weight;
    if (roll <= 0) { selectedRarity = rarity; break; }
  }
  const pool = petDefs.filter(p => p.rarity === selectedRarity);
  return pool[Math.floor(Math.random() * pool.length)]!;
}

function getPetBonuses(pets: Record<string, number>) {
  let clickMult = 1;
  let idleMult = 1;
  let seedMult = 1;
  for (const def of petDefs) {
    const level = pets[def.id] ?? 0;
    if (level > 0) {
      clickMult += def.clickMult * level;
      idleMult += def.idleMult * level;
      seedMult += def.seedMult * level;
    }
  }
  return { clickMult, idleMult, seedMult };
}

const meadowPerSec = [0, 1, 3, 8, 20, 50, 100, 200, 500, 1000, 2500];
const valleyClickMult = [1, 1.5, 2, 3, 5, 8, 12, 18, 25, 35, 50];
const moonCostReduction = [1, 0.95, 0.9, 0.85, 0.8, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2];
const groveAutoClicks = [0, 1, 2, 3, 5, 8, 12, 18, 25, 35, 50];

// --- Achievements ---

interface AchievementDef {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  check: (s: GameState) => boolean;
  visible?: (s: GameState) => boolean;
  progress?: (s: GameState) => { current: number; target: number };
}

const achievements: AchievementDef[] = [
  { id: 'first_corn', name: 'Baby Steps', desc: 'Harvest your first corn', emoji: '🌱', check: s => s.totalCorn >= 1, progress: s => ({ current: Math.min(s.totalCorn, 1), target: 1 }) },
  { id: 'corn_100', name: 'Handful', desc: 'Earn 100 total corn', emoji: '🧺', check: s => s.totalCorn >= 100, progress: s => ({ current: Math.min(s.totalCorn, 100), target: 100 }) },
  { id: 'corn_1k', name: 'Bushel', desc: 'Earn 1,000 total corn', emoji: '🌾', check: s => s.totalCorn >= 1_000, progress: s => ({ current: Math.min(s.totalCorn, 1_000), target: 1_000 }) },
  { id: 'corn_10k', name: 'Cornucopia', desc: 'Earn 10,000 total corn', emoji: '🎉', check: s => s.totalCorn >= 10_000, progress: s => ({ current: Math.min(s.totalCorn, 10_000), target: 10_000 }) },
  { id: 'corn_100k', name: 'Corn Baron', desc: 'Earn 100,000 total corn', emoji: '🏰', check: s => s.totalCorn >= 100_000, progress: s => ({ current: Math.min(s.totalCorn, 100_000), target: 100_000 }) },
  { id: 'corn_1m', name: 'Corn Mogul', desc: 'Earn 1 million total corn', emoji: '💰', check: s => s.totalCorn >= 1_000_000, progress: s => ({ current: Math.min(s.totalCorn, 1_000_000), target: 1_000_000 }) },
  { id: 'corn_1b', name: 'Corn Tycoon', desc: 'Earn 1 billion total corn', emoji: '👑', check: s => s.totalCorn >= 1_000_000_000, progress: s => ({ current: Math.min(s.totalCorn, 1_000_000_000), target: 1_000_000_000 }) },
  { id: 'clicks_100', name: 'Clicker', desc: 'Click 100 times', emoji: '👆', check: s => s.totalClicks >= 100, progress: s => ({ current: Math.min(s.totalClicks, 100), target: 100 }) },
  { id: 'clicks_1k', name: 'Rapid Fire', desc: 'Click 1,000 times', emoji: '⚡', check: s => s.totalClicks >= 1_000, progress: s => ({ current: Math.min(s.totalClicks, 1_000), target: 1_000 }) },
  { id: 'clicks_10k', name: 'Carpal Tunnel', desc: 'Click 10,000 times', emoji: '🦾', check: s => s.totalClicks >= 10_000, progress: s => ({ current: Math.min(s.totalClicks, 10_000), target: 10_000 }) },
  { id: 'buy_basket', name: 'Upgrade!', desc: 'Buy your first upgrade', emoji: '🛒', check: s => (s.upgrades['basket'] ?? 0) >= 1 },
  { id: 'buy_scarecrow', name: 'Idle Farmer', desc: 'Buy a Scarecrow', emoji: '🧑‍🌾', check: s => (s.upgrades['scarecrow'] ?? 0) >= 1, visible: s => (s.upgrades['basket'] ?? 0) >= 1 },
  { id: 'buy_tractor', name: 'Mechanized', desc: 'Buy a Tractor', emoji: '🚜', check: s => (s.upgrades['tractor'] ?? 0) >= 1, visible: s => (s.upgrades['fertilizer'] ?? 0) >= 1 },
  { id: 'buy_cookie', name: 'Boosted', desc: 'Buy a Cookie Boost', emoji: '🍪', check: s => (s.upgrades['cookieboost'] ?? 0) >= 1, visible: s => (s.upgrades['megaseeds'] ?? 0) >= 1 },
  { id: 'ten_baskets', name: 'Big Baskets', desc: 'Own 10 Bigger Baskets', emoji: '🧺', check: s => (s.upgrades['basket'] ?? 0) >= 10, progress: s => ({ current: Math.min(s.upgrades['basket'] ?? 0, 10), target: 10 }) },
  { id: 'ten_scarecrows', name: 'Scarecrow Army', desc: 'Own 10 Scarecrows', emoji: '🎃', check: s => (s.upgrades['scarecrow'] ?? 0) >= 10, visible: s => (s.upgrades['basket'] ?? 0) >= 1, progress: s => ({ current: Math.min(s.upgrades['scarecrow'] ?? 0, 10), target: 10 }) },
  { id: 'prestige_1', name: 'Golden Harvest', desc: 'Prestige for the first time', emoji: '🌟', check: s => (s.totalPrestiges ?? 0) >= 1, visible: s => s.totalCorn >= 50_000 },
  { id: 'prestige_5', name: 'Serial Farmer', desc: 'Prestige 5 times', emoji: '✨', check: s => (s.totalPrestiges ?? 0) >= 5, visible: s => (s.totalPrestiges ?? 0) >= 1, progress: s => ({ current: Math.min(s.totalPrestiges ?? 0, 5), target: 5 }) },
  { id: 'seeds_10', name: 'Seed Hoarder', desc: 'Earn 10 lifetime Golden Seeds', emoji: '💫', check: s => (s.lifetimeSeeds ?? 0) >= 10, visible: s => (s.lifetimeSeeds ?? 0) >= 1, progress: s => ({ current: Math.min(s.lifetimeSeeds ?? 0, 10), target: 10 }) },
  { id: 'first_field', name: 'Landowner', desc: 'Upgrade a field for the first time', emoji: '🏡', check: s => Object.values(s.fields ?? {}).some(l => l > 0), visible: s => (s.goldenSeeds ?? 0) >= 1 },
  { id: 'max_field', name: 'Field Master', desc: 'Max out a field to level 10', emoji: '🏆', check: s => Object.values(s.fields ?? {}).some(l => l >= FIELD_MAX), visible: s => Object.values(s.fields ?? {}).some(l => l > 0), progress: s => ({ current: Math.max(...Object.values(s.fields ?? {}), 0), target: FIELD_MAX }) },
  { id: 'first_pet', name: 'Animal Friend', desc: 'Get your first pet', emoji: '🐾', check: s => Object.values(s.pets ?? {}).some(l => l > 0), visible: s => (s.totalPrestiges ?? 0) >= 1 },
  { id: 'pets_5', name: 'Petting Zoo', desc: 'Collect 5 different pets', emoji: '🐣', check: s => Object.values(s.pets ?? {}).filter(l => l > 0).length >= 5, visible: s => Object.values(s.pets ?? {}).some(l => l > 0), progress: s => ({ current: Object.values(s.pets ?? {}).filter(l => l > 0).length, target: 5 }) },
  { id: 'pet_legendary', name: 'Lucky Find', desc: 'Get a legendary pet', emoji: '🪿', check: s => petDefs.filter(p => p.rarity === 'legendary').some(p => (s.pets?.[p.id] ?? 0) > 0), visible: () => false },
  { id: 'pets_all', name: 'Full Barn', desc: 'Collect all 10 pets', emoji: '🏅', check: s => petDefs.every(p => (s.pets?.[p.id] ?? 0) > 0), visible: s => Object.values(s.pets ?? {}).some(l => l > 0), progress: s => ({ current: petDefs.filter(p => (s.pets?.[p.id] ?? 0) > 0).length, target: 10 }) },
  { id: 'completed', name: 'Corn Master', desc: 'Complete the Golden Cornucopia', emoji: '🏆', check: s => s.completed === true, visible: s => fieldDefs.every(f => (s.fields?.[f.id] ?? 0) >= FIELD_MAX) },
];

// --- Helpers ---

interface Particle {
  id: number;
  x: number;
  y?: number;
  text: string;
}

function getCost(def: UpgradeDef, owned: number, costMult: number): number {
  return Math.floor(def.baseCost * def.scaling ** owned * costMult);
}

function getBulkCost(def: UpgradeDef, owned: number, count: number, costMult: number): number {
  let total = 0;
  for (let i = 0; i < count; i++) total += getCost(def, owned + i, costMult);
  return total;
}

function getMaxAffordable(def: UpgradeDef, owned: number, budget: number, costMult: number): number {
  let count = 0;
  let total = 0;
  while (true) {
    const next = getCost(def, owned + count, costMult);
    if (total + next > budget) break;
    total += next;
    count++;
  }
  return count;
}

const buyAmounts: BuyAmount[] = [1, 10, 'max'];

let particleId = 0;

type Tab = 'upgrades' | 'achievements' | 'prestige' | 'fields' | 'pets';

export default function CornClicker() {
  const [rawState, setState] = useLocalStorage<GameState>('corn-clicker', defaultState);
  const raw = rawState ?? {};
  const state: GameState = {
    ...defaultState,
    ...raw,
    achievements: raw.achievements ?? defaultState.achievements,
    fields: raw.fields ?? defaultState.fields,
    pets: raw.pets ?? defaultState.pets,
    lifetimeSeeds: raw.lifetimeSeeds ?? (raw.goldenSeeds ?? 0),
  };
  const [buyAmount, setBuyAmount] = useState<BuyAmount>(1);
  const [tab, setTab] = useState<Tab>('upgrades');
  const [particles, setParticles] = useState<Particle[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [gameSpeed, setGameSpeed] = useState(1);
  const [modal, setModal] = useState<{ title: string; body: string; danger?: boolean; onConfirm: () => void } | null>(null);
  const [petParticles, setPetParticles] = useState<Particle[]>([]);
  const [crate, setCrate] = useState<{ pet: PetDef; level: number; isNew: boolean; phase: 'wiggle' | 'reveal' } | null>(null);
  const [debugOpenState, setDebugOpenState] = useState(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const firstRender = useRef(true);

  const costMult = moonCostReduction[state.fields['moon'] ?? 0] ?? 1;
  const groveLevel = state.fields['grove'] ?? 0;
  const acreLevel = state.fields['acre'] ?? 0;
  const acreBonus = 1 + (acreMultipliers[acreLevel] ?? 0);

  const getClickPower = useCallback((s: GameState) => {
    const vLevel = s.fields?.['valley'] ?? 0;
    const petBonus = getPetBonuses(s.pets ?? {});
    let power = 1;
    for (const u of upgrades) {
      if (u.perClick) power += u.perClick * (s.upgrades[u.id] ?? 0);
    }
    return Math.floor(power * (valleyClickMult[vLevel] ?? 1) * petBonus.clickMult);
  }, []);

  const getPerSecond = useCallback((s: GameState) => {
    const mLevel = s.fields?.['meadow'] ?? 0;
    const petBonus = getPetBonuses(s.pets ?? {});
    let base = meadowPerSec[mLevel] ?? 0;
    let multiplier = 1;
    for (const u of upgrades) {
      const owned = s.upgrades[u.id] ?? 0;
      if (u.perSecond) base += u.perSecond * owned;
      if (u.multiplier) multiplier *= u.multiplier ** owned;
    }
    return Math.floor(base * multiplier * petBonus.idleMult);
  }, []);

  const showToast = useCallback((msg: string) => {
    clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  // Offline / background progress
  const processOffline = useCallback(() => {
    const s = stateRef.current;
    const last = s.lastTick;
    if (last <= 0) {
      setState(prev => ({ ...prev, lastTick: Date.now() }));
      return;
    }
    const elapsed = Math.min(Math.floor((Date.now() - last) / 1000), MAX_OFFLINE_SECONDS);
    if (elapsed < 5) {
      setState(prev => ({ ...prev, lastTick: Date.now() }));
      return;
    }
    const ps = getPerSecond(s);
    const gLevel = s.fields?.['grove'] ?? 0;
    const autoClicks = groveAutoClicks[gLevel] ?? 0;
    const clickPwr = autoClicks > 0 ? getClickPower(s) * autoClicks : 0;
    const perSec = ps + clickPwr;
    const earned = perSec * elapsed;
    if (earned > 0) {
      setState(prev => ({
        ...prev,
        corn: prev.corn + earned,
        totalCorn: prev.totalCorn + earned,
        totalClicks: prev.totalClicks + autoClicks * elapsed,
        lastTick: Date.now(),
      }));
      const mins = Math.floor(elapsed / 60);
      const timeStr = mins >= 60
        ? `${Math.floor(mins / 60)}h ${mins % 60}m`
        : mins > 0 ? `${mins}m` : `${elapsed}s`;
      showToast(`🌙 Welcome back! Earned ${formatSilver(earned)} corn while away (${timeStr})`);
    } else {
      setState(prev => ({ ...prev, lastTick: Date.now() }));
    }
  }, [setState, getPerSecond, getClickPower, showToast]);

  const offlineProcessed = useRef(false);
  useEffect(() => {
    if (offlineProcessed.current) return;
    offlineProcessed.current = true;
    processOffline();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') processOffline();
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [processOffline]);

  // Check achievements
  useEffect(() => {
    if (debugOpenState) return;
    const newlyEarned = achievements.filter(
      a => !state.achievements.includes(a.id) && a.check(state),
    );
    if (newlyEarned.length === 0) return;
    setState(prev => ({
      ...prev,
      achievements: [...(prev.achievements ?? []), ...newlyEarned.map(a => a.id)],
    }));
    if (!firstRender.current) {
      const first = newlyEarned[0];
      if (first) showToast(`${first.emoji} Achievement unlocked: ${first.name}!`);
    }
    firstRender.current = false;
  }, [state.totalCorn, state.totalClicks, state.upgrades, state.achievements, state.fields, state.totalPrestiges, state.goldenSeeds, state.lifetimeSeeds, state.pets, setState, showToast, debugOpenState]);

  // Auto-harvest tick
  useEffect(() => {
    const id = setInterval(() => {
      const s = stateRef.current;
      const ps = getPerSecond(s) * gameSpeed;
      const gLevel = s.fields?.['grove'] ?? 0;
      const autoClicks = (groveAutoClicks[gLevel] ?? 0) * gameSpeed;
      const clickPwr = autoClicks > 0 ? getClickPower(s) * autoClicks : 0;
      const total = ps + clickPwr;
      if (total > 0) {
        setState(prev => ({
          ...prev,
          corn: prev.corn + total,
          totalCorn: prev.totalCorn + total,
          totalClicks: prev.totalClicks + autoClicks,
          lastTick: Date.now(),
        }));
      } else {
        setState(prev => ({ ...prev, lastTick: Date.now() }));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [setState, getPerSecond, getClickPower, gameSpeed]);

  const handleClick = () => {
    const power = getClickPower(state);
    setState(prev => ({
      ...prev,
      corn: prev.corn + power,
      totalCorn: prev.totalCorn + power,
      totalClicks: prev.totalClicks + 1,
    }));

    const id = ++particleId;
    const x = 50 + (Math.random() - 0.5) * 30; // % from left
    setParticles(prev => [...prev.slice(-4), { id, x, text: `+${formatSilver(power)}` }]);
    setTimeout(() => setParticles(prev => prev.filter(p => p.id !== id)), 800);
  };

  const handleBuy = (def: UpgradeDef) => {
    const owned = state.upgrades[def.id] ?? 0;
    const count = buyAmount === 'max'
      ? getMaxAffordable(def, owned, state.corn, costMult)
      : Math.min(buyAmount, getMaxAffordable(def, owned, state.corn, costMult));
    if (count <= 0) return;
    const cost = getBulkCost(def, owned, count, costMult);
    setState(prev => ({
      ...prev,
      corn: prev.corn - cost,
      upgrades: { ...prev.upgrades, [def.id]: (prev.upgrades[def.id] ?? 0) + count },
    }));
  };

  const handlePrestige = () => {
    const petBonus = getPetBonuses(state.pets ?? {});
    const seedsToEarn = Math.floor(calcGoldenSeeds(state.totalCorn, acreLevel) * petBonus.seedMult);
    if (seedsToEarn <= 0) return;
    setModal({
      title: `🌟 Prestige for ${seedsToEarn} Golden Seed${seedsToEarn === 1 ? '' : 's'}?`,
      body: `Your corn and upgrades will be reset, but you'll earn ${seedsToEarn} Golden Seed${seedsToEarn === 1 ? '' : 's'} and a pet crate! Achievements, fields, and pets are kept.`,
      onConfirm: () => {
        setState(prev => ({
          ...defaultState,
          achievements: prev.achievements ?? [],
          goldenSeeds: (prev.goldenSeeds ?? 0) + seedsToEarn,
          lifetimeSeeds: (prev.lifetimeSeeds ?? 0) + seedsToEarn,
          totalPrestiges: (prev.totalPrestiges ?? 0) + 1,
          fields: prev.fields ?? {},
          pets: prev.pets ?? {},
          crates: (prev.crates ?? 0) + 1,
          lastTick: Date.now(),
        }));
        firstRender.current = true;
        showToast(`🌟 +${seedsToEarn} Golden Seeds! 📦 +1 Pet Crate!`);
        setModal(null);
      },
    });
  };

  const handleOpenCrate = () => {
    if ((state.crates ?? 0) <= 0) return;
    const newPet = rollPet();
    const currentPetLevel = state.pets?.[newPet.id] ?? 0;
    setState(prev => ({
      ...prev,
      crates: (prev.crates ?? 0) - 1,
    }));
    setCrate({ pet: newPet, level: currentPetLevel + 1, isNew: currentPetLevel === 0, phase: 'wiggle' });
    setTimeout(() => setCrate(prev => prev ? { ...prev, phase: 'reveal' } : null), 1000);
  };

  const dismissCrate = () => {
    if (crate) {
      setState(prev => ({
        ...prev,
        pets: { ...(prev.pets ?? {}), [crate.pet.id]: (prev.pets?.[crate.pet.id] ?? 0) + 1 },
      }));
    }
    setCrate(null);
  };

  const handleFieldUpgrade = (field: FieldDef) => {
    const level = state.fields[field.id] ?? 0;
    if (level >= FIELD_MAX) return;
    const cost = field.costs[level];
    if (cost === undefined || state.goldenSeeds < cost) return;
    setState(prev => ({
      ...prev,
      goldenSeeds: (prev.goldenSeeds ?? 0) - cost,
      fields: { ...(prev.fields ?? {}), [field.id]: (prev.fields?.[field.id] ?? 0) + 1 },
    }));
  };

  const clickPower = getClickPower(state);
  const perSecond = getPerSecond(state);
  const autoClicksPerSec = groveAutoClicks[groveLevel] ?? 0;
  const earnedCount = state.achievements.length;
  const spendableSeeds = state.goldenSeeds ?? 0;
  const petBonuses = getPetBonuses(state.pets ?? {});
  const seedsOnPrestige = Math.floor(calcGoldenSeeds(state.totalCorn, acreLevel) * petBonuses.seedMult);
  const hasCrates = (state.crates ?? 0) > 0;
  const hasAnyPet = Object.values(state.pets).some(l => l > 0) || hasCrates;
  const allFieldsMaxed = fieldDefs.every(f => (state.fields[f.id] ?? 0) >= FIELD_MAX);
  const allPetsCollected = petDefs.every(p => (state.pets[p.id] ?? 0) > 0);
  const isCompleted = state.completed === true;

  const [showCompletion, setShowCompletion] = useState(false);

  const handleComplete = () => {
    if (!allFieldsMaxed || !allPetsCollected || spendableSeeds < CORNUCOPIA_COST || isCompleted) return;
    setState(prev => ({
      ...prev,
      goldenSeeds: (prev.goldenSeeds ?? 0) - CORNUCOPIA_COST,
      completed: true,
    }));
    setShowCompletion(true);
  };

  return (
    <div className={styles.page}>
      <div className={styles.title}>Corn Clicker</div>

      {location.hostname === 'localhost' && (() => {
        const [debugOpen, setDebugOpen] = [debugOpenState, setDebugOpenState];
        return (
          <div className={styles.debugPanel}>
            <button className={styles.debugToggle} onClick={() => setDebugOpen(!debugOpen)}>
              {debugOpen ? '▼' : '▶'} Debug
            </button>
            {debugOpen && (
              <div className={styles.debugContent}>
                <div className={styles.debugRow}>
                  <label>Speed: {gameSpeed}x</label>
                  <input type="range" min={1} max={100} value={gameSpeed} onChange={e => setGameSpeed(Number(e.target.value))} className={styles.debugSlider} />
                </div>
                <div className={styles.debugRow}>
                  <label>Corn</label>
                  <input type="number" value={Math.floor(state.corn)} onChange={e => setState(prev => ({ ...prev, corn: Number(e.target.value), totalCorn: Math.max(prev.totalCorn, Number(e.target.value)) }))} className={styles.debugInput} />
                </div>
                <div className={styles.debugRow}>
                  <label>Total Corn</label>
                  <input type="number" value={Math.floor(state.totalCorn)} onChange={e => setState(prev => ({ ...prev, totalCorn: Number(e.target.value) }))} className={styles.debugInput} />
                </div>
                <div className={styles.debugRow}>
                  <label>Golden Seeds</label>
                  <input type="number" value={state.goldenSeeds} onChange={e => setState(prev => ({ ...prev, goldenSeeds: Number(e.target.value) }))} className={styles.debugInput} />
                </div>
                <div className={styles.debugRow}>
                  <label>Lifetime Seeds</label>
                  <input type="number" value={state.lifetimeSeeds} onChange={e => setState(prev => ({ ...prev, lifetimeSeeds: Number(e.target.value) }))} className={styles.debugInput} />
                </div>
                <div className={styles.debugRow}>
                  <label>Prestiges</label>
                  <input type="number" value={state.totalPrestiges} onChange={e => setState(prev => ({ ...prev, totalPrestiges: Number(e.target.value) }))} className={styles.debugInput} />
                </div>
                <div className={styles.debugRow}>
                  <label>Crates</label>
                  <input type="number" value={state.crates} onChange={e => setState(prev => ({ ...prev, crates: Number(e.target.value) }))} className={styles.debugInput} />
                </div>
                <div className={styles.debugRow}>
                  <label>Clicks</label>
                  <input type="number" value={state.totalClicks} onChange={e => setState(prev => ({ ...prev, totalClicks: Number(e.target.value) }))} className={styles.debugInput} />
                </div>
                <div className={styles.debugDivider} />
                <div className={styles.debugSubtitle}>Fields</div>
                {fieldDefs.map(f => (
                  <div key={f.id} className={styles.debugRow}>
                    <label>{f.name}</label>
                    <input type="number" min={0} max={FIELD_MAX} value={state.fields[f.id] ?? 0} onChange={e => setState(prev => ({ ...prev, fields: { ...prev.fields, [f.id]: Math.min(FIELD_MAX, Math.max(0, Number(e.target.value))) } }))} className={styles.debugInput} />
                  </div>
                ))}
                <div className={styles.debugDivider} />
                <div className={styles.debugSubtitle}>Upgrades</div>
                {upgrades.map(u => (
                  <div key={u.id} className={styles.debugRow}>
                    <label>{u.name}</label>
                    <input type="number" min={0} value={state.upgrades[u.id] ?? 0} onChange={e => setState(prev => ({ ...prev, upgrades: { ...prev.upgrades, [u.id]: Math.max(0, Number(e.target.value)) } }))} className={styles.debugInput} />
                  </div>
                ))}
                <div className={styles.debugDivider} />
                <div className={styles.debugSubtitle}>Pets</div>
                {petDefs.map(p => (
                  <div key={p.id} className={styles.debugRow}>
                    <label>{p.emoji} {p.name}</label>
                    <input type="number" min={0} value={state.pets[p.id] ?? 0} onChange={e => setState(prev => ({ ...prev, pets: { ...prev.pets, [p.id]: Math.max(0, Number(e.target.value)) } }))} className={styles.debugInput} />
                  </div>
                ))}
                <div className={styles.debugDivider} />
                <div className={styles.debugSubtitle}>Achievements</div>
                {achievements.map(a => (
                  <div key={a.id} className={styles.debugRow}>
                    <label>{a.emoji} {a.name}</label>
                    <input type="checkbox" checked={state.achievements.includes(a.id)} onChange={e => setState(prev => ({
                      ...prev,
                      achievements: e.target.checked
                        ? [...(prev.achievements ?? []), a.id]
                        : (prev.achievements ?? []).filter(id => id !== a.id),
                    }))} />
                  </div>
                ))}
                <div className={styles.debugDivider} />
                <div className={styles.debugRow}>
                  <label>Completed</label>
                  <input type="checkbox" checked={state.completed} onChange={e => setState(prev => ({ ...prev, completed: e.target.checked }))} />
                </div>
              </div>
            )}
          </div>
        );
      })()}

      <Card>
        <div className={styles.cornArea}>
          <div className={styles.particleContainer}>
            {particles.map(p => (
              <span key={p.id} className={styles.particle} style={{ left: `${p.x}%` }}>
                {p.text}
              </span>
            ))}
          </div>
          <button className={`${styles.cornButton} ${isCompleted ? styles.cornCompleted : ''}`} onClick={handleClick} aria-label="Harvest corn">
            🌽
          </button>
          <div className={styles.counter}>{formatSilver(Math.floor(state.corn))} corn</div>
          <div className={styles.perSecond}>
            {formatSilver(clickPower)}/click · {formatSilver(perSecond)}/sec
            {autoClicksPerSec > 0 && ` · ${autoClicksPerSec} auto-clicks/sec`}
          </div>
        </div>
      </Card>

      <Card>
        <div className={styles.tabBar}>
          <button
            className={`${styles.tabBtn} ${tab === 'upgrades' ? styles.tabActive : ''}`}
            onClick={() => setTab('upgrades')}
          >
            <span className={styles.tabEmoji}>⬆️</span>
            <span className={styles.tabLabel}>Upgrades</span>
          </button>
          <button
            className={`${styles.tabBtn} ${tab === 'prestige' ? styles.tabActive : ''}`}
            onClick={() => setTab('prestige')}
          >
            <span className={styles.tabEmoji}>🌟</span>
            <span className={styles.tabLabel}>{spendableSeeds > 0 ? spendableSeeds : 'Prestige'}</span>
          </button>
          <button
            className={`${styles.tabBtn} ${tab === 'fields' ? styles.tabActive : ''}`}
            onClick={() => setTab('fields')}
          >
            <span className={styles.tabEmoji}>🌾</span>
            <span className={styles.tabLabel}>Fields</span>
          </button>
          {hasAnyPet && (
            <button
              className={`${styles.tabBtn} ${tab === 'pets' ? styles.tabActive : ''}`}
              onClick={() => setTab('pets')}
            >
              <span className={styles.tabEmoji}>🐾</span>
              <span className={styles.tabLabel}>{hasCrates ? `📦${state.crates}` : 'Pets'}</span>
            </button>
          )}
          <button
            className={`${styles.tabBtn} ${tab === 'achievements' ? styles.tabActive : ''}`}
            onClick={() => setTab('achievements')}
          >
            <span className={styles.tabEmoji}>🏆</span>
            <span className={styles.tabLabel}>{earnedCount}/{achievements.length}</span>
          </button>
        </div>

        <div className={styles.tabContent}>
        {tab === 'upgrades' && (
          <>
            <div className={styles.buyAmountBar}>
              {buyAmounts.map(amt => (
                <button
                  key={amt}
                  className={`${styles.buyAmountBtn} ${buyAmount === amt ? styles.buyAmountActive : ''}`}
                  onClick={() => setBuyAmount(amt)}
                >
                  {amt === 'max' ? 'Max' : `x${amt}`}
                </button>
              ))}
            </div>
            <div className={styles.upgradeList}>
              {upgrades.map((def, i) => {
                const prev = i > 0 ? upgrades[i - 1] : undefined;
                const prevOwned = prev ? (state.upgrades[prev.id] ?? 0) : 1;
                if (prevOwned === 0) return null;
                const owned = state.upgrades[def.id] ?? 0;
                const count = buyAmount === 'max'
                  ? getMaxAffordable(def, owned, state.corn, costMult)
                  : buyAmount;
                const cost = getBulkCost(def, owned, count, costMult);
                const canAfford = count > 0 && state.corn >= cost;
                const nextCost = getCost(def, owned, costMult);
                const fillPct = canAfford ? 100 : Math.min(100, Math.floor((state.corn / nextCost) * 100));
                return (
                  <div key={def.id} className={styles.upgradeRow}>
                    <div className={styles.upgradeInfo}>
                      <span className={styles.upgradeName}>{def.name}</span>
                      <span className={styles.upgradeDesc}>{def.desc}</span>
                      <span className={styles.upgradeOwned}>
                        Owned: {owned}
                        {owned > 0 && def.perClick && ` · +${formatSilver(def.perClick * owned)}/click`}
                        {owned > 0 && def.perSecond && ` · +${formatSilver(def.perSecond * owned)}/sec`}
                        {owned > 0 && def.multiplier && ` · ${formatSilver(def.multiplier ** owned)}x`}
                      </span>
                    </div>
                    <button
                      className={styles.buyButton}
                      disabled={!canAfford}
                      onClick={() => handleBuy(def)}
                      style={!canAfford ? {
                        background: `linear-gradient(to right, var(--color-green) ${fillPct}%, transparent ${fillPct}%) bottom / 100% 3px no-repeat, var(--color-border)`,
                      } : undefined}
                    >
                      {buyAmount === 'max'
                        ? count > 0 ? `${formatSilver(cost)} (x${count})` : `${formatSilver(getCost(def, owned, costMult))} (x1)`
                        : count > 1 ? `${formatSilver(cost)} (x${count})` : `${formatSilver(getBulkCost(def, owned, buyAmount, costMult))}`
                      }
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {tab === 'achievements' && (
          <div className={styles.achievementList}>
            {achievements.map(a => {
              const earned = state.achievements.includes(a.id);
              const visible = earned || !a.visible || a.visible(state);
              const prog = !earned && visible && a.progress ? a.progress(state) : null;
              const pct = prog ? Math.min(100, Math.floor((prog.current / prog.target) * 100)) : 0;
              return (
                <div
                  key={a.id}
                  className={`${styles.achievementRow} ${earned ? styles.achievementDone : styles.achievementLocked}`}
                >
                  <span className={styles.achievementEmoji}>{earned ? a.emoji : '🔒'}</span>
                  <div className={styles.achievementText}>
                    <span className={styles.achievementName}>{visible ? a.name : '???'}</span>
                    <span className={styles.achievementDesc}>{visible ? a.desc : '???'}</span>
                    {prog && (
                      <div className={styles.achievementProgress}>
                        <div className={styles.progressBar}>
                          <div className={styles.progressFill} style={{ width: `${pct}%` }} />
                        </div>
                        <span className={styles.progressText}>
                          {formatSilver(Math.floor(prog.current))}/{formatSilver(prog.target)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'prestige' && (
          <div className={styles.prestigePanel}>
            <div className={styles.prestigeNote}>
              Prestiging resets your corn and upgrades, but earns you Golden Seeds. Spend seeds in the Fields tab on permanent bonuses. You'll also receive a pet crate each time!
            </div>
            <div className={styles.prestigeDivider} />
            <div className={styles.prestigeInfo}>
              <div className={styles.prestigeStat}>
                <span className={styles.prestigeLabel}>Golden Seeds</span>
                <span className={styles.prestigeValue}>🌟 {spendableSeeds}</span>
              </div>
              <div className={styles.prestigeStat}>
                <span className={styles.prestigeLabel}>Total corn this run</span>
                <span className={styles.prestigeValue}>{formatSilver(Math.floor(state.totalCorn))}</span>
              </div>
            </div>
            <div className={styles.prestigeDivider} />
            <div className={styles.prestigeInfo}>
              <div className={styles.prestigeStat}>
                <span className={styles.prestigeLabel}>Seeds on prestige</span>
                <span className={styles.prestigeValue}>
                  +{seedsOnPrestige}
                  {' '}
                  {(() => {
                    const nextBase = calcBaseSeeds(state.totalCorn) + 1;
                    const nextCorn = nextBase ** 2 * 100_000;
                    const nextSeeds = Math.floor(nextBase * acreBonus * petBonuses.seedMult);
                    const gain = nextSeeds - seedsOnPrestige;
                    return (
                      <span className={styles.prestigeLabel}>
                        (next +{gain} at {formatSilver(nextCorn)} corn)
                      </span>
                    );
                  })()}
                </span>
              </div>
            </div>
            <button
              className={styles.prestigeButton}
              disabled={seedsOnPrestige <= 0}
              onClick={handlePrestige}
            >
              {seedsOnPrestige > 0
                ? `Prestige for ${seedsOnPrestige} Golden Seed${seedsOnPrestige === 1 ? '' : 's'}`
                : `Earn ${formatSilver(100_000)} corn to prestige`
              }
            </button>
            <div className={styles.prestigeNote}>
              Resets corn and upgrades. Keeps achievements, seeds, fields, and pets.
            </div>
          </div>
        )}

        {tab === 'fields' && (
          <div className={styles.fieldList}>
            <div className={styles.fieldSeedCount}>🌟 {spendableSeeds} Golden Seeds available</div>
            {fieldDefs.map(field => {
              const level = state.fields[field.id] ?? 0;
              const maxed = level >= FIELD_MAX;
              const cost = maxed ? 0 : (field.costs[level] ?? 0);
              const canAfford = !maxed && spendableSeeds >= cost;
              return (
                <div key={field.id} className={styles.fieldRow}>
                  <div className={styles.fieldInfo}>
                    <span className={styles.fieldName}>{field.emoji} {field.name}</span>
                    <span className={styles.fieldDesc}>{field.desc(level)}</span>
                    <div className={styles.fieldPips}>
                      {Array.from({ length: FIELD_MAX }, (_, i) => i + 1).map(i => (
                        <span
                          key={i}
                          className={`${styles.fieldPip} ${i <= level ? styles.fieldPipFilled : ''}`}
                        />
                      ))}
                    </div>
                  </div>
                  <button
                    className={styles.fieldBuyBtn}
                    disabled={!canAfford}
                    onClick={() => handleFieldUpgrade(field)}
                  >
                    {maxed ? 'MAX' : `🌟 ${cost}`}
                  </button>
                </div>
              );
            })}
            <div className={styles.cornucopiaSection}>
              <div className={styles.cornucopiaDivider} />
              {isCompleted ? (
                <button className={styles.cornucopiaBtn} onClick={() => setShowCompletion(true)}>
                  <span className={styles.cornucopiaEmoji}>🌽</span>
                  <span className={styles.cornucopiaTitle}>Golden Cornucopia</span>
                  <span className={styles.cornucopiaDesc}>Complete! Tap to view.</span>
                </button>
              ) : !allFieldsMaxed ? (
                <button className={styles.cornucopiaBtn} disabled>
                  <span className={styles.cornucopiaEmoji}>❓</span>
                  <span className={styles.cornucopiaTitle}>???</span>
                  <span className={styles.cornucopiaDesc}>🌟 {formatSilver(CORNUCOPIA_COST)}</span>
                </button>
              ) : (
                <button
                  className={styles.cornucopiaBtn}
                  disabled={spendableSeeds < CORNUCOPIA_COST || !allPetsCollected}
                  onClick={handleComplete}
                >
                  <span className={styles.cornucopiaEmoji}>🌽</span>
                  <span className={styles.cornucopiaTitle}>Golden Cornucopia</span>
                  <span className={styles.cornucopiaDesc}>
                    {!allPetsCollected
                      ? `Collect all pets · 🌟 ${formatSilver(CORNUCOPIA_COST)}`
                      : `The ultimate harvest · 🌟 ${formatSilver(CORNUCOPIA_COST)}`
                    }
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {tab === 'pets' && (
          <div className={styles.petList}>
            <div className={styles.prestigeNote}>
              Prestige to earn pet crates. Tap a crate to open it! Duplicates level up, making their bonus stronger. Rarer pets give bigger boosts.
            </div>
            {hasCrates && (
              <button className={styles.crateHero} onClick={handleOpenCrate}>
                <span className={styles.crateHeroEmoji}>📦</span>
                <span className={styles.crateHeroCount}>{state.crates} crate{state.crates !== 1 ? 's' : ''}</span>
                <span className={styles.crateHeroAction}>Tap to open!</span>
              </button>
            )}
            <div className={styles.petListInner}>
              <div className={styles.particleContainer}>
                {petParticles.map(p => (
                  <span key={p.id} className={styles.particle} style={{ left: p.x, top: p.y ?? 0 }}>
                    {p.text}
                  </span>
                ))}
              </div>
              {petDefs.map(pet => {
                const level = state.pets[pet.id] ?? 0;
                if (level === 0) return (
                  <div key={pet.id} className={styles.petRow}>
                    <span className={styles.petEmoji}>❓</span>
                    <div className={styles.petInfo}>
                      <span className={styles.petName} style={{ color: '#aaa' }}>???</span>
                      <span className={styles.petDesc}>???</span>
                    </div>
                  </div>
                );
                return (
                  <div
                    key={pet.id}
                    className={`${styles.petRow} ${styles.petRowTappable}`}
                    onClick={(e) => {
                      const emoji = e.currentTarget.querySelector(`.${styles.petEmoji}`);
                      const container = e.currentTarget.parentElement;
                      if (!emoji || !container) return;
                      const cRect = container.getBoundingClientRect();
                      const eRect = emoji.getBoundingClientRect();
                      const x = eRect.left - cRect.left + eRect.width / 2;
                      const y = eRect.top - cRect.top;
                      const id = ++particleId;
                      setPetParticles(prev => [...prev.slice(-2), { id, x, y, text: pet.noise }]);
                      setTimeout(() => setPetParticles(prev => prev.filter(p => p.id !== id)), 800);
                    }}
                  >
                    <span className={styles.petEmoji}>{pet.emoji}</span>
                    <div className={styles.petInfo}>
                      <span className={styles.petName}>
                        {pet.name}
                        <span className={styles.petRarity} style={{ color: rarityColors[pet.rarity] }}>
                          {' '}{pet.rarity}
                        </span>
                      </span>
                      <span className={styles.petDesc}>Lvl {level} · {pet.bonusDesc}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </div>
      </Card>

      <button
        className={styles.resetButton}
        onClick={() => {
          setModal({
            title: 'Reset all progress?',
            body: 'This will permanently delete all your corn, upgrades, achievements, seeds, fields, and pets. This cannot be undone.',
            danger: true,
            onConfirm: () => {
              setState(defaultState);
              firstRender.current = true;
              setModal(null);
            },
          });
        }}
      >
        Reset all progress
      </button>

      {toast && <div className={styles.toast}>{toast}</div>}

      {modal && (
        <div className={styles.modalOverlay} onClick={() => setModal(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalTitle}>{modal.title}</div>
            <div className={styles.modalBody}>{modal.body}</div>
            <div className={styles.modalActions}>
              <button className={styles.modalCancel} onClick={() => setModal(null)}>Cancel</button>
              <button
                className={modal.danger ? styles.modalConfirmDanger : styles.modalConfirm}
                onClick={modal.onConfirm}
              >
                {modal.danger ? 'Reset' : 'Prestige'}
              </button>
            </div>
          </div>
        </div>
      )}

      {crate && (
        <div className={styles.modalOverlay} onClick={crate.phase === 'reveal' ? dismissCrate : undefined}>
          <div className={styles.crateBox} onClick={e => e.stopPropagation()}>
            {crate.phase === 'wiggle' && (
              <div className={styles.crateWiggle}>📦</div>
            )}
            {crate.phase === 'reveal' && (() => {
              const p = crate.pet;
              const lvl = crate.level;
              const prevLvl = lvl - 1;
              const bonusParts: string[] = [];
              if (p.clickMult > 0) bonusParts.push(`+${Math.round(p.clickMult * 100)}% click`);
              if (p.idleMult > 0) bonusParts.push(`+${Math.round(p.idleMult * 100)}% idle`);
              if (p.seedMult > 0) bonusParts.push(`+${Math.round(p.seedMult * 100)}% seeds`);
              const bonusPerLevel = bonusParts.join(', ');
              return (
              <div className={styles.crateReveal} onClick={dismissCrate}>
                <div
                  className={styles.crateGlow}
                  style={{ boxShadow: `0 0 40px 15px ${rarityColors[p.rarity]}` }}
                />
                <div className={styles.cratePetEmoji}>{p.emoji}</div>
                <div className={styles.cratePetName}>{p.name}</div>
                <div className={styles.cratePetRarity} style={{ color: rarityColors[p.rarity] }}>
                  {p.rarity}
                </div>
                {crate.isNew ? (
                  <div className={styles.crateDetail}>
                    <div className={styles.crateNew}>NEW</div>
                    <div className={styles.crateBonusDesc}>{bonusPerLevel} per level</div>
                  </div>
                ) : (
                  <div className={styles.crateDetail}>
                    <div className={styles.crateLevelUp}>Level {prevLvl} → {lvl}</div>
                    <div className={styles.crateBonusDesc}>
                      {bonusParts.map((part, i) => {
                        const mult = [p.clickMult, p.idleMult, p.seedMult].filter(m => m > 0)[i] ?? 0;
                        const label = part.split(' ').slice(1).join(' ');
                        return <div key={i}>+{Math.round(mult * prevLvl * 100)}% → +{Math.round(mult * lvl * 100)}% {label}</div>;
                      })}
                    </div>
                  </div>
                )}
                <div className={styles.crateDismiss}>Tap to continue</div>
              </div>
              );
            })()}
          </div>
        </div>
      )}

      {showCompletion && (
        <div className={styles.modalOverlay} onClick={() => setShowCompletion(false)}>
          <div className={styles.completionModal} onClick={e => e.stopPropagation()}>
            <div className={styles.completionEmoji}>🌽</div>
            <div className={styles.completionTitle}>You've mastered corn!</div>
            <div className={styles.completionSubtitle}>Golden Cornucopia complete</div>
            <div className={styles.completionStats}>
              <div className={styles.completionStat}>
                <span className={styles.completionStatValue}>{formatSilver(Math.floor(state.totalCorn))}</span>
                <span className={styles.completionStatLabel}>total corn</span>
              </div>
              <div className={styles.completionStat}>
                <span className={styles.completionStatValue}>{formatSilver(state.totalClicks)}</span>
                <span className={styles.completionStatLabel}>clicks</span>
              </div>
              <div className={styles.completionStat}>
                <span className={styles.completionStatValue}>{state.totalPrestiges}</span>
                <span className={styles.completionStatLabel}>prestiges</span>
              </div>
              <div className={styles.completionStat}>
                <span className={styles.completionStatValue}>{petDefs.filter(p => (state.pets[p.id] ?? 0) > 0).length}/{petDefs.length}</span>
                <span className={styles.completionStatLabel}>pets found</span>
              </div>
              <div className={styles.completionStat}>
                <span className={styles.completionStatValue}>{state.achievements.length}/{achievements.length}</span>
                <span className={styles.completionStatLabel}>achievements</span>
              </div>
            </div>
            <button className={styles.completionClose} onClick={() => setShowCompletion(false)}>
              Continue farming
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
