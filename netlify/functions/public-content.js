const { readContent } = require('./_lib/content-store');

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

exports.handler = async function () {
  const content = await readContent();
  if (content && content.quote && typeof content.quote === 'object') {
    const publicQuote = JSON.parse(JSON.stringify(content.quote));
    delete publicQuote.destinationEmail;
    content.quote = publicQuote;
  }
  return json(200, { ok: true, content });
};
