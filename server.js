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

const sessions = new Map();

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

function send(res, code, body, contentType = 'text/plain; charset=utf-8') {
  res.writeHead(code, { 'Content-Type': contentType });
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
  const cookies = parseCookies(req);
  const sessionToken = cookies.cms_session;
  const authenticated = isValidSession(sessionToken);

  if (pathname === '/api/login' && method === 'POST') {
    try {
      if (!CMS_USER || !CMS_PASS) {
        return send(res, 500, JSON.stringify({ ok: false, message: 'CMS no configurado' }), 'application/json; charset=utf-8');
      }
      const raw = await readBody(req);
      const payload = JSON.parse(raw || '{}');
      const username = String(payload.username || '');
      const password = String(payload.password || '');
      const next = sanitizeNext(String(payload.next || '/admin-header.html'));

      if (username === CMS_USER && password === CMS_PASS) {
        const token = createSession();
        const maxAgeSec = Math.floor(SESSION_TTL_MS / 1000);
        res.setHeader('Set-Cookie', `cms_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}`);
        return send(res, 200, JSON.stringify({ ok: true, redirect: next }), 'application/json; charset=utf-8');
      }

      return send(res, 401, JSON.stringify({ ok: false, message: 'Credenciales invalidas' }), 'application/json; charset=utf-8');
    } catch (err) {
      return send(res, 400, JSON.stringify({ ok: false, message: 'Solicitud invalida' }), 'application/json; charset=utf-8');
    }
  }

  if (pathname === '/api/logout' && method === 'POST') {
    clearSession(sessionToken);
    res.setHeader('Set-Cookie', 'cms_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
    return send(res, 200, JSON.stringify({ ok: true }), 'application/json; charset=utf-8');
  }

  if (pathname === '/api/session' && method === 'GET') {
    return send(res, 200, JSON.stringify({ authenticated }), 'application/json; charset=utf-8');
  }

  if (pathname === '/api/content' && method === 'GET') {
    return send(res, 200, JSON.stringify({ ok: true, content: readContent() }), 'application/json; charset=utf-8');
  }

  if (pathname === '/api/content' && method === 'POST') {
    if (!authenticated) {
      return send(res, 401, JSON.stringify({ ok: false, message: 'Sesion no valida' }), 'application/json; charset=utf-8');
    }
    try {
      const raw = await readBody(req);
      const payload = JSON.parse(raw || '{}');
      const section = String(payload.section || '').trim();
      if (!section) {
        return send(res, 400, JSON.stringify({ ok: false, message: 'Seccion requerida' }), 'application/json; charset=utf-8');
      }
      const content = payload.reset ? resetSection(section) : updateSection(section, payload.data);
      return send(res, 200, JSON.stringify({ ok: true, content, section, data: content[section] }), 'application/json; charset=utf-8');
    } catch (err) {
      return send(res, 400, JSON.stringify({ ok: false, message: 'No se pudo guardar la seccion solicitada' }), 'application/json; charset=utf-8');
    }
  }

  if (isAdminPath(pathname) && !authenticated) {
    const next = sanitizeNext(pathname);
    res.writeHead(302, { Location: `/login.html?next=${encodeURIComponent(next)}` });
    return res.end();
  }

  const filePath = safePath(pathname);
  if (!filePath) return send(res, 403, 'Acceso denegado');

  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) return send(res, 404, 'No encontrado');
    const ext = path.extname(filePath).toLowerCase();
    const type = MIME[ext] || 'application/octet-stream';
    fs.readFile(filePath, (readErr, data) => {
      if (readErr) return send(res, 500, 'Error interno');
      send(res, 200, data, type);
    });
  });
});

server.listen(PORT, HOST, () => {
  console.log(`Servidor listo en http://${HOST}:${PORT}`);
  console.log('Credenciales CMS desde variables de entorno CMS_USER y CMS_PASS.');
});
