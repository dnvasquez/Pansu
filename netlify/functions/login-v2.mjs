import { buildCookie, createToken, normalizeOtp, verifyTotp } from './_lib/auth.mjs';

const LOGIN_WINDOW_MS = 10 * 60 * 1000;
const LOGIN_MAX_ATTEMPTS = 5;
const loginAttempts = new Map();

function getClientIp(request) {
  const forwarded = String(request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  return forwarded || 'unknown';
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
}

function clearLoginAttempts(ip) {
  if (ip) loginAttempts.delete(ip);
}

function json(payload, status = 200, headers = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: Object.assign({
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }, headers)
  });
}

function sanitizeNext(nextValue) {
  const next = String(nextValue || '/admin-header.html');
  if (!next.startsWith('/')) return '/admin-header.html';
  if (next.startsWith('//')) return '/admin-header.html';
  if (/^\/admin(?:-[a-z0-9-]+)?\.html$/i.test(next)) return next;
  return '/admin-header.html';
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return json({ ok: false, message: 'Metodo no permitido' }, 405);
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: 'Solicitud invalida' }, 400);
  }

  const username = String(body.username || '').trim();
  const password = String(body.password || '');
  const otp = normalizeOtp(body.otp || '');
  const expectedUser = process.env.CMS_USER || '';
  const expectedPass = process.env.CMS_PASS || '';
  const otpSecret = String(process.env.CMS_OTP_SECRET || '').trim();
  const ip = getClientIp(request);

  if (!expectedUser || !expectedPass) {
    return json({ ok: false, message: 'CMS no configurado' }, 500);
  }

  if (isLoginRateLimited(ip)) {
    return json({ ok: false, message: 'Demasiados intentos. Intenta nuevamente mas tarde.' }, 429);
  }

  const passwordOk = username === expectedUser && password === expectedPass;
  const otpOk = !otpSecret || verifyTotp(otpSecret, otp);

  if (!passwordOk || !otpOk) {
    registerLoginFailure(ip);
    if (passwordOk && otpSecret && !otpOk) {
      return json({ ok: false, message: 'Codigo de verificacion invalido' }, 401);
    }
    return json({ ok: false, message: 'Credenciales invalidas' }, 401);
  }

  clearLoginAttempts(ip);
  const token = createToken(username);
  return json(
    { ok: true, redirect: sanitizeNext(body.next) },
    200,
    { 'Set-Cookie': buildCookie(token, request) }
  );
}
