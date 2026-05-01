import { readContent } from './_lib/content-store.mjs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const attempts = new Map();

function json(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

function getClientIp(request) {
  const forwarded = String(request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
  return forwarded || 'unknown';
}

function getState(ip) {
  const now = Date.now();
  const current = attempts.get(ip);
  if (!current || now > current.resetAt) {
    const fresh = { count: 0, resetAt: now + WINDOW_MS };
    attempts.set(ip, fresh);
    return fresh;
  }
  return current;
}

function isRateLimited(ip) {
  return getState(ip).count >= MAX_ATTEMPTS;
}

function recordFailure(ip) {
  const state = getState(ip);
  state.count += 1;
  state.resetAt = Math.max(state.resetAt, Date.now() + WINDOW_MS);
  attempts.set(ip, state);
}

function clearAttempts(ip) {
  if (ip) attempts.delete(ip);
}

function buildBody(data) {
  return [
    'Nueva solicitud de cotizacion',
    '',
    'Nombre y Apellidos: ' + data.full_name,
    'Region: ' + data.region,
    'Comuna: ' + data.comuna,
    'Correo de contacto: ' + data.contact_email,
    'Numero de telefono: ' + data.contact_phone,
    'Tipo de solicitud: ' + data.quote_type
  ].join('\n');
}

export default async function handler(request) {
  if (request.method !== 'POST') {
    return json(405, { ok: false, message: 'Metodo no permitido' });
  }

  try {
    const ip = getClientIp(request);
    if (isRateLimited(ip)) {
      return json(429, { ok: false, message: 'Demasiadas solicitudes. Intenta nuevamente mas tarde.' });
    }

    const body = await request.json();
    const fullName = String(body.full_name || '').trim();
    const region = String(body.region || '').trim();
    const comuna = String(body.comuna || '').trim();
    const contactEmail = String(body.contact_email || '').trim();
    const contactPhone = String(body.contact_phone || '').trim();
    const quoteType = String(body.quote_type || '').trim();

    if (!fullName || !region || !comuna || !contactEmail || !contactPhone || !quoteType) {
      return json(400, { ok: false, message: 'Completa todos los campos para enviar la solicitud.' });
    }
    if (!EMAIL_RE.test(contactEmail)) {
      return json(400, { ok: false, message: 'Debes ingresar un correo valido.' });
    }

    const content = await readContent();
    const quote = content && content.quote && typeof content.quote === 'object' ? content.quote : {};
    const destinationEmail = String(quote.destinationEmail || '').trim();
    const enabledRegions = Array.isArray(quote.enabledRegions) ? quote.enabledRegions : [];

    if (!EMAIL_RE.test(destinationEmail)) {
      return json(500, { ok: false, message: 'Configuracion de cotizacion invalida' });
    }
    if (enabledRegions.length && enabledRegions.indexOf(region) === -1) {
      return json(400, { ok: false, message: 'La region seleccionada no esta habilitada' });
    }

    const response = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(destinationEmail), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        _subject: 'Solicitud de cotizacion PANSU',
        _captcha: 'false',
        nombre_apellidos: fullName,
        region,
        comuna,
        correo_contacto: contactEmail,
        telefono_contacto: contactPhone,
        tipo_solicitud: quoteType,
        detalle: buildBody({
          full_name: fullName,
          region,
          comuna,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          quote_type: quoteType
        })
      })
    });

    if (!response.ok) {
      recordFailure(ip);
      return json(502, { ok: false, message: 'No se pudo enviar la solicitud en este momento.' });
    }

    clearAttempts(ip);
    return json(200, { ok: true });
  } catch {
    recordFailure(getClientIp(request));
    return json(400, { ok: false, message: 'Solicitud invalida' });
  }
}
