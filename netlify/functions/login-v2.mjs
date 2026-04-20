import { buildCookie, createToken } from './_lib/auth.mjs';

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
  const expectedUser = process.env.CMS_USER || '';
  const expectedPass = process.env.CMS_PASS || '';

  if (!expectedUser || !expectedPass) {
    return json({ ok: false, message: 'CMS no configurado' }, 500);
  }

  if (username !== expectedUser || password !== expectedPass) {
    return json({ ok: false, message: 'Credenciales invalidas' }, 401);
  }

  const token = createToken(username);
  return json(
    { ok: true, redirect: sanitizeNext(body.next) },
    200,
    { 'Set-Cookie': buildCookie(token, request) }
  );
}
