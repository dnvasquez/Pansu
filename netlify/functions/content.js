const { readContent, updateSection, resetSection } = require('./_lib/content-store');
const { getSession } = require('./_lib/auth');

function json(statusCode, payload) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    },
    body: JSON.stringify(payload)
  };
}

exports.handler = async function (event) {
  if (event.httpMethod === 'GET') {
    let session = null;
    try {
      session = getSession(event);
    } catch (err) {
      return json(500, { ok: false, message: 'CMS no configurado' });
    }
    if (!session) {
      return json(401, { ok: false, message: 'Sesion no valida' });
    }
    const content = await readContent();
    return json(200, { ok: true, content });
  }

  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, message: 'Metodo no permitido' });
  }

  let session = null;
  try {
    session = getSession(event);
  } catch (err) {
    return json(500, { ok: false, message: 'CMS no configurado' });
  }
  if (!session) {
    return json(401, { ok: false, message: 'Sesion no valida' });
  }

  let body = {};
  try {
    body = JSON.parse(event.body || '{}');
  } catch (err) {
    return json(400, { ok: false, message: 'JSON invalido' });
  }

  const section = String(body.section || '').trim();
  if (!section) {
    return json(400, { ok: false, message: 'Seccion requerida' });
  }

  try {
    const content = body.reset ? await resetSection(section) : await updateSection(section, body.data);
    return json(200, { ok: true, content, section: section, data: content[section] });
  } catch (err) {
    return json(400, { ok: false, message: 'No se pudo guardar la seccion solicitada' });
  }
};
