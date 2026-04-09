const crypto = require('crypto');

const COOKIE_NAME = 'cms_session';
const MAX_AGE_SEC = 8 * 60 * 60;

function getSecret() {
  return process.env.CMS_SECRET || 'change-this-secret-in-netlify';
}

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function fromBase64url(input) {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, 'base64').toString('utf8');
}

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('hex');
}

function parseCookies(header) {
  const out = {};
  String(header || '')
    .split(';')
    .forEach((part) => {
      const idx = part.indexOf('=');
      if (idx === -1) return;
      const key = part.slice(0, idx).trim();
      const value = part.slice(idx + 1).trim();
      if (!key) return;
      out[key] = decodeURIComponent(value);
    });
  return out;
}

function createToken(username) {
  const payload = {
    username,
    exp: Date.now() + MAX_AGE_SEC * 1000
  };
  const encoded = base64url(JSON.stringify(payload));
  return encoded + '.' + sign(encoded);
}

function verifyToken(token) {
  if (!token || typeof token !== 'string' || token.indexOf('.') === -1) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const encoded = parts[0];
  const sig = parts[1];
  if (sign(encoded) !== sig) return null;

  try {
    const payload = JSON.parse(fromBase64url(encoded));
    if (!payload || typeof payload !== 'object') return null;
    if (!payload.exp || Date.now() > Number(payload.exp)) return null;
    return payload;
  } catch (err) {
    return null;
  }
}

function getSession(event) {
  const cookies = parseCookies(event.headers && (event.headers.cookie || event.headers.Cookie));
  return verifyToken(cookies[COOKIE_NAME]);
}

function buildCookie(token, event) {
  const forwardedProto = event.headers && (event.headers['x-forwarded-proto'] || event.headers['X-Forwarded-Proto']);
  const secure = forwardedProto === 'https' || process.env.URL;
  return [
    COOKIE_NAME + '=' + encodeURIComponent(token),
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=' + MAX_AGE_SEC,
    secure ? 'Secure' : ''
  ].filter(Boolean).join('; ');
}

function buildExpiredCookie() {
  return [
    COOKIE_NAME + '=',
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0'
  ].join('; ');
}

module.exports = {
  COOKIE_NAME,
  createToken,
  getSession,
  buildCookie,
  buildExpiredCookie
};
