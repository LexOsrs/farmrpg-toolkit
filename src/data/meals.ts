export interface Ingredient {
  name: string;
  qty: number;
}

export interface Meal {
  name: string;
  time: number;
  level: number;
  collectXP: number;
  seasonal: false | string;
  ingredients: Ingredient[];
}

export const meals: Meal[] = [
  { name: "Bone Broth", time: 600, level: 1, collectXP: 100, seasonal: false, ingredients: [
    { name: "Bone", qty: 10 }, { name: "Coal", qty: 5 }, { name: "Cooking Pot", qty: 1 }
  ] },
  { name: "Onion Soup", time: 3600, level: 5, collectXP: 300, seasonal: false, ingredients: [
    { name: "Coal", qty: 60 }, { name: "Onion", qty: 50 }, { name: "Cooking Pot", qty: 1 }, { name: "Bone Broth", qty: 1 }
  ] },
  { name: "Over The Moon", time: 7200, level: 10, collectXP: 600, seasonal: false, ingredients: [
    { name: "Coal", qty: 120 }, { name: "Leek", qty: 3 }, { name: "Corn", qty: 3 }, { name: "Steak", qty: 3 }, { name: "Salt", qty: 1 }, { name: "Herbs", qty: 1 }
  ] },
  { name: "Cat's Meow", time: 7200, level: 15, collectXP: 600, seasonal: false, ingredients: [
    { name: "Coal", qty: 120 }, { name: "Fish Bones", qty: 25 }, { name: "Onion", qty: 5 }, { name: "Milk", qty: 5 }, { name: "Essence of Slime", qty: 3 }, { name: "Salt", qty: 1 }, { name: "Cooking Pot", qty: 1 }, { name: "Bone Broth", qty: 1 }
  ] },
  { name: "Mushroom Stew", time: 10800, level: 20, collectXP: 1500, seasonal: false, ingredients: [
    { name: "Coal", qty: 180 }, { name: "Mushroom", qty: 100 }, { name: "Peppers", qty: 60 }, { name: "Carrot", qty: 60 }, { name: "Leek", qty: 32 }, { name: "Onion", qty: 20 }, { name: "Cooking Pot", qty: 1 }, { name: "Bone Broth", qty: 1 }
  ] },
  { name: "Quandary Chowder", time: 14400, level: 25, collectXP: 2000, seasonal: false, ingredients: [
    { name: "Coal", qty: 240 }, { name: "Corn", qty: 16 }, { name: "Milk", qty: 10 }, { name: "Potato", qty: 5 }, { name: "Carrot", qty: 3 }, { name: "Red Berries", qty: 3 }, { name: "Bacon", qty: 2 }, { name: "Herbs", qty: 2 }, { name: "Salt", qty: 1 }, { name: "Corn Oil", qty: 1 }, { name: "Cooking Pot", qty: 1 }, { name: "Bone Broth", qty: 1 }
  ] },
  { name: "Cabbage Stew", time: 28800, level: 25, collectXP: 4500, seasonal: false, ingredients: [
    { name: "Coal", qty: 480 }, { name: "Cabbage", qty: 250 }, { name: "Salt", qty: 50 }, { name: "Carrot", qty: 40 }, { name: "Potato", qty: 40 }, { name: "Onion", qty: 25 }, { name: "Leek", qty: 25 }, { name: "Herbs", qty: 25 }, { name: "Tomato", qty: 15 }, { name: "Bone Broth", qty: 5 }
  ] },
  { name: "Neigh", time: 10800, level: 30, collectXP: 1500, seasonal: false, ingredients: [
    { name: "Coal", qty: 180 }, { name: "Carrot", qty: 50 }, { name: "Peppers", qty: 45 }, { name: "Cucumber", qty: 30 }, { name: "Peas", qty: 40 }, { name: "Onion", qty: 20 }, { name: "Tomato", qty: 10 }, { name: "Cooking Pot", qty: 1 }, { name: "Bone Broth", qty: 1 }
  ] },
  { name: "Sea Pincher Special", time: 21600, level: 30, collectXP: 3000, seasonal: false, ingredients: [
    { name: "Coal", qty: 240 }, { name: "Lemon", qty: 11 }, { name: "Honey", qty: 10 }, { name: "Milk", qty: 7 }, { name: "Onion", qty: 5 }, { name: "Crab", qty: 3 }, { name: "Essence of Slime", qty: 1 }, { name: "Cooking Pot", qty: 1 }
  ] },
  { name: "Shrimp-a-Plenty", time: 7200, level: 35, collectXP: 750, seasonal: false, ingredients: [
    { name: "Coal", qty: 240 }, { name: "Peas", qty: 100 }, { name: "Small Prawn", qty: 30 }, { name: "Shrimp", qty: 20 }, { name: "Rice", qty: 10 }, { name: "Snail", qty: 5 }, { name: "Salt", qty: 2 }, { name: "Cooking Pot", qty: 1 }, { name: "Bone Broth", qty: 1 }
  ] },
  { name: "Hickory Omelette", time: 14400, level: 35, collectXP: 2000, seasonal: false, ingredients: [
    { name: "Bird Egg", qty: 500 }, { name: "Coal", qty: 240 }, { name: "Peppers", qty: 6 }, { name: "Tomato", qty: 3 }, { name: "Salt", qty: 3 }, { name: "Milk", qty: 2 }, { name: "Cheese", qty: 2 }, { name: "Herbs", qty: 2 }, { name: "Butter", qty: 1 }
  ] },
  { name: "Breakfast Boost", time: 7200, level: 40, collectXP: 900, seasonal: false, ingredients: [
    { name: "Coal", qty: 120 }, { name: "Flour", qty: 4 }, { name: "Eggs", qty: 3 }, { name: "Cabbage", qty: 2 }, { name: "Grape Juice", qty: 1 }, { name: "Cheese", qty: 1 }, { name: "Butter", qty: 1 }
  ] },
  { name: "Red Berry Pie", time: 43200, level: 40, collectXP: 6500, seasonal: false, ingredients: [
    { name: "Coal", qty: 750 }, { name: "Red Berries", qty: 200 }, { name: "Sweet Root", qty: 100 }, { name: "Flour", qty: 25 }, { name: "Eggs", qty: 10 }, { name: "Salt", qty: 10 }, { name: "Butter", qty: 5 }, { name: "Milk", qty: 1 }, { name: "Pie Pan", qty: 1 }
  ] },
  { name: "Concord Grape Pie", time: 43200, level: 40, collectXP: 6500, seasonal: false, ingredients: [
    { name: "Coal", qty: 750 }, { name: "Grapes", qty: 100 }, { name: "Sweet Root", qty: 100 }, { name: "Flour", qty: 25 }, { name: "Eggs", qty: 10 }, { name: "Salt", qty: 10 }, { name: "Butter", qty: 5 }, { name: "Milk", qty: 1 }, { name: "Pie Pan", qty: 1 }
  ] },
  { name: "Acorn Pie", time: 86400, level: 50, collectXP: 15000, seasonal: false, ingredients: [
    { name: "Coal", qty: 1500 }, { name: "Acorn", qty: 400 }, { name: "Flour", qty: 25 }, { name: "Butter", qty: 25 }, { name: "Salt", qty: 10 }, { name: "Molasses", qty: 7 }, { name: "Brown Sugar", qty: 5 }, { name: "Pie Pan", qty: 1 }
  ] },
  { name: "Crunchy Omelette", time: 14400, level: 35, collectXP: 2000, seasonal: "April only", ingredients: [
    { name: "Bird Egg", qty: 250 }, { name: "Coal", qty: 240 }, { name: "Egg 05", qty: 5 }, { name: "Tomato", qty: 3 }, { name: "Salt", qty: 3 }, { name: "Milk", qty: 2 }, { name: "Cheese", qty: 2 }, { name: "Herbs", qty: 2 }, { name: "Butter", qty: 1 }
  ] },
  { name: "Festive Eggnog", time: 1800, level: 10, collectXP: 900, seasonal: "December only", ingredients: [
    { name: "Coal", qty: 30 }, { name: "Eggs", qty: 50 }, { name: "Milk", qty: 50 }, { name: "Peppers", qty: 50 }, { name: "Sweet Root", qty: 25 }
  ] },
];

export function getMealByName(name: string): Meal | undefined {
  return meals.find(m => m.name === name);
}
