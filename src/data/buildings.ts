export interface LinkedProduct {
  name: string;
  image?: string;
  ratio: number; // output per 1 level of the parent product
  ratioLabel?: string; // display label for non-integer ratios (e.g. "1/3")
}

export interface Product {
  id: string;
  name: string;
  image?: string;
  linkedProducts?: LinkedProduct[];
  cyclePer: string;
  initialCost: number;
  costIncrement: number;
}

export interface Building {
  name: string;
  products: Product[];
}

export const buildings: Building[] = [
  {
    name: 'Sawmill',
    products: [
      { id: 'sawmill-wood', name: 'Wood', image: 'wood.png', cyclePer: 'hour', initialCost: 1_000, costIncrement: 1_000 },
      { id: 'sawmill-board', name: 'Board', image: 'board.png', cyclePer: 'hour', initialCost: 1_500, costIncrement: 1_500 },
      { id: 'sawmill-oak', name: 'Oak', image: 'oak.png', cyclePer: 'hour', initialCost: 1_500_000, costIncrement: 1_500_000 },
    ],
  },
  {
    name: 'Ironworks',
    products: [
      { id: 'ironworks-iron', name: 'Iron', image: 'iron.png', linkedProducts: [{ name: 'Nails', image: 'nails.png', ratio: 3 }], cyclePer: '3 min', initialCost: 20_000, costIncrement: 10_000 },
    ],
  },
  {
    name: 'Steelworks',
    products: [
      { id: 'steelworks-steel', name: 'Steel', image: 'steel.png', linkedProducts: [{ name: 'Steel Wire', image: 'steel-wire.png', ratio: 1 / 3, ratioLabel: '1/3' }], cyclePer: 'hour', initialCost: 600_000, costIncrement: 300_000 },
    ],
  },
  {
    name: 'Quarry',
    products: [
      { id: 'quarry-stone', name: 'Stone', image: 'stone.png', linkedProducts: [{ name: 'Sandstone', image: 'sandstone.png', ratio: 1 }], cyclePer: '10 min', initialCost: 30_000, costIncrement: 15_000 },
    ],
  },
  {
    name: 'Hay Field',
    products: [
      { id: 'hayfield-straw', name: 'Straw', image: 'straw.png', cyclePer: '10 min', initialCost: 20_000, costIncrement: 10_000 },
    ],
  },
  {
    name: 'Worm Habitat',
    products: [
      { id: 'wormhabitat-worms', name: 'Worms', image: 'worms.png', cyclePer: 'hour', initialCost: 250, costIncrement: 250 },
      { id: 'wormhabitat-gummyworms', name: 'Gummy Worms', image: 'gummy-worms.png', cyclePer: 'hour', initialCost: 25_000, costIncrement: 25_000 },
      { id: 'wormhabitat-mealworms', name: 'Mealworms', image: 'mealworms.png', cyclePer: 'hour', initialCost: 10_000, costIncrement: 10_000 },
    ],
  },
  {
    name: 'Trout Farm',
    products: [
      { id: 'troutfarm-trout', name: 'Trout', image: 'trout.png', cyclePer: 'day', initialCost: 150, costIncrement: 150 },
      { id: 'troutfarm-grubs', name: 'Grubs', image: 'grubs.png', cyclePer: 'hour', initialCost: 1_000, costIncrement: 1_000 },
      { id: 'troutfarm-minnows', name: 'Minnows', image: 'minnows.png', cyclePer: 'hour', initialCost: 5_000, costIncrement: 5_000 },
    ],
  },
  {
    name: 'Orchard',
    products: [
      { id: 'orchard-appletrees', name: 'Apple Trees', image: 'apple.png', cyclePer: 'day', initialCost: 2_000, costIncrement: 1_000 },
      { id: 'orchard-orangetrees', name: 'Orange Trees', image: 'orange.png', cyclePer: 'day', initialCost: 2_000, costIncrement: 1_000 },
      { id: 'orchard-lemontrees', name: 'Lemon Trees', image: 'lemon.png', cyclePer: 'day', initialCost: 2_000, costIncrement: 1_000 },
    ],
  },
  {
    name: 'Vineyard',
    products: [
      { id: 'vineyard-grapevines', name: 'Grapevines', image: 'grapes.png', cyclePer: 'day', initialCost: 2_000, costIncrement: 2_000 },
    ],
  },
];
