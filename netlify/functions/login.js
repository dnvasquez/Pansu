const { createToken, buildCookie, verifyTotp } = require('./_lib/auth');

const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const loginAttempts = new Map();

function json(statusCode, payload, extraHeaders) {
  return {
    statusCode,
    headers: Object.assign({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }, extraHeaders || {}),
    body: JSON.stringify(payload)
  };
}

function sanitizeNext(nextValue) {
  const next = String(nextValue || '/admin-header.html');
  if (!next.startsWith('/')) return '/admin-header.html';
  if (next.startsWith('//')) return '/admin-header.html';
  if (/^\/admin(?:-[a-z0-9-]+)?\.html$/i.test(next)) return next;
  return '/admin-header.html';
}

function getClientIp(event) {
  const headers = event.headers || {};
  const forwarded = String(headers['x-forwarded-for'] || headers['X-Forwarded-For'] || '').split(',')[0].trim();
  return forwarded || String(headers['x-nf-client-connection-ip'] || headers['X-Nf-Client-Connection-Ip'] || 'unknown');
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

function isRateLimited(ip) {
  return getLoginState(ip).count >= LOGIN_MAX_ATTEMPTS;
}

function registerFailure(ip) {
  const state = getLoginState(ip);
  state.count += 1;
  state.resetAt = Math.max(state.resetAt, Date.now() + LOGIN_WINDOW_MS);
  loginAttempts.set(ip, state);
}

function clearFailures(ip) {
  if (ip) loginAttempts.delete(ip);
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, message: 'Metodo no permitido' });
  }

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return json(400, { ok: false, message: 'Solicitud invalida' });
  }

  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  const otp = String(body.otp || '');
  const expectedUser = process.env.CMS_USER || '';
  const expectedPass = process.env.CMS_PASS || '';
  const otpSecret = String(process.env.CMS_OTP_SECRET || '').trim();
  const ip = getClientIp(event);

  if (!expectedUser || !expectedPass) {
    return json(500, { ok: false, message: 'CMS no configurado' });
  }

  if (isRateLimited(ip)) {
    return json(429, { ok: false, message: 'Demasiados intentos. Intenta nuevamente más tarde.' });
  }

  const passwordOk = username === expectedUser && password === expectedPass;
  const otpOk = !otpSecret || verifyTotp(otpSecret, otp);

  if (!passwordOk || !otpOk) {
    registerFailure(ip);
    if (passwordOk && otpSecret && !otpOk) {
      return json(401, { ok: false, message: 'Codigo de verificacion invalido' });
    }
    return json(401, { ok: false, message: 'Credenciales invalidas' });
  }

  clearFailures(ip);
  const token = createToken(username);
  return json(
    200,
    { ok: true, redirect: sanitizeNext(body.next) },
    { 'Set-Cookie': buildCookie(token, event) }
  );
};
