const { getSession } = require('./_lib/auth');

exports.handler = async function (event) {
  let session = null;
  try {
    session = getSession(event);
  } catch (err) {
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store'
      },
      body: JSON.stringify({ ok: false, message: 'CMS no configurado' })
    };
  }
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
