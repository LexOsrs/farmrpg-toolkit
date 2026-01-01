
// Level XP table from levels.txt
const levelTable = [
  0,1250,3750,7250,11750,17750,25250,34250,45250,58250,71399,98983,115359,133634,154028,176787,202186,230531,262164,297466,336863,380830,429897,484655,545764,613961,690068,775003,869790,975572,1093624,1225370,1372398,1536481,1700564,1883680,2088037,2316099,2570616,2854656,3171644,3525402,3920195,4360783,4852479,5401211,6013595,6697015,7459711,8310879,9260782,10320873,11503934,12824230,14297680,15942050,17777166,19825155,22110710,24661389,27507946,30684703,34229963,38186473,42601938,47529596,53666776,60515868,68159454,76689695,86209443,96833481,108689907,121921678,136688334,153167922,171559142,192083743,214989197,240551683,269079417,300916368,336446405,376097926,420349023,469733247,524846040,586351916,654992473,731595334,817084126,914489617,1018962144,1137785484,1270392331,1418381572,1583537564,1767851651,2000000000
];

function getBaseXP(type) {
  switch (type) {
    case 'loved': return 150;
    case 'liked': return 25;
    case 'other': return 1;
    case 'heart': return 10000000;
    case 'bouquet': return 1000;
    case 'prism': return 100000000;
    case 'mask': return 100000000;
    case 'corn': return 100000000;
    case 'mace': return 100000000;
    case 'palette': return 100000000;
    case 'garebear': return 100000000;
    default: return 0;
  }
}

function getXPFromLevel(level) {
  // level can be decimal, interpolate between table values
  if (level <= 1) return 0;
  if (level >= 99) return 2000000000;
  const low = Math.floor(level) - 1;
  const high = Math.ceil(level) - 1;
  const lowXP = levelTable[low];
  const highXP = levelTable[high];
  return lowXP + (highXP - lowXP) * (level - Math.floor(level));
}

function getLevelFromXP(xp) {
  if (xp >= 2000000000) return 99;
  for (let lvl = 0; lvl < levelTable.length - 1; lvl++) {
    if (xp < levelTable[lvl + 1]) {
      const prevXP = levelTable[lvl];
      const nextXP = levelTable[lvl + 1];
      const frac = (xp - prevXP) / (nextXP - prevXP);
      // lvl=0 is level 1, lvl=1 is level 2, etc.
      return (lvl + 1) + frac;
    }
  }
  return 99;
}

function formatNum(n) {
  return n.toLocaleString('en-US');
}

function calculateFriendship() {
  const giftType = document.getElementById('giftType').value;
  const giftCount = parseInt(document.getElementById('giftCount').value) || 0;
  const totd = document.getElementById('totd').checked;
  const primer = document.getElementById('primer').checked;
  const meal = document.getElementById('meal').checked;
  const omg1 = document.getElementById('omg1').checked;
  const omg2 = document.getElementById('omg2').checked;
  let currentLevelInput = document.getElementById('currentLevel');
  let currentLevel = parseFloat(currentLevelInput.value) || 1.0;
  if (currentLevel > 99) {
    currentLevel = 99;
    currentLevelInput.value = 99;
  }

  let currentXP = getXPFromLevel(currentLevel);
  document.getElementById('currentXP').textContent = `XP (estimated): ${formatNum(Math.round(currentXP))}`;

  let baseXP = getBaseXP(giftType) * giftCount;
  let mult = 1;
  if (totd) mult *= 2;
  if (primer) mult *= 1.1;
  if (meal) mult *= 1.1;
  let gainedXP = baseXP * mult;
  let newXP = currentXP + gainedXP;
  let newLevel = getLevelFromXP(newXP);

  let omgSection = '';
  if (omg1 || omg2) {
    const minOMG = gainedXP * 7;
    const maxOMG = gainedXP * 10;
    const minXP = currentXP + minOMG;
    const maxXP = currentXP + maxOMG;
    const minLevel = getLevelFromXP(minXP);
    const maxLevel = getLevelFromXP(maxXP);
    omgSection = `
      <h3>If O.M.G triggers</h3>
      <div class="result-row"><span class="result-label">XP Gained:</span> <span class="result-value">${formatNum(minOMG)} to ${formatNum(maxOMG)}</span></div>
      <div class="result-row"><span class="result-label">New Total XP:</span> <span class="result-value">${formatNum(Math.round(minXP))} to ${formatNum(Math.round(maxXP))}</span></div>
      <div class="result-row"><span class="result-label">New Level:</span> <span class="result-value">${minLevel.toFixed(2)} to ${maxLevel.toFixed(2)}</span></div>
    `;
  }

  const resultsSection = document.querySelector('.card.results');
  let resultsHtml = `<h2>Results</h2>
    <h3>Normal</h3>
    <div class="result-row"><span class="result-label">XP Gained:</span> <span class="result-value">${formatNum(Math.round(gainedXP))}</span></div>
    <div class="result-row"><span class="result-label">New Total XP:</span> <span class="result-value">${formatNum(Math.round(newXP))}</span></div>
    <div class="result-row"><span class="result-label">New Level:</span> <span class="result-value">${newLevel.toFixed(2)}</span></div>
    ${omgSection}`;
  resultsSection.innerHTML = resultsHtml;
}

window.addEventListener('DOMContentLoaded', function() {
  document.getElementById('friendship-form').addEventListener('input', calculateFriendship);
  calculateFriendship();
});
