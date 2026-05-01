const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;

const CMS_USER = process.env.CMS_USER || '';
const CMS_PASS = process.env.CMS_PASS || '';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const DEFAULTS_PATH = path.join(ROOT, 'data', 'default-content.json');
const LOCAL_CONTENT_PATH = path.join(ROOT, 'data', 'local-content.json');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SAFE_HREF_RE = /^(?:https?:|mailto:|tel:|#|\/(?!\/))/i;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const QUOTE_WINDOW_MS = 10 * 60 * 1000;
const QUOTE_MAX_ATTEMPTS = 5;
const TOTP_STEP_SEC = 30;
const TOTP_DIGITS = 6;

const sessions = new Map();
const loginAttempts = new Map();
const quoteAttempts = new Map();

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

function isSecureRequest(req) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || req.headers['X-Forwarded-Proto'] || '').split(',')[0].trim().toLowerCase();
  return forwardedProto === 'https' || Boolean(req.socket && req.socket.encrypted);
}

function buildSecurityHeaders(req, extraHeaders = {}) {
  const headers = Object.assign({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  }, extraHeaders);
  if (isSecureRequest(req)) {
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
  }
  return headers;
}

function send(req, res, code, body, contentType = 'text/plain; charset=utf-8', extraHeaders = {}) {
  res.writeHead(code, Object.assign({ 'Content-Type': contentType }, buildSecurityHeaders(req, extraHeaders)));
  res.end(body);
}

function parseCookies(req) {
  const raw = req.headers.cookie || '';
  const out = {};
  raw.split(';').forEach((part) => {
    const [k, ...rest] = part.trim().split('=');
    if (!k) return;
    out[k] = decodeURIComponent(rest.join('=') || '');
  });
  return out;
}

function isAdminPath(pathname) {
  return /^\/admin(?:-[a-z0-9-]+)?\.html$/i.test(pathname) || /^\/js\/admin[-a-z0-9]*\.js$/i.test(pathname);
}

function isValidSession(token) {
  if (!token) return false;
  const entry = sessions.get(token);
  if (!entry) return false;
  if (Date.now() > entry.expiresAt) {
    sessions.delete(token);
    return false;
  }
  return true;
}

function createSession() {
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { expiresAt: Date.now() + SESSION_TTL_MS });
  return token;
}

function clearSession(token) {
  if (token) sessions.delete(token);
}

function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || req.headers['X-Forwarded-For'] || '').split(',')[0].trim();
  if (forwarded) return forwarded;
  return String(req.socket && req.socket.remoteAddress || 'unknown');
}

function getLoginState(ip) {
  const now = Date.now();
  const current = loginAttempts.get(ip);
  if (!current || now > current.resetAt) {
    const fresh = { count: 0, resetAt: now + LOGIN_WINDOW_MS };
    loginAttempts.set(ip, fresh);
    return fresh;
  }
  return current;
}

function isLoginRateLimited(ip) {
  return getLoginState(ip).count >= LOGIN_MAX_ATTEMPTS;
}

function registerLoginFailure(ip) {
  const state = getLoginState(ip);
  state.count += 1;
  state.resetAt = Math.max(state.resetAt, Date.now() + LOGIN_WINDOW_MS);
  loginAttempts.set(ip, state);
  return state;
}

function clearLoginAttempts(ip) {
  if (ip) loginAttempts.delete(ip);
}

function getQuoteState(ip) {
  const now = Date.now();
  const current = quoteAttempts.get(ip);
  if (!current || now > current.resetAt) {
    const fresh = { count: 0, resetAt: now + QUOTE_WINDOW_MS };
    quoteAttempts.set(ip, fresh);
    return fresh;
  }
  return current;
}

function isQuoteRateLimited(ip) {
  return getQuoteState(ip).count >= QUOTE_MAX_ATTEMPTS;
}

function registerQuoteFailure(ip) {
  const state = getQuoteState(ip);
  state.count += 1;
  state.resetAt = Math.max(state.resetAt, Date.now() + QUOTE_WINDOW_MS);
  quoteAttempts.set(ip, state);
}

function clearQuoteAttempts(ip) {
  if (ip) quoteAttempts.delete(ip);
}

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
    if (idx === -1) return Buffer.from(secret, 'utf8');
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

function normalizeVisibility(raw, defaults) {
  const fallback = (defaults && defaults.visibility) || {};
  const source = raw && typeof raw === 'object' ? raw : {};
  return Object.keys(fallback).reduce((acc, key) => {
    acc[key] = typeof source[key] === 'undefined' ? Boolean(fallback[key]) : Boolean(source[key]);
    return acc;
  }, {});
}

function normalizeSocialLinks(rawLinks, defaultLinks) {
  const raw = Array.isArray(rawLinks) ? rawLinks : [];
  const defaults = Array.isArray(defaultLinks) ? defaultLinks : [];
  const byKey = new Map();

  raw.forEach((item) => {
    if (!item || typeof item !== 'object') return;
    const key = String(item.key || '').trim();
    if (!key) return;
    byKey.set(key, item);
  });

  const merged = defaults.map((fallback) => {
    const item = byKey.get(fallback.key) || {};
    return {
      key: String(item.key || fallback.key || ''),
      label: String(item.label || fallback.label || '').trim(),
      iconClass: String(item.iconClass || fallback.iconClass || '').trim(),
      href: sanitizeHref(item.href || fallback.href),
      enabled: Boolean(typeof item.enabled === 'undefined' ? fallback.enabled : item.enabled)
    };
  });

  raw.forEach((item) => {
    const key = String(item && item.key || '').trim();
    if (!key || defaults.some((fallback) => fallback.key === key)) return;
    merged.push({
      key,
      label: String(item.label || key).trim(),
      iconClass: String(item.iconClass || '').trim(),
      href: sanitizeHref(item.href),
      enabled: Boolean(item.enabled)
    });
  });

  return merged.filter((item) => item.iconClass);
}

function normalizeQuoteRegions(rawRegions, defaultRegions) {
  const defaults = Array.isArray(defaultRegions) ? defaultRegions.filter(Boolean) : [];
  const allowed = new Set(defaults);
  if (!Array.isArray(rawRegions)) return defaults;
  const selected = rawRegions.map((region) => String(region || '').trim()).filter((region) => region && allowed.has(region));
  const unique = Array.from(new Set(selected));
  return defaults.filter((region) => unique.includes(region));
}

function getDefaultContent() {
  return JSON.parse(fs.readFileSync(DEFAULTS_PATH, 'utf8'));
}

function readStoredContent() {
  if (!fs.existsSync(LOCAL_CONTENT_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(LOCAL_CONTENT_PATH, 'utf8'));
  } catch (err) {
    return null;
  }
}

function sanitizeContent(content) {
  const defaults = getDefaultContent();
  const merged = deepMerge(defaults, content);

  if (merged.quote && typeof merged.quote === 'object') {
    const email = String(merged.quote.destinationEmail || '').trim();
    merged.quote.destinationEmail = EMAIL_RE.test(email) ? email : defaults.quote.destinationEmail;
    merged.quote.enabledRegions = normalizeQuoteRegions(merged.quote.enabledRegions, defaults.quote.enabledRegions);
  }

  if (merged.visibility && typeof merged.visibility === 'object') {
    merged.visibility = normalizeVisibility(merged.visibility, defaults);
  }

  if (merged.social && Array.isArray(merged.social.links)) {
    merged.social.links = normalizeSocialLinks(merged.social.links, defaults.social && defaults.social.links);
  }

  return merged;
}

function readContent() {
  return sanitizeContent(readStoredContent() || getDefaultContent());
}

function readPublicContent() {
  const content = readContent();
  if (content.quote && typeof content.quote === 'object') {
    const publicQuote = clone(content.quote);
    delete publicQuote.destinationEmail;
    content.quote = publicQuote;
  }
  return content;
}

function writeContent(content) {
  const sanitized = sanitizeContent(content);
  fs.writeFileSync(LOCAL_CONTENT_PATH, JSON.stringify(sanitized, null, 2), 'utf8');
  return sanitized;
}

function updateSection(section, data) {
  const current = readContent();
  const defaults = getDefaultContent();
  if (!Object.prototype.hasOwnProperty.call(defaults, section)) {
    throw new Error('Invalid section');
  }
  current[section] = sanitizeContent({ [section]: data })[section];
  return writeContent(current);
}

function resetSection(section) {
  const current = readContent();
  const defaults = getDefaultContent();
  if (!Object.prototype.hasOwnProperty.call(defaults, section)) {
    throw new Error('Invalid section');
  }
  current[section] = clone(defaults[section]);
  return writeContent(current);
}

function sanitizeNext(nextValue) {
  if (!nextValue || typeof nextValue !== 'string') return '/admin-header.html';
  if (!nextValue.startsWith('/')) return '/admin-header.html';
  if (nextValue.startsWith('//')) return '/admin-header.html';
  if (/^\/admin(?:-[a-z0-9-]+)?\.html$/i.test(nextValue)) return nextValue;
  return '/admin-header.html';
}

function buildQuoteBody(data) {
  return [
    'Nueva solicitud de cotizacion',
    '',
    'Nombre y Apellidos: ' + data.full_name,
    'Region: ' + data.region,
    'Comuna: ' + data.comuna,
    'Correo de contacto: ' + data.contact_email,
    'Numero de telefono: ' + data.contact_phone,
    'Tipo de solicitud: ' + data.quote_type
  ].join('\n');
}

function safePath(pathname) {
  const clean = pathname === '/' ? '/index.html' : pathname;
  const normalized = path.normalize(clean).replace(/^(\.\.(\/|\\|$))+/, '');
  const full = path.join(ROOT, normalized);
  if (!full.startsWith(ROOT)) return null;
  return full;
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 100_000) {
        reject(new Error('Payload demasiado grande'));
        req.destroy();
      }
    });
    req.on('end', () => resolve(body));
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);
  const pathname = url.pathname;
  const method = req.method || 'GET';
  const host = String(req.headers.host || '');
  const isLocalHost = /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host);
  const forwardedProto = String(req.headers['x-forwarded-proto'] || req.headers['X-Forwarded-Proto'] || '').split(',')[0].trim().toLowerCase();
  if (forwardedProto === 'http' && !isLocalHost) {
    const target = `https://${host}${req.url || '/'}`;
    res.writeHead(method === 'GET' || method === 'HEAD' ? 301 : 307, buildSecurityHeaders(req, { Location: target }));
    return res.end();
  }
  const cookies = parseCookies(req);
  const sessionToken = cookies.cms_session;
  const authenticated = isValidSession(sessionToken);

  if (pathname === '/api/login' && method === 'POST') {
    try {
      if (!CMS_USER || !CMS_PASS) {
        return send(req, res, 500, JSON.stringify({ ok: false, message: 'CMS no configurado' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
      }
      const ip = getClientIp(req);
      if (isLoginRateLimited(ip)) {
        return send(req, res, 429, JSON.stringify({ ok: false, message: 'Demasiados intentos. Intenta nuevamente más tarde.' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
      }
      const raw = await readBody(req);
      const payload = JSON.parse(raw || '{}');
      const username = String(payload.username || '');
      const password = String(payload.password || '');
      const otp = String(payload.otp || '');
      const next = sanitizeNext(String(payload.next || '/admin-header.html'));
      const mfaSecret = String(process.env.CMS_OTP_SECRET || '').trim();

      const passwordOk = username === CMS_USER && password === CMS_PASS;
      const otpOk = !mfaSecret || verifyTotp(mfaSecret, otp);

      if (passwordOk && otpOk) {
        clearLoginAttempts(ip);
        const token = createSession();
        const maxAgeSec = Math.floor(SESSION_TTL_MS / 1000);
        const secureCookie = req.headers['x-forwarded-proto'] === 'https' || req.headers['X-Forwarded-Proto'] === 'https';
        res.setHeader(
          'Set-Cookie',
          `cms_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secureCookie ? '; Secure' : ''}`
        );
        return send(req, res, 200, JSON.stringify({ ok: true, redirect: next }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
      }

      registerLoginFailure(ip);
      if (passwordOk && mfaSecret && !otpOk) {
        return send(req, res, 401, JSON.stringify({ ok: false, message: 'Codigo de verificacion invalido' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
      }
      return send(req, res, 401, JSON.stringify({ ok: false, message: 'Credenciales invalidas' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
    } catch (err) {
      return send(req, res, 400, JSON.stringify({ ok: false, message: 'Solicitud invalida' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
    }
  }

  if (pathname === '/api/logout' && method === 'POST') {
    clearSession(sessionToken);
    res.setHeader('Set-Cookie', 'cms_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    return send(req, res, 200, JSON.stringify({ ok: true }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
  }

  if (pathname === '/api/session' && method === 'GET') {
    return send(req, res, 200, JSON.stringify({ authenticated }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
  }

  if (pathname === '/api/public-content' && method === 'GET') {
    return send(req, res, 200, JSON.stringify({ ok: true, content: readPublicContent() }), 'application/json; charset=utf-8', { 'Cache-Control': 'public, max-age=60' });
  }

  if (pathname === '/api/quote-submit' && method === 'POST') {
    try {
      const ip = getClientIp(req);
      if (isQuoteRateLimited(ip)) {
        return send(req, res, 429, JSON.stringify({ ok: false, message: 'Demasiadas solicitudes. Intenta nuevamente mas tarde.' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
      }

      const raw = await readBody(req);
      const payload = JSON.parse(raw || '{}');
      const fullName = String(payload.full_name || '').trim();
      const region = String(payload.region || '').trim();
      const comuna = String(payload.comuna || '').trim();
      const contactEmail = String(payload.contact_email || '').trim();
      const contactPhone = String(payload.contact_phone || '').trim();
      const quoteType = String(payload.quote_type || '').trim();

      if (!fullName || !region || !comuna || !contactEmail || !contactPhone || !quoteType) {
        return send(req, res, 400, JSON.stringify({ ok: false, message: 'Completa todos los campos para enviar la solicitud.' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
      }
      if (!EMAIL_RE.test(contactEmail)) {
        return send(req, res, 400, JSON.stringify({ ok: false, message: 'Debes ingresar un correo valido.' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
      }

      const content = readContent();
      const quote = content.quote && typeof content.quote === 'object' ? content.quote : {};
      const destinationEmail = String(quote.destinationEmail || '').trim();
      const enabledRegions = Array.isArray(quote.enabledRegions) ? quote.enabledRegions : [];

      if (!EMAIL_RE.test(destinationEmail)) {
        return send(req, res, 500, JSON.stringify({ ok: false, message: 'Configuracion de cotizacion invalida' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
      }
      if (enabledRegions.length && enabledRegions.indexOf(region) === -1) {
        return send(req, res, 400, JSON.stringify({ ok: false, message: 'La region seleccionada no esta habilitada' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
      }

      const formsubmitResponse = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(destinationEmail), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: 'Solicitud de cotizacion PANSU',
          _captcha: 'false',
          nombre_apellidos: fullName,
          region: region,
          comuna: comuna,
          correo_contacto: contactEmail,
          telefono_contacto: contactPhone,
          tipo_solicitud: quoteType,
          detalle: buildQuoteBody({
            full_name: fullName,
            region: region,
            comuna: comuna,
            contact_email: contactEmail,
            contact_phone: contactPhone,
            quote_type: quoteType
          })
        })
      });

      if (!formsubmitResponse.ok) {
        registerQuoteFailure(ip);
        return send(req, res, 502, JSON.stringify({ ok: false, message: 'No se pudo enviar la solicitud en este momento.' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
      }

      clearQuoteAttempts(ip);
      return send(req, res, 200, JSON.stringify({ ok: true }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
    } catch (err) {
      registerQuoteFailure(getClientIp(req));
      return send(req, res, 400, JSON.stringify({ ok: false, message: 'Solicitud invalida' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
    }
  }

  if (pathname === '/api/content' && method === 'GET') {
    if (!authenticated) {
      return send(req, res, 401, JSON.stringify({ ok: false, message: 'Sesion no valida' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
    }
    return send(req, res, 200, JSON.stringify({ ok: true, content: readContent() }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
  }

  if (pathname === '/api/content' && method === 'POST') {
    if (!authenticated) {
      return send(req, res, 401, JSON.stringify({ ok: false, message: 'Sesion no valida' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
    }
    try {
      const raw = await readBody(req);
      const payload = JSON.parse(raw || '{}');
      const section = String(payload.section || '').trim();
      if (!section) {
        return send(req, res, 400, JSON.stringify({ ok: false, message: 'Seccion requerida' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
      }
      const content = payload.reset ? resetSection(section) : updateSection(section, payload.data);
      return send(req, res, 200, JSON.stringify({ ok: true, content, section, data: content[section] }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
    } catch (err) {
      return send(req, res, 400, JSON.stringify({ ok: false, message: 'No se pudo guardar la seccion solicitada' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
    }
  }

  if (isAdminPath(pathname) && !authenticated) {
    const next = sanitizeNext(pathname);
    res.writeHead(302, buildSecurityHeaders(req, { Location: `/login.html?next=${encodeURIComponent(next)}` }));
    return res.end();
  }

  const noStoreHtml = pathname === '/login.html' || /^\/admin(?:-[a-z0-9-]+)?\.html$/i.test(pathname);
  const filePath = safePath(pathname);
  if (!filePath) return send(req, res, 403, 'Acceso denegado');

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) return send(req, res, 404, 'No encontrado');
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    fs.readFile(filePath, (readErr, data) => {
      if (readErr) return send(req, res, 500, 'Error interno');
      send(req, res, 200, data, type, noStoreHtml ? { 'Cache-Control': 'no-store' } : {});
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Servidor listo en http://${HOST}:${PORT}`);
  console.log('Credenciales CMS desde variables de entorno CMS_USER y CMS_PASS.');
});
