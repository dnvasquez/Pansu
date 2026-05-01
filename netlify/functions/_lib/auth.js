const crypto = require('crypto');

const COOKIE_NAME = 'cms_session';
const MAX_AGE_SEC = 8 * 60 * 60;
const TOTP_STEP_SEC = 30;
const TOTP_DIGITS = 6;

function getSecret() {
  const secret = process.env.CMS_SECRET;
  if (!secret) {
    throw new Error('CMS_SECRET not configured');
  }
  return secret;
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

function normalizeOtp(otp) {
  return String(otp || '').replace(/\s+/g, '').replace(/[^0-9]/g, '');
}

function decodeBase32(secret) {
  const normalized = String(secret || '').toUpperCase().replace(/=+/g, '').replace(/\s+/g, '');
  if (!normalized) return Buffer.alloc(0);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const char of normalized) {
    const idx = alphabet.indexOf(char);
    if (idx === -1) {
      return Buffer.from(secret, 'utf8');
    }
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function createTotp(secret, timeMs = Date.now()) {
  const key = decodeBase32(secret);
  if (!key.length) return null;
  const counter = Math.floor(timeMs / 1000 / TOTP_STEP_SEC);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', key).update(buffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code = ((hmac[offset] & 0x7f) << 24)
    | ((hmac[offset + 1] & 0xff) << 16)
    | ((hmac[offset + 2] & 0xff) << 8)
    | (hmac[offset + 3] & 0xff);
  return String(code % (10 ** TOTP_DIGITS)).padStart(TOTP_DIGITS, '0');
}

function verifyTotp(secret, otp, timeMs = Date.now(), window = 1) {
  const normalized = normalizeOtp(otp);
  if (!normalized) return false;
  const target = normalized.padStart(TOTP_DIGITS, '0').slice(-TOTP_DIGITS);
  for (let offset = -window; offset <= window; offset += 1) {
    const candidate = createTotp(secret, timeMs + offset * TOTP_STEP_SEC * 1000);
    if (candidate && crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(target))) {
      return true;
    }
  }
  return false;
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
  buildExpiredCookie,
  verifyTotp,
  normalizeOtp
};
