const fs = require('fs');
const path = require('path');
const { getStore } = require('@netlify/blobs');

const CONTENT_KEY = 'site-content';
const DEFAULTS_PATH = path.join(__dirname, '..', '..', '..', 'data', 'default-content.json');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(defaultValue, storedValue) {
  if (Array.isArray(defaultValue)) {
    return Array.isArray(storedValue) ? clone(storedValue) : clone(defaultValue);
  }

  if (isPlainObject(defaultValue)) {
    const result = clone(defaultValue);
    if (!isPlainObject(storedValue)) return result;

    Object.keys(storedValue).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(defaultValue, key)) return;
      result[key] = deepMerge(defaultValue[key], storedValue[key]);
    });

    return result;
  }

  return typeof storedValue === 'undefined' ? defaultValue : storedValue;
}

function getDefaultContent() {
  return JSON.parse(fs.readFileSync(DEFAULTS_PATH, 'utf8'));
}

function mergeWithDefaults(stored) {
  const defaults = getDefaultContent();
  if (!stored || typeof stored !== 'object') return defaults;

  return deepMerge(defaults, stored);
}

function getCmsStore() {
  return getStore('pansu-cms');
}

async function readContent() {
  const store = getCmsStore();
  const stored = await store.get(CONTENT_KEY, { type: 'json' });
  return mergeWithDefaults(stored);
}

async function writeContent(content) {
  const store = getCmsStore();
  await store.setJSON(CONTENT_KEY, content);
  return content;
}

async function updateSection(section, data) {
  const current = await readContent();
  const defaults = getDefaultContent();
  if (!Object.prototype.hasOwnProperty.call(defaults, section)) {
    throw new Error('Invalid section');
  }
  current[section] = data;
  return writeContent(current);
}

async function resetSection(section) {
  const current = await readContent();
  const defaults = getDefaultContent();
  if (!Object.prototype.hasOwnProperty.call(defaults, section)) {
    throw new Error('Invalid section');
  }
  current[section] = clone(defaults[section]);
  return writeContent(current);
}

module.exports = {
  getDefaultContent,
  readContent,
  writeContent,
  updateSection,
  resetSection
};
