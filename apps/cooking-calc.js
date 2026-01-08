
// --- Timeline Generation using lib ---
import { calculateTimeline, getMealByName, meals } from './cooking-calc-lib.js';
import { saveFormState, restoreFormState } from '../assets/formPersistence.js';
// --- Populate Meal Dropdown ---
async function populateMealDropdown() {
	let lib;
	const mealSelect = document.getElementById('meal');
	if (!mealSelect) return;
	mealSelect.innerHTML = '';
	const mealNames = [
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
	// Sort meals by level ascending
	const sortedMeals = mealNames
		.map(name => getMealByName(name))
		.filter(meal => !!meal)
		.sort((a, b) => a.level - b.level);
	sortedMeals.forEach(meal => {
		const option = document.createElement('option');
		option.value = meal.name;
		let label = `[${meal.level}] ${meal.name}`;
		if (meal.seasonal && typeof meal.seasonal === 'string') {
			label += ` (${meal.seasonal})`;
		}
		option.textContent = label;
		mealSelect.appendChild(option);
	});
}
function formatTimeX(totalSeconds) {
	const h = Math.floor(totalSeconds / 3600);
	const m = Math.floor((totalSeconds % 3600) / 60);
	const s = Math.floor(totalSeconds % 60);
	let out = '';
	if (h) out += h + 'h ';
	if (m || h) out += m + 'm ';
	out += s + 's';
	return out.trim();
}

async function calculateCooking() {
	// import cooking lib
	// ...existing input code...
	const mealName = document.getElementById('meal').value;
	const meal = getMealByName(mealName);
	const batchSize = parseInt(document.getElementById('batchSize').value) || 1;
	const maxOvens = Math.max(1, Math.min(10, parseInt(document.getElementById('maxOvens').value) || 1));
	const eventBonus = (parseFloat(document.getElementById('eventBonus').value) || 0) / 100;
	const doStir = document.getElementById('doStir').checked;
	const doTaste = document.getElementById('doTaste').checked;
	const doSeason = document.getElementById('doSeason').checked;
	const doCollect = document.getElementById('doCollect').checked;
	const perkAlmanac = document.getElementById('perkAlmanac').checked;
	const perkAlmanac2 = document.getElementById('perkAlmanac2')?.checked || false;
	const perkPrimer = document.getElementById('perkPrimer').checked;
	const perkPrimer2 = document.getElementById('perkPrimer2').checked;
	const perkHotterOvens = document.getElementById('perkHotterOvens').checked;
	const perkQuicker1 = document.getElementById('perkQuicker1').checked;
	const perkQuicker2 = document.getElementById('perkQuicker2').checked;
	const perkFishChips = document.getElementById('perkFishChips')?.checked || false;

	// XP scaling
	let baseTime = meal.time;
	let speedMult = 1;
	if (perkHotterOvens) speedMult -= 0.10;
	if (perkQuicker1) speedMult -= 0.05;
	if (perkQuicker2) speedMult -= 0.10;
	const baseTimeWithPerks = Math.round(baseTime * speedMult);
	const totalTime = baseTimeWithPerks;

	// XP calculations
	let stirXP = 0, tasteXP = 0, seasonXP = 0, collectXP = 0, mastery = 0;
	let xpMult = 1;
	if (perkAlmanac) xpMult += 0.10;
	if (perkAlmanac2) xpMult += 0.10;
	if (perkPrimer) xpMult += 0.10;
	if (perkPrimer2) xpMult += 0.10;
	if (doStir) {
		// Calculate total stir XP by simulating the timeline for stirs
		let remaining = baseTimeWithPerks;
		let lastActionTime = 0;
		let stirXPsum = 0;
		let stirTimes = [];
		for (let t = 60; t < 24 * 3600; t += 15 * 60) stirTimes.push(t);
		for (let i = 0; i < stirTimes.length; ++i) {
			let t = stirTimes[i];
			if (t >= remaining + lastActionTime) break;
			let elapsed = t - lastActionTime;
			remaining = Math.max(0, remaining - elapsed);
			let secondsReduced = Math.floor(remaining * 0.1);
			let minutesReduced = Math.ceil(secondsReduced / 60);
			if (minutesReduced > 0) {
				stirXPsum += 17 * maxOvens * minutesReduced * (1 + eventBonus);
			}
			remaining = Math.max(0, remaining - secondsReduced);
			lastActionTime = t;
			if (remaining <= 0) break;
		}
		stirXP = stirXPsum;
	}
	if (doTaste) {
		let masteryPerTaste = 1 + Math.floor(baseTime / 1800);
		// Bonus XP perks do NOT apply, event bonus DOES apply
		tasteXP = 30 * maxOvens * masteryPerTaste * (1 + eventBonus);
		mastery = masteryPerTaste * maxOvens;
	}
	if (doSeason) {
        let seasonBase = ((baseTime / 60) / 2); // baseTime is in seconds, convert to minutes then divide by 2
		let seasonPerks = 1;
		// Bonus XP perks DO apply, event bonus DOES apply
		seasonXP = 3.5 * maxOvens * seasonBase * seasonPerks * (1 + eventBonus) * xpMult;
	}
	collectXP = doCollect ? (meal.collectXP || 0) * xpMult : 0;

	// Ingredients
	let totalIngredients = {};
	meal.ingredients.forEach(ing => {
		totalIngredients[ing.name] = (totalIngredients[ing.name] || 0) + ing.qty * batchSize;
	});

	const timelineArr = calculateTimeline({
		mealName: meal.name,
		maxOvens,
		eventBonus,
		doStir,
		doTaste,
		doSeason,
		doCollect,
		perkHotterOvens,
		perkQuicker1,
		perkQuicker2,
		batchSize,
		xpMult
	});

	// Render timeline and count actions
	let timelineSteps = [];
	let stirActions = 0, tasteActions = 0, seasonActions = 0, collectActions = 0, totalActions = 0;
	// Only count actions that are present in the timeline (excluding 'Start cooking')
	timelineArr.forEach(step => {
		let label = `<strong>${formatTimeX(step.time)}:</strong> ${step.action}`;
		if (step.action.startsWith('Stir')) stirActions++;
		if (step.action.startsWith('Taste')) tasteActions++;
		if (step.action.startsWith('Season')) seasonActions++;
		if (step.action === 'Collect') collectActions++;
		timelineSteps.push(`<div class=\"timeline-step\">${label}</div>`);
	});
	// Multiply all action counts by batchSize
	const stirActionsTotal = stirActions * batchSize;
	const tasteActionsTotal = tasteActions * batchSize;
	const seasonActionsTotal = seasonActions * batchSize;
	const collectActionsTotal = collectActions * batchSize;
	// Total actions is the sum of all action steps in the timeline (excluding 'Start cooking' and 'Finish cooking'), times batchSize
	const totalActionsTotal = (timelineArr.filter(step => step.action !== 'Start cooking' && step.action !== 'Finish cooking').length) * batchSize;
		// Format timeline as a borderless table with Remaining Time column (rightmost) and Start cooking row
		let timelineTableRows = '';
		if (timelineArr.length > 0 && timelineArr[0].action === 'Start cooking') {
			const step = timelineArr[0];
			const timeCell = `<td class="timeline-time">${formatTimeX(step.time)}</td>`;
			const actionCell = `<td class="timeline-action">${step.action}</td>`;
			const xpCell = `<td class="timeline-xp"></td>`;
			const remainingCell = `<td class="timeline-remaining">${formatTimeX(step.remainingTime ?? 0)}</td>`;
			timelineTableRows += `<tr>${timeCell}${actionCell}${xpCell}${remainingCell}</tr>`;
		}
		// Simulate remaining time for each stir in the timeline for correct XP per stir
		let stirSimRemaining = baseTimeWithPerks;
		let stirSimLastAction = 0;
		let timelineTotalXP = 0;
	for (let i = 1; i < timelineArr.length; ++i) {
			const step = timelineArr[i];
			const timeCell = `<td class="timeline-time">${formatTimeX(step.time)}</td>`;
			// Determine color for action
			let color = '';
			let xpGained = '';
			let fishChipsMult = perkFishChips ? 20 : 1;
			if (step.action.startsWith('Stir')) {
				color = '#003300';
				// Simulate the actual minutes reduced for this stir
				let elapsed = step.time - stirSimLastAction;
				stirSimRemaining = Math.max(0, stirSimRemaining - elapsed);
				let secondsReduced = Math.floor(stirSimRemaining * 0.1);
				let minutesReduced = Math.ceil(secondsReduced / 60);
				let stirXPval = 0;
				if (minutesReduced > 0) {
					stirXPval = 17 * maxOvens * minutesReduced * (1 + eventBonus) * fishChipsMult;
					xpGained = stirXPval.toLocaleString();
				} else {
					xpGained = '0';
				}
				timelineTotalXP += stirXPval;
				stirSimRemaining = Math.max(0, stirSimRemaining - secondsReduced);
				stirSimLastAction = step.time;
			} else {
				// For non-stir actions, just update the simulation time
				stirSimLastAction = step.time;
			}
			if (step.action.startsWith('Taste')) {
				color = '#00007f';
				let masteryPerTaste = 1 + Math.floor(baseTime / 1800);
				let tasteXPPer = 30 * maxOvens * masteryPerTaste * (1 + eventBonus) * fishChipsMult;
				xpGained = tasteXPPer.toLocaleString();
				timelineTotalXP += tasteXPPer;
			} else if (step.action.startsWith('Season')) {
				color = '#4a315c';
				let seasonBase = ((baseTime / 60) / 2); // baseTime is in seconds, convert to minutes then divide by 2
				let xpMult = 1;
				if (perkAlmanac) xpMult += 0.10;
				if (perkAlmanac2) xpMult += 0.10;
				if (perkPrimer) xpMult += 0.10;
				if (perkPrimer2) xpMult += 0.10;
				// Use average RNG value (3.5), but apply correct formula: avgRNG * ovens * (baseTime(min)/2) * xpMult * (1 + eventBonus)
				let avgRNG = 3.5;
				let seasonXPPer = avgRNG * maxOvens * seasonBase * xpMult * (1 + eventBonus) * fishChipsMult;
				xpGained = Math.round(seasonXPPer).toLocaleString();
				timelineTotalXP += seasonXPPer;
			} else if (step.action === 'Collect') {
				color = '#351c04';
				let collectXPval = collectXP * fishChipsMult * batchSize / collectActionsTotal;
				xpGained = Math.round(collectXPval).toLocaleString();
				timelineTotalXP += collectXPval;
			}
			const actionCell = `<td class="timeline-action"${color ? ` style=\"color:${color};font-weight:bold;\"` : ''}>${step.action}</td>`;
			const xpCell = `<td class="timeline-xp">${xpGained}</td>`;
			const remainingCell = `<td class="timeline-remaining">${formatTimeX(step.remainingTime ?? 0)}</td>`;
			timelineTableRows += `<tr>${timeCell}${actionCell}${xpCell}${remainingCell}</tr>`;
		}
		let timelineHTML = `<div class="timeline-block"><h4>Timeline</h4><table class="timeline-table" style="border-collapse:collapse;width:100%;margin-top:0.5em;"><thead><tr><th style="font-weight:bold;text-align:left;">Time</th><th style="font-weight:bold;text-align:left;">Action</th><th style="font-weight:bold;text-align:left;">XP Gained</th><th style="font-weight:bold;text-align:left;">Remaining</th></tr></thead><tbody>${timelineTableRows}</tbody></table></div>`;

	// Results output
	const results = document.getElementById('resultsContent');
	// Use the last timeline step's time as the true finish time
	const finishTime = timelineArr.length > 0 ? timelineArr[timelineArr.length - 1].time : totalTime;

	// Add 1 mastery per Collect action (per batch)
	const collectMastery = collectActionsTotal;
	const totalMastery = (mastery * batchSize) + collectMastery;

	const totalXP = Math.round(timelineTotalXP * batchSize);
	// XP per hour and per action
	const hours = finishTime / 3600;
	const xpPerHour = hours > 0 ? Math.round(totalXP / hours) : 0;
	const xpPerAction = totalActionsTotal > 0 ? (totalXP / totalActionsTotal).toFixed(2) : '0.00';

	let resultsHtml =
		'<div class="result-row"><span class="result-label">Total XP:</span> <span class="result-value">' + totalXP.toLocaleString() + '</span></div>' +
		'<div class="result-row"><span class="result-label">XP per hour:</span> <span class="result-value">' + xpPerHour.toLocaleString() + '</span></div>' +
		'<div class="result-row"><span class="result-label">XP per action:</span> <span class="result-value">' + Number(xpPerAction).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) + '</span></div>';

	if (doStir) {
		resultsHtml += '<div class="result-row"><span class="result-label"><span style="font-weight:bold;color:#003300;">Stir</span> XP:</span> <span class="result-value">' + Math.round(stirXP * batchSize).toLocaleString() + (stirActionsTotal ? ` <span style=\"color:#888;\">(${stirActionsTotal} action${stirActionsTotal === 1 ? '' : 's'})</span>` : '') + '</span></div>';
	}
	if (doTaste) {
		resultsHtml += '<div class="result-row"><span class="result-label"><span style="font-weight:bold;color:#00007f;">Taste</span> XP:</span> <span class="result-value">' + Math.round(tasteXP * batchSize).toLocaleString() + (tasteActionsTotal ? ` <span style=\"color:#888;\">(${tasteActionsTotal} action${tasteActionsTotal === 1 ? '' : 's'})</span>` : '') + '</span></div>';
	}
	if (doSeason) {
		resultsHtml += '<div class="result-row"><span class="result-label"><span style="font-weight:bold;color:#4a315c;">Season</span> XP:</span> <span class="result-value">' + Math.round(seasonXP * batchSize).toLocaleString() + (seasonActionsTotal ? ` <span style=\"color:#888;\">(${seasonActionsTotal} action${seasonActionsTotal === 1 ? '' : 's'})</span>` : '') + '</span></div>';
	}
	if (collectActionsTotal > 0) {
		resultsHtml += '<div class="result-row"><span class="result-label"><span style="font-weight:bold;color:#351c04;">Collect</span> XP:</span> <span class="result-value">' + Math.round(collectXP * batchSize).toLocaleString() + ` <span style=\"color:#888;\">(${collectActionsTotal} action${collectActionsTotal === 1 ? '' : 's'})</span>` + '</span></div>';
	}
	resultsHtml +=
		'<div class="result-row"><span class="result-label">Action Count:</span> <span class="result-value">' + totalActionsTotal + ' action' + (totalActionsTotal === 1 ? '' : 's') + '</span></div>' +
		'<div class="result-row"><span class="result-label">Total Mastery:</span> <span class="result-value">' + totalMastery.toLocaleString() + '</span></div>' +
		'<div class="result-row"><span class="result-label">Total Time:</span> <span class="result-value">' + formatTimeX(finishTime) + '</span></div>' +
		timelineHTML;
	results.innerHTML = resultsHtml;

}

// Format seconds to hh:mm:ss
function formatTime(totalSeconds) {
	const hours = Math.floor(totalSeconds / 3600);
	const minutes = Math.floor((totalSeconds % 3600) / 60);
	const seconds = Math.floor(totalSeconds % 60);
	let out = '';
	if (hours > 0) out += hours + ' hr ';
	if (minutes > 0 || hours > 0) out += minutes + ' min ';
	out += seconds + ' sec';
	return out.trim();
}

// --- Event Listeners ---
window.addEventListener('DOMContentLoaded', function() {
		populateMealDropdown();
		const form = document.getElementById('cooking-form');
		const FORM_KEY = 'cookingCalcForm';
		restoreFormState(form, FORM_KEY);
		form.addEventListener('input', () => {
			saveFormState(form, FORM_KEY);
			calculateCooking();
		});
		calculateCooking();
});
