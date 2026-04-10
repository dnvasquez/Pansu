import { buildExpiredCookie } from './_lib/auth.mjs';

export default async function handler() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Set-Cookie': buildExpiredCookie()
    }
  });
}
