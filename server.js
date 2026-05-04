const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const HOST = process.env.HOST || '0.0.0.0';
const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    raw.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      const idx = trimmed.indexOf('=');
      if (idx === -1) return;
      const key = trimmed.slice(0, idx).trim();
      const value = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
      if (key && typeof process.env[key] === 'undefined') {
        process.env[key] = value;
      }
    });
  } catch (err) {}
}

loadEnvFile(path.join(ROOT, '.env.local'));
loadEnvFile(path.join(ROOT, '.env'));

const CMS_USER = process.env.CMS_USER || '';
const CMS_PASS = process.env.CMS_PASS || '';
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const DEFAULTS_PATH = path.join(ROOT, 'data', 'default-content.json');
const LOCAL_CONTENT_PATH = path.join(ROOT, 'data', 'local-content.json');
const QUOTE_SUBMISSIONS_PATH = path.join(ROOT, 'data', 'quote-submissions.json');
const AUDIT_LOG_PATH = path.join(ROOT, 'data', 'security-audit.log');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SAFE_HREF_RE = /^(?:https?:|mailto:|tel:|#|\/(?!\/))/i;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const QUOTE_WINDOW_MS = 10 * 60 * 1000;
const QUOTE_MAX_ATTEMPTS = 5;
const CSRF_SECRET = String(
  process.env.CMS_CSRF_SECRET || process.env.CMS_PASS || 'pansu-csrf-secret'
).trim();

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
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': [
      "default-src 'self'",
      "base-uri 'self'",
      "frame-ancestors 'none'",
      "object-src 'none'",
      "form-action 'self'",
      "script-src 'self' https://cdn.jsdelivr.net",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
      "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com data:",
      "img-src 'self' data: https://www.google.com https://maps.gstatic.com https://maps.googleapis.com",
      "frame-src https://www.google.com",
      "connect-src 'self'"
    ].join('; ')
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

function getCsrfToken(sessionToken) {
  if (!sessionToken) return null;
  return crypto.createHmac('sha256', CSRF_SECRET).update(sessionToken).digest('hex');
}

function isValidCsrfToken(sessionToken, token) {
  const expected = getCsrfToken(sessionToken);
  if (!expected || !token) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(String(token)));
  } catch (err) {
    return false;
  }
}

function appendAuditLog(event, details = {}) {
  const entry = Object.assign({
    timestamp: new Date().toISOString(),
    event: String(event || 'unknown')
  }, details);
  const line = JSON.stringify(entry);
  try {
    fs.appendFileSync(AUDIT_LOG_PATH, line + '\n', 'utf8');
  } catch (err) {}
  console.log('[audit] ' + line);
}

function readQuoteSubmissions() {
  if (!fs.existsSync(QUOTE_SUBMISSIONS_PATH)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(QUOTE_SUBMISSIONS_PATH, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    return [];
  }
}

function writeQuoteSubmissions(submissions) {
  fs.writeFileSync(QUOTE_SUBMISSIONS_PATH, JSON.stringify(submissions, null, 2), 'utf8');
  return submissions;
}

function appendQuoteSubmission(submission) {
  const current = readQuoteSubmissions();
  current.unshift(submission);
  return writeQuoteSubmissions(current.slice(0, 200));
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
    'Tipo de solicitud: ' + data.quote_type,
    'Consentimiento privacidad: ' + (data.privacy_consent ? 'Aceptado' : 'No informado')
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
        appendAuditLog('login_blocked', { ip, reason: 'rate_limited' });
        return send(req, res, 429, JSON.stringify({ ok: false, message: 'Demasiados intentos. Intenta nuevamente más tarde.' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
      }
      const raw = await readBody(req);
      const payload = JSON.parse(raw || '{}');
      const username = String(payload.username || '');
      const password = String(payload.password || '');
      const next = sanitizeNext(String(payload.next || '/admin-header.html'));

      const passwordOk = username === CMS_USER && password === CMS_PASS;

      if (passwordOk) {
        clearLoginAttempts(ip);
        const token = createSession();
        const csrfToken = getCsrfToken(token);
        const maxAgeSec = Math.floor(SESSION_TTL_MS / 1000);
        const secureCookie = req.headers['x-forwarded-proto'] === 'https' || req.headers['X-Forwarded-Proto'] === 'https';
        res.setHeader(
          'Set-Cookie',
          `cms_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secureCookie ? '; Secure' : ''}`
        );
        appendAuditLog('login_success', { ip, username });
        return send(req, res, 200, JSON.stringify({ ok: true, redirect: next, csrfToken }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
      }

      registerLoginFailure(ip);
      appendAuditLog('login_failed', {
        ip,
        username,
        reason: 'invalid_credentials'
      });
      return send(req, res, 401, JSON.stringify({ ok: false, message: 'Credenciales invalidas' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
    } catch (err) {
      return send(req, res, 400, JSON.stringify({ ok: false, message: 'Solicitud invalida' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
    }
  }

  if (pathname === '/api/logout' && method === 'POST') {
    if (!isValidCsrfToken(sessionToken, req.headers['x-csrf-token'])) {
      appendAuditLog('logout_blocked', { ip: getClientIp(req), reason: 'csrf_invalid' });
      return send(req, res, 403, JSON.stringify({ ok: false, message: 'Token CSRF invalido' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
    }
    clearSession(sessionToken);
    appendAuditLog('logout', { ip: getClientIp(req) });
    res.setHeader('Set-Cookie', 'cms_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    return send(req, res, 200, JSON.stringify({ ok: true }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
  }

  if (pathname === '/api/session' && method === 'GET') {
    return send(req, res, 200, JSON.stringify({ authenticated, csrfToken: authenticated ? getCsrfToken(sessionToken) : null }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
  }

  if (pathname === '/api/public-content' && method === 'GET') {
    return send(req, res, 200, JSON.stringify({ ok: true, content: readPublicContent() }), 'application/json; charset=utf-8', { 'Cache-Control': 'public, max-age=60' });
  }

  if (pathname === '/api/quote-submit' && method === 'POST') {
    try {
      const ip = getClientIp(req);
      if (isQuoteRateLimited(ip)) {
        appendAuditLog('quote_blocked', { ip, reason: 'rate_limited' });
        return send(req, res, 429, JSON.stringify({ ok: false, message: 'Demasiadas solicitudes. Intenta nuevamente mas tarde.' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
      }

      const raw = await readBody(req);
      const payload = JSON.parse(raw || '{}');
      const fullName = String(payload.full_name || '').trim().slice(0, 120);
      const region = String(payload.region || '').trim().slice(0, 80);
      const comuna = String(payload.comuna || '').trim().slice(0, 80);
      const contactEmail = String(payload.contact_email || '').trim().slice(0, 120);
      const contactPhone = String(payload.contact_phone || '').trim().slice(0, 40);
      const quoteType = String(payload.quote_type || '').trim().slice(0, 40);
      const privacyConsent = String(payload.privacy_consent || '').trim();
      const honeypot = String(payload.website || '').trim();
      const consentAccepted = /^(1|true|yes|on)$/i.test(privacyConsent);

      if (honeypot) {
        appendAuditLog('quote_spam', {
          ip,
          userAgent: String(req.headers['user-agent'] || '').slice(0, 200)
        });
        return send(req, res, 200, JSON.stringify({ ok: true }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
      }

      if (!fullName || !region || !comuna || !contactEmail || !contactPhone || !quoteType) {
        return send(req, res, 400, JSON.stringify({ ok: false, message: 'Completa todos los campos para enviar la solicitud.' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
      }
      if (!EMAIL_RE.test(contactEmail)) {
        return send(req, res, 400, JSON.stringify({ ok: false, message: 'Debes ingresar un correo valido.' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
      }
      if (!consentAccepted) {
        return send(req, res, 400, JSON.stringify({ ok: false, message: 'Debes aceptar la politica de privacidad para enviar la solicitud.' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
      }
      if (!/^(Residencia|Comercial)$/i.test(quoteType)) {
        return send(req, res, 400, JSON.stringify({ ok: false, message: 'Tipo de solicitud invalido' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
      }

      const content = readContent();
      const quote = content.quote && typeof content.quote === 'object' ? content.quote : {};
      const destinationEmail = String(quote.destinationEmail || '').trim();
      const enabledRegions = Array.isArray(quote.enabledRegions) ? quote.enabledRegions : [];
      const notificationEmail = EMAIL_RE.test(destinationEmail) ? destinationEmail : '';
      if (destinationEmail && !notificationEmail) {
        appendAuditLog('quote_config_warning', { ip, reason: 'invalid_notification_email' });
      }
      if (enabledRegions.length && enabledRegions.indexOf(region) === -1) {
        return send(req, res, 400, JSON.stringify({ ok: false, message: 'La region seleccionada no esta habilitada' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
      }
      const submission = {
        id: crypto.randomUUID(),
        receivedAt: new Date().toISOString(),
        status: 'stored',
        fullName,
        region,
        comuna,
        contactEmail,
        contactPhone,
        quoteType,
        privacyConsent: true,
        notificationEmail,
        ip,
        userAgent: String(req.headers['user-agent'] || '').slice(0, 200),
        referer: String(req.headers.referer || '').slice(0, 200),
        summary: buildQuoteBody({
          full_name: fullName,
          region,
          comuna,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          quote_type: quoteType,
          privacy_consent: true
        })
      };

      appendQuoteSubmission(submission);
      appendAuditLog('quote_received', {
        ip,
        submissionId: submission.id,
        region,
        quoteType
      });
      clearQuoteAttempts(ip);
      return send(req, res, 200, JSON.stringify({ ok: true, submissionId: submission.id, message: 'Solicitud recibida correctamente.' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
    } catch (err) {
      appendAuditLog('quote_error', { ip: getClientIp(req), message: String(err && err.message || 'error').slice(0, 120) });
      registerQuoteFailure(getClientIp(req));
      return send(req, res, 400, JSON.stringify({ ok: false, message: 'Solicitud invalida' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
    }
  }

  if (pathname === '/api/quote-submissions' && method === 'GET') {
    if (!authenticated) {
      return send(req, res, 401, JSON.stringify({ ok: false, message: 'Sesion no valida' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
    }
    const submissions = readQuoteSubmissions().slice(0, 50);
    return send(req, res, 200, JSON.stringify({ ok: true, submissions }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
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
    if (!isValidCsrfToken(sessionToken, req.headers['x-csrf-token'])) {
      appendAuditLog('content_blocked', { ip: getClientIp(req), reason: 'csrf_invalid' });
      return send(req, res, 403, JSON.stringify({ ok: false, message: 'Token CSRF invalido' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
    }
    try {
      const raw = await readBody(req);
      const payload = JSON.parse(raw || '{}');
      const section = String(payload.section || '').trim();
      if (!section) {
        return send(req, res, 400, JSON.stringify({ ok: false, message: 'Seccion requerida' }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
      }
      const content = payload.reset ? resetSection(section) : updateSection(section, payload.data);
      appendAuditLog(payload.reset ? 'content_reset' : 'content_saved', { ip: getClientIp(req), section });
      return send(req, res, 200, JSON.stringify({ ok: true, content, section, data: content[section] }), 'application/json; charset=utf-8', { 'Cache-Control': 'no-store' });
    } catch (err) {
      appendAuditLog('content_error', { ip: getClientIp(req), message: String(err && err.message || 'error').slice(0, 120) });
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
  console.log('Las solicitudes de cotizacion se almacenan en data/quote-submissions.json.');
});
