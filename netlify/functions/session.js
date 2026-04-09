const { getSession } = require('./_lib/auth');

exports.handler = async function (event) {
  const session = getSession(event);
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify({
      ok: true,
      authenticated: Boolean(session),
      username: session ? session.username : null
    })
  };
};
