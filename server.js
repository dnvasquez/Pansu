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

function sanitizeNext(nextValue) {
  if (!nextValue || typeof nextValue !== 'string') return '/admin.html';
  if (!nextValue.startsWith('/')) return '/admin.html';
  if (nextValue.startsWith('//')) return '/admin.html';
  if (/^\/admin(?:-[a-z0-9-]+)?\.html$/i.test(nextValue)) return nextValue;
  return '/admin.html';
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
      const next = sanitizeNext(String(payload.next || '/admin.html'));

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
