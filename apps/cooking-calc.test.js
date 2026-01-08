// Print all meal times in requested format
const { calculateTimeline, getMealByName } = require('./cooking-calc-lib.js');
console.log('\n--- Meal Timings ---');
const allMeals = [
  "Bone Broth",
  "Onion Soup",
  "Over The Moon",
  "Cat's Meow",
  "Mushroom Stew",
  "Quandary Chowder",
  "Cabbage Stew",
  "Neigh",
  "Sea Pincher Special",
  "Shrimp-a-Plenty",
  "Hickory Omelette",
  "Breakfast Boost",
  "Red Berry Pie",
  "Concord Grape Pie",
  "Acorn Pie",
  "Crunchy Omelette",
  "Festive Eggnog"
];
function formatTime(sec) {
  const h = Math.floor(sec/3600);
  const m = Math.floor((sec%3600)/60);
  const s = sec%60;
  let out = '';
  if (h) out += h+'h ';
  if (m || h) out += m+'m ';
  out += s+'s';
  return out.trim();
}
allMeals.forEach(mealName => {
  const meal = getMealByName(mealName);
  const baseTime = meal.time;
  const timeline = calculateTimeline({
    mealName,
    maxOvens: 1,
    doStir: true,
    doTaste: true,
    doSeason: true,
    perkHotterOvens: true,
    perkQuicker1: true,
    perkQuicker2: true
  });
  const finish = timeline[timeline.length-1].time;
  console.log(`${mealName} (${formatTime(baseTime)}): ${formatTime(finish)}`);
});



// ...existing code...

// Over The Moon test (all time perks, all actions)
{
  const moonTimeline = calculateTimeline({
    mealName: 'Over The Moon',
    maxOvens: 1,
    doStir: true,
    doTaste: true,
    doSeason: true,
    perkHotterOvens: true,
    perkQuicker1: true,
    perkQuicker2: true
  });
  const moonFinish = moonTimeline[moonTimeline.length-1].time;
  console.log('Over The Moon Timeline:', moonTimeline);
  console.log('Over The Moon Total Time:', `${Math.floor(moonFinish/60)}m ${moonFinish%60}s`);
}

function assertEqual(actual, expected, msg) {
  if (actual !== expected) {
    console.error('FAIL:', msg, 'Expected', expected, 'got', actual);
    process.exitCode = 1;
  } else {
    console.log('PASS:', msg);
  }
}

// Test: Bone Broth timeline, 1 oven, all time perks, stir, taste, and season enabled
const timeline = calculateTimeline({
  mealName: 'Bone Broth',
  maxOvens: 1,
  doStir: true,
  doTaste: true,
  doSeason: true,
  perkHotterOvens: true,
  perkQuicker1: true,
  perkQuicker2: true
});

// Should match the expected timeline exactly
const expectedTimeline = [
  { time: 0, action: 'Start cooking' },
  { time: 60, action: 'Stir (-39s)' },
  { time: 180, action: 'Taste' },
  { time: 300, action: 'Season' },
  { time: 411, action: 'Finish cooking' }
];

function assertTimeline(actual, expected, msg) {
  const sameLength = actual.length === expected.length;
  const allMatch = sameLength && actual.every((step, i) => step.time === expected[i].time && step.action === expected[i].action);
  if (!allMatch) {
    console.error('FAIL:', msg, '\nExpected:', expected, '\nGot:', actual);
    process.exitCode = 1;
  } else {
    console.log('PASS:', msg);
  }
}


assertTimeline(timeline, expectedTimeline, 'Timeline matches expected steps for Bone Broth with all actions');


// Onion Soup test (all time perks, all actions)
const onionTimeline = calculateTimeline({
  mealName: 'Onion Soup',
  maxOvens: 1,
  doStir: true,
  doTaste: true,
  doSeason: true,
  perkHotterOvens: true,
  perkQuicker1: true,
  perkQuicker2: true
});
const expectedOnionTimeline = [
  { time: 0, action: 'Start cooking' },
  { time: 60, action: 'Stir (-4m24s)' },
  { time: 180, action: 'Taste' },
  { time: 300, action: 'Season' },
  { time: 960, action: 'Stir (-2m27s)' },
  { time: 1380, action: 'Taste' },
  { time: 1860, action: 'Stir (-42s)' },
  { time: 2100, action: 'Season' },
  { time: 2247, action: 'Finish cooking' }
];
assertTimeline(onionTimeline, expectedOnionTimeline, 'Timeline matches expected steps for Onion Soup with all actions');
