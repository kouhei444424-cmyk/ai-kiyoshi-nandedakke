const MAX_PATHS_PER_REQUEST = 50;
const ARTICLE_PATH_PATTERN = /^\/articles\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/;
const BOT_USER_AGENT_PATTERN =
  /bot|crawler|spider|slurp|preview|facebookexternalhit|twitterbot|linkedinbot|discordbot|whatsapp|curl|wget/i;

function normalizeCountedPath(value) {
  if (typeof value !== "string") {
    return null;
  }

  const path = value.trim();

  if (path === "/" || ARTICLE_PATH_PATTERN.test(path)) {
    return path;
  }

  return null;
}

function jsonResponse(body, status = 200) {
  return Response.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function isLikelyBot(request) {
  const userAgent = request.headers.get("User-Agent") ?? "";
  return BOT_USER_AGENT_PATTERN.test(userAgent);
}

async function readCount(database, path) {
  const row = await database
    .prepare("SELECT views FROM page_views WHERE path = ?1")
    .bind(path)
    .first();

  return Number(row?.views ?? 0);
}

export async function onRequestGet(context) {
  const database = context.env.VIEW_DB;

  if (!database) {
    return jsonResponse({ error: "View counter is not configured." }, 503);
  }

  const url = new URL(context.request.url);
  const paths = [
    ...new Set(
      url.searchParams
        .getAll("path")
        .map(normalizeCountedPath)
        .filter(Boolean),
    ),
  ].slice(0, MAX_PATHS_PER_REQUEST);

  if (paths.length === 0) {
    return jsonResponse({ counts: {} });
  }

  const placeholders = paths.map(() => "?").join(", ");
  const result = await database
    .prepare(
      `SELECT path, views FROM page_views WHERE path IN (${placeholders})`,
    )
    .bind(...paths)
    .all();

  const counts = Object.fromEntries(paths.map((path) => [path, 0]));

  for (const row of result.results ?? []) {
    counts[row.path] = Number(row.views ?? 0);
  }

  return jsonResponse({ counts });
}

export async function onRequestPost(context) {
  const { request } = context;
  const database = context.env.VIEW_DB;

  if (!database) {
    return jsonResponse({ error: "View counter is not configured." }, 503);
  }

  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin");
  const fetchSite = request.headers.get("Sec-Fetch-Site");

  if (
    (origin && origin !== requestUrl.origin) ||
    (fetchSite && !["same-origin", "same-site", "none"].includes(fetchSite))
  ) {
    return jsonResponse({ error: "Cross-site requests are not allowed." }, 403);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON body." }, 400);
  }

  const path = normalizeCountedPath(body?.path);

  if (!path) {
    return jsonResponse({ error: "Unsupported page path." }, 400);
  }

  if (isLikelyBot(request)) {
    const count = await readCount(database, path);
    return jsonResponse({ path, count, counted: false });
  }

  await database
    .prepare(
      `INSERT INTO page_views (path, views, updated_at)
       VALUES (?1, 1, CURRENT_TIMESTAMP)
       ON CONFLICT(path) DO UPDATE SET
         views = views + 1,
         updated_at = CURRENT_TIMESTAMP`,
    )
    .bind(path)
    .run();

  const count = await readCount(database, path);

  return jsonResponse({ path, count, counted: true });
}

