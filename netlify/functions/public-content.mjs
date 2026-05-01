import { readContent } from './_lib/content-store.mjs';

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    }
  });
}

export default async function handler() {
  const content = await readContent();
  if (content && content.quote && typeof content.quote === 'object') {
    const publicQuote = JSON.parse(JSON.stringify(content.quote));
    delete publicQuote.destinationEmail;
    content.quote = publicQuote;
  }
  return json({ ok: true, content });
}
