// FarmRPG Apple Pie Stamina Calculator Logic
// All calculations are performed client-side.
// Mechanics assumptions are documented and explicit.

import { saveFormState, restoreFormState } from '../assets/formPersistence.js';


// Input elements
const numPiesInput = document.getElementById('numPies');
const waitAmountInput = document.getElementById('waitAmount');
const waitUnitInput = document.getElementById('waitUnit');
const waitUnitLabel = document.getElementById('waitUnitLabel');
const exploringLevelInput = document.getElementById('exploringLevel');
const currentTowerInput = document.getElementById('currentTower');
const targetTowerInput = document.getElementById('targetTower');

// Regen rate assumption (stamina per day per 1 max stamina)
const REGEN_RATE = 8;

// Output elements
const lostStaminaEl = document.getElementById('lostStamina');
const extraDailyEl = document.getElementById('extraDaily');
const breakEvenEl = document.getElementById('breakEven');
const exploreWarningEl = document.getElementById('explore-warning');


// Utility: format numbers with commas
function formatNumber(n) {
	return n.toLocaleString('en-US');
}

// Utility: format years to 1 decimal
function formatYears(days) {
	return (days / 365).toFixed(1);
}


// Core calculation
function recalculate() {
	// Parse inputs
	const N = parseInt(numPiesInput.value, 10) || 0;
	const waitAmount = parseInt(waitAmountInput.value, 10) || 0;
	const waitUnit = waitUnitInput.value;
	const exploringLevel = parseInt(exploringLevelInput.value, 10) || 0;
	const currentTower = parseInt(currentTowerInput.value, 10) || 0;
	const targetTower = parseInt(targetTowerInput.value, 10) || 0;

	// Convert wait to days
	let D = waitAmount;
	if (waitUnit === 'weeks') D = waitAmount * 7;
	if (waitUnit === 'months') D = waitAmount * 30;

	// Apple Pie stamina mechanics:
	// stamina per pie = (exploring level × 10) + tower level
	const S_now = (exploringLevel * 10) + currentTower;
	const S_later = (exploringLevel * 10) + targetTower;

	// Extra stamina per pie gained by waiting
	const deltaS = Math.max(S_later - S_now, 0);

	// Validate meaningful inputs
	const valid = N > 0 && D > 0 && S_now > 0 && deltaS > 0;

	// Total stamina lost by waiting:
	// lostStamina = N × S_now × regenRate × D
	const lostStamina = valid
		? N * S_now * REGEN_RATE * D
		: 0;

	// Extra daily stamina gained by waiting:
	// extraDaily = N × deltaS × regenRate
	const extraDaily = valid
		? N * deltaS * REGEN_RATE
		: 0;

	// Break-even calculation
	let breakEvenDays = 0;
	if (valid && extraDaily > 0) {
		breakEvenDays = lostStamina / extraDaily;
	}


	// Update UI
	lostStaminaEl.textContent = formatNumber(Math.round(lostStamina));
	extraDailyEl.textContent = formatNumber(Math.round(extraDaily));
	let breakEvenText = '—';
	if (breakEvenDays > 0) {
		const totalDays = Math.round(breakEvenDays);
		const years = Math.floor(totalDays / 365);
		const months = Math.floor((totalDays % 365) / 30);
		const days = totalDays % 30;
		let parts = [];
		if (years > 0) parts.push(`${years} year${years === 1 ? '' : 's'}`);
		if (months > 0) parts.push(`${months} month${months === 1 ? '' : 's'}`);
		if (days > 0 || parts.length === 0) parts.push(`${days} day${days === 1 ? '' : 's'}`);
		breakEvenText = parts.join(' ');
	}
	breakEvenEl.textContent = breakEvenText;

	// Exploring level warning
	if (exploringLevel < 99) {
		// If user reaches 99, each pie gives extra (99 - exploringLevel) * 10 stamina
		const extraPerPie = (99 - exploringLevel) * 10;
		const totalExtra = N * extraPerPie;
		const perDay = totalExtra * REGEN_RATE;
		const pieWord = N === 1 ? 'pie' : 'pies';
		exploreWarningEl.style.display = 'block';
		exploreWarningEl.textContent =
			`Tip: Each Exploring level is worth 10× as much as a Tower level. If you reach level 99, each pie will give an extra ${formatNumber(extraPerPie)} max stamina (${formatNumber(perDay)} more stamina per day for ${N} ${pieWord}). Consider waiting to maximize your pies.`;
	} else {
		exploreWarningEl.style.display = 'none';
		exploreWarningEl.textContent = '';
	}

	// Pluralize dropdown options
	const unitOptions = {
		days: waitUnitInput.options[0],
		weeks: waitUnitInput.options[1],
		months: waitUnitInput.options[2]
	};
	// Set option text based on number
	unitOptions.days.text = waitAmount === 1 ? 'day' : 'days';
	unitOptions.weeks.text = waitAmount === 1 ? 'week' : 'weeks';
	unitOptions.months.text = waitAmount === 1 ? 'month' : 'months';
}


// Recalculate on input change

window.addEventListener('DOMContentLoaded', function() {
	const form = document.getElementById('calc-form');
	const FORM_KEY = 'applePieCalcForm';
	restoreFormState(form, FORM_KEY);
	form.addEventListener('input', () => {
		saveFormState(form, FORM_KEY);
		recalculate();
	});
	recalculate();
});
