const fs = require('fs');
const path = require('path');
const { getStore } = require('@netlify/blobs');

const CONTENT_KEY = 'site-content';
const DEFAULTS_PATH = path.join(__dirname, '..', '..', '..', 'data', 'default-content.json');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SAFE_HREF_RE = /^(?:https?:|mailto:|tel:|#|\/(?!\/))/i;

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

function sanitizeHref(value) {
  const href = String(value || '').trim();
  if (!href) return '#';
  return SAFE_HREF_RE.test(href) ? href : '#';
}

function sanitizeContent(content) {
  const defaults = getDefaultContent();
  const merged = deepMerge(defaults, content);

  if (merged.quote && typeof merged.quote === 'object') {
    const email = String(merged.quote.destinationEmail || '').trim();
    merged.quote.destinationEmail = EMAIL_RE.test(email) ? email : defaults.quote.destinationEmail;
  }

  if (merged.social && Array.isArray(merged.social.links)) {
    merged.social.links = merged.social.links.map((item, idx) => {
      const fallback = (defaults.social && Array.isArray(defaults.social.links) && defaults.social.links[idx]) || {};
      return {
        key: String((item && item.key) || fallback.key || ''),
        label: String((item && item.label) || fallback.label || '').trim(),
        iconClass: String((item && item.iconClass) || fallback.iconClass || '').trim(),
        href: sanitizeHref(item && item.href),
        enabled: Boolean(item && item.enabled)
      };
    });
  }

  return merged;
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
  return sanitizeContent(stored);
}

async function writeContent(content) {
  const store = getCmsStore();
  const sanitized = sanitizeContent(content);
  await store.setJSON(CONTENT_KEY, sanitized);
  return sanitized;
}

async function updateSection(section, data) {
  const current = await readContent();
  const defaults = getDefaultContent();
  if (!Object.prototype.hasOwnProperty.call(defaults, section)) {
    throw new Error('Invalid section');
  }
  current[section] = sanitizeContent({ [section]: data })[section];
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
