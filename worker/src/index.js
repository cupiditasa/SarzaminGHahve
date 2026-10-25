const ALLOWED_ORIGINS = new Set([
  "https://sarzaminghahve.ir",
  "https://www.sarzaminghahve.ir",
  "https://cupiditasa.github.io"
]);

function response(request, data, status = 200) {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "Vary": "Origin"
  });
  const origin = request.headers.get("Origin");
  if (ALLOWED_ORIGINS.has(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type");
    headers.set("Access-Control-Max-Age", "86400");
  }
  return new Response(JSON.stringify(data), { status, headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/health" && request.method === "GET") {
      return Response.json({ ok: true, service: "sarzamin-visit-counter" });
    }

    if (url.pathname !== "/api/visits") {
      return response(request, { error: "not_found" }, 404);
    }

    const origin = request.headers.get("Origin");
    if (!ALLOWED_ORIGINS.has(origin)) {
      return response(request, { error: "origin_not_allowed" }, 403);
    }

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          "Vary": "Origin"
        }
      });
    }

    try {
      if (request.method === "GET") {
        const row = await env.DB.prepare(
          "SELECT total FROM site_visits WHERE id = 'home' LIMIT 1"
        ).first();
        if (!row) return response(request, { error: "counter_not_initialized" }, 503);
        return response(request, { total: row.total });
      }

      if (request.method === "POST") {
        const row = await env.DB.prepare(
          "UPDATE site_visits SET total = total + 1 WHERE id = 'home' RETURNING total"
        ).first();
        if (!row) return response(request, { error: "counter_not_initialized" }, 503);
        return response(request, { total: row.total });
      }

      return response(request, { error: "method_not_allowed" }, 405);
    } catch {
      return response(request, { error: "counter_unavailable" }, 503);
    }
  }
};
