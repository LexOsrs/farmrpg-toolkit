// FarmRPG Crop Yield Calculator Logic
// All calculations are performed client-side.

function calculateYield() {
  const cropSpaces = parseInt(document.getElementById('cropSpaces').value) || 0;
  const harvests = parseInt(document.getElementById('harvests').value) || 1;
  const regularSeeds = parseInt(document.getElementById('regularSeeds').value) || 0;
  const megaSeeds = parseInt(document.getElementById('megaSeeds').value) || 0;
  const cookieTypes = parseInt(document.getElementById('cookieTypes').value) || 0;
  const doublePrizes1 = document.getElementById('doublePrizes1').checked;
  const doublePrizes2 = document.getElementById('doublePrizes2').checked;

  // Validate seeds
  let totalSeeds = regularSeeds + megaSeeds;
  const warningDiv = document.getElementById('seed-warning');
  if (totalSeeds > cropSpaces) {
    document.getElementById('regularSeeds').setCustomValidity('Total seeds cannot exceed crop spaces');
    document.getElementById('megaSeeds').setCustomValidity('Total seeds cannot exceed crop spaces');
    warningDiv.style.display = '';
    warningDiv.textContent = '⚠️ Warning: The total number of seeds (regular + mega) cannot exceed your crop spaces!';
  } else {
    document.getElementById('regularSeeds').setCustomValidity('');
    document.getElementById('megaSeeds').setCustomValidity('');
    warningDiv.style.display = 'none';
    warningDiv.textContent = '';
  }

  // Base yield per seed
  let regularYield = regularSeeds * 1;
  let megaYield = megaSeeds * 10;
  let totalBaseYield = (regularYield + megaYield) * harvests;

  // Cookies multiplier
  let cookieMult = [1, 3, 6, 9][cookieTypes];
  let yieldWithCookies = totalBaseYield * cookieMult;

  // Double Prizes
  let doubleChance = 0;
  if (doublePrizes1) doubleChance += 0.15;
  if (doublePrizes2) doubleChance += 0.25;
  let yieldWithDouble = yieldWithCookies * (1 + doubleChance);

  // Results
  const resultsSection = document.querySelector('.card.results');
  let resultsHtml = `<h2>Results</h2>
    <div class="result-row"><span class="result-label">Average crops per harvest:</span> <span class="result-value">${Math.round(yieldWithDouble / harvests)}</span></div>
    <div class="result-row"><span class="result-label">Average total crops:</span> <span class="result-value">${Math.round(yieldWithDouble)}</span></div>`;
  resultsSection.innerHTML = resultsHtml;
}

// Add event listeners to inputs
import { saveFormState, restoreFormState } from '../assets/formPersistence.js';

window.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('yield-form');
  const FORM_KEY = 'cropCalcForm';
  restoreFormState(form, FORM_KEY);
  form.addEventListener('input', () => {
    saveFormState(form, FORM_KEY);
    calculateYield();
  });
  calculateYield();
});
