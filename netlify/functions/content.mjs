import { getSession } from './_lib/auth.mjs';
import { readContent, updateSection, resetSection } from './_lib/content-store.mjs';

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

export default async function handler(request) {
  if (request.method === 'GET') {
    const content = await readContent();
    return json({ ok: true, content });
  }

  if (request.method !== 'POST') {
    return json({ ok: false, message: 'Metodo no permitido' }, 405);
  }

  const session = getSession(request);
  if (!session) {
    return json({ ok: false, message: 'Sesion no valida' }, 401);
  }

  let body = {};
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, message: 'JSON invalido' }, 400);
  }

  const section = String(body.section || '').trim();
  if (!section) {
    return json({ ok: false, message: 'Seccion requerida' }, 400);
  }

  try {
    const content = body.reset ? await resetSection(section) : await updateSection(section, body.data);
    return json({ ok: true, content, section, data: content[section] });
  } catch {
    return json({ ok: false, message: 'No se pudo guardar la seccion solicitada' }, 400);
  }
}
