// functions/tribute-submit.js
// Live at /api/tribute-submit
// Receives a tribute wall submission and stores it in the site database
// as a pending row, awaiting moderation before it appears publicly.

const MAX_NAME_LEN = 80;
const MAX_QUOTE_LEN = 500;

function json(status, body) {
  return {
    status,
    headers: { "content-type": "application/json" },
    body,
  };
}

export default async (request, { db }) => {
  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed" });
  }

  let body = request.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }
  body = body || {};

  const displayName = typeof body.display_name === "string" ? body.display_name.trim() : "";
  const quoteText = typeof body.quote_text === "string" ? body.quote_text.trim() : "";

  if (!displayName || !quoteText) {
    return json(400, {
      error: "display_name and quote_text are required",
      debug: { bodyType: typeof request.body, receivedKeys: body && typeof body === "object" ? Object.keys(body) : null },
    });
  }
  if (displayName.length > MAX_NAME_LEN) {
    return json(400, { error: `display_name must be ${MAX_NAME_LEN} characters or fewer` });
  }
  if (quoteText.length > MAX_QUOTE_LEN) {
    return json(400, { error: `quote_text must be ${MAX_QUOTE_LEN} characters or fewer` });
  }

  await db.run(
    "INSERT INTO tributes (display_name, quote_text, status, source) VALUES (?, ?, 'pending', 'form')",
    [displayName, quoteText]
  );

  return json(200, { ok: true, message: "Thank you. Your tribute will appear after a quick review." });
};
