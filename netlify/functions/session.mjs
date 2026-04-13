import { getSession } from './_lib/auth.mjs';

export default async function handler(request) {
  let session = null;
  try {
    session = getSession(request);
  } catch {
    return new Response(JSON.stringify({ ok: false, message: 'CMS no configurado' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  }
  return new Response(JSON.stringify({
    ok: true,
    authenticated: Boolean(session),
    username: session ? session.username : null
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}
