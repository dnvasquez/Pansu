const { createToken, buildCookie } = require('./_lib/auth');

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
  const next = String(nextValue || '/admin.html');
  if (!next.startsWith('/')) return '/admin.html';
  if (next.startsWith('//')) return '/admin.html';
  if (/^\/admin(?:-[a-z0-9-]+)?\.html$/i.test(next)) return next;
  return '/admin.html';
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
  const expectedUser = process.env.CMS_USER || 'admin';
  const expectedPass = process.env.CMS_PASS || '123456';

  if (username !== expectedUser || password !== expectedPass) {
    return json(401, { ok: false, message: 'Credenciales invalidas' });
  }

  const token = createToken(username);
  return json(
    200,
    { ok: true, redirect: sanitizeNext(body.next) },
    { 'Set-Cookie': buildCookie(token, event) }
  );
};
