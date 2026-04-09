const fs = require('fs');
const path = require('path');
const { getStore } = require('@netlify/blobs');

const CONTENT_KEY = 'site-content';
const DEFAULTS_PATH = path.join(__dirname, '..', '..', '..', 'data', 'default-content.json');

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function getDefaultContent() {
  return JSON.parse(fs.readFileSync(DEFAULTS_PATH, 'utf8'));
}

function mergeWithDefaults(stored) {
  const defaults = getDefaultContent();
  if (!stored || typeof stored !== 'object') return defaults;

  const merged = clone(defaults);
  Object.keys(defaults).forEach((section) => {
    if (stored[section] && typeof stored[section] === 'object') {
      merged[section] = stored[section];
    }
  });
  return merged;
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
