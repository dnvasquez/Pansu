const { buildExpiredCookie } = require('./_lib/auth');

exports.handler = async function () {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'Set-Cookie': buildExpiredCookie()
    },
    body: JSON.stringify({ ok: true })
  };
};
