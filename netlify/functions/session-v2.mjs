import { getSession } from './_lib/auth.mjs';

export default async function handler(request) {
  const session = getSession(request);
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
