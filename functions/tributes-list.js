// functions/tributes-list.js
// Live at /api/tributes-list
// Returns approved tributes for the wall to render dynamically. Whatever
// is 'approved' in the database is what shows on the site — approving or
// editing a row here changes the live page on next load, no redeploy.

export default async (request, { db }) => {
  if (request.method !== "GET") {
    return {
      status: 405,
      headers: { "content-type": "application/json" },
      body: { error: "Method not allowed" },
    };
  }

  const rows = await db.all(
    "SELECT id, display_name, quote_text, image_url FROM tributes WHERE status = 'approved' ORDER BY id ASC LIMIT 60"
  );

  return {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
    body: { tributes: rows },
  };
};
