// Generic form persistence for FarmRPG Toolkit calculators
// Usage: import { saveFormState, restoreFormState } from './formPersistence.js';

export function saveFormState(form, key) {
  if (!form) return;
  const data = {};
  Array.from(form.elements).forEach(el => {
    if (el.name) {
      if (el.type === 'checkbox' || el.type === 'radio') {
        data[el.name] = el.checked;
      } else {
        data[el.name] = el.value;
      }
    }
  });
  localStorage.setItem(key, JSON.stringify(data));
}

export function restoreFormState(form, key) {
  if (!form) return;
  const data = JSON.parse(localStorage.getItem(key) || '{}');
  Array.from(form.elements).forEach(el => {
    if (el.name && data.hasOwnProperty(el.name)) {
      if (el.type === 'checkbox' || el.type === 'radio') {
        el.checked = data[el.name];
      } else {
        el.value = data[el.name];
      }
    }
  });
}
