import {
  MAX_BODY_LENGTH,
  MAX_NICKNAME_LENGTH,
  MAX_PUBLIC_PAGE_SIZE,
  MAX_REQUEST_BYTES,
  PUBLIC_PAGE_SIZE,
  RATE_LIMIT_HOURLY_MAX,
  RATE_LIMIT_HOURLY_WINDOW_MS,
  RATE_LIMIT_MIN_INTERVAL_MS,
  codePointLength,
  containsUrl,
  hashSubmitter,
  isSameOrigin,
  jsonResponse,
  normalizeArticlePath,
  readNickname,
  sanitizePlainText,
  serializeComment,
  verifyTurnstile,
} from "../_lib/comments.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const database = env.VIEW_DB;

  if (!database) {
    return jsonResponse({ error: "コメント機能は準備中です。" }, 503);
  }

  const url = new URL(request.url);
  const path = normalizeArticlePath(url.searchParams.get("path"));

  if (!path) {
    return jsonResponse({ error: "記事が見つかりません。" }, 400);
  }

  const requestedLimit = Number(url.searchParams.get("limit"));
  const limit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(Math.floor(requestedLimit), MAX_PUBLIC_PAGE_SIZE)
      : PUBLIC_PAGE_SIZE;

  const requestedOffset = Number(url.searchParams.get("offset"));
  const offset =
    Number.isFinite(requestedOffset) && requestedOffset > 0
      ? Math.floor(requestedOffset)
      : 0;

  const [countRow, listResult] = await Promise.all([
    database
      .prepare(
        "SELECT COUNT(*) as total FROM comments WHERE article_path = ?1 AND status = 'visible'",
      )
      .bind(path)
      .first(),
    database
      .prepare(
        `SELECT id, nickname, body, created_at FROM comments
         WHERE article_path = ?1 AND status = 'visible'
         ORDER BY created_at DESC, id DESC
         LIMIT ?2 OFFSET ?3`,
      )
      .bind(path, limit, offset)
      .all(),
  ]);

  const total = Number(countRow?.total ?? 0);
  const comments = (listResult.results ?? []).map(serializeComment);
  const hasMore = offset + comments.length < total;

  return jsonResponse({ comments, total, hasMore });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const database = env.VIEW_DB;

  if (!database) {
    return jsonResponse({ error: "コメント機能は準備中です。" }, 503);
  }

  if (!isSameOrigin(request)) {
    return jsonResponse({ error: "許可されていないリクエストです。" }, 403);
  }

  const declaredLength = Number(request.headers.get("Content-Length") ?? 0);
  if (declaredLength > MAX_REQUEST_BYTES) {
    return jsonResponse({ error: "送信内容が大きすぎます。" }, 413);
  }

  let rawBody;
  try {
    rawBody = await request.text();
  } catch {
    return jsonResponse({ error: "リクエストを読み取れませんでした。" }, 400);
  }

  if (rawBody.length > MAX_REQUEST_BYTES) {
    return jsonResponse({ error: "送信内容が大きすぎます。" }, 413);
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ error: "送信内容を確認できませんでした。" }, 400);
  }

  if (!payload || typeof payload !== "object") {
    return jsonResponse({ error: "送信内容を確認できませんでした。" }, 400);
  }

  // Honeypot: a hidden field real users never fill in.
  if (typeof payload.website === "string" && payload.website.trim().length > 0) {
    return jsonResponse({ error: "送信できませんでした。" }, 400);
  }

  const path = normalizeArticlePath(payload.path);
  if (!path) {
    return jsonResponse({ error: "記事が見つかりません。" }, 400);
  }

  const nickname = readNickname(payload.nickname);
  if (codePointLength(nickname) > MAX_NICKNAME_LENGTH) {
    return jsonResponse(
      { error: `ニックネームは${MAX_NICKNAME_LENGTH}文字までです。`, field: "nickname" },
      400,
    );
  }

  const body = sanitizePlainText(payload.body);
  if (body.length === 0) {
    return jsonResponse({ error: "コメントを入力してください。", field: "body" }, 400);
  }
  if (codePointLength(body) > MAX_BODY_LENGTH) {
    return jsonResponse(
      { error: `コメントは${MAX_BODY_LENGTH}文字までです。`, field: "body" },
      400,
    );
  }
  if (containsUrl(body) || containsUrl(nickname)) {
    return jsonResponse({ error: "URLは投稿できません。", field: "body" }, 400);
  }

  const turnstileSecret = env.TURNSTILE_SECRET_KEY;
  if (!turnstileSecret) {
    return jsonResponse({ error: "コメント機能は準備中です。" }, 503);
  }

  const turnstileResult = await verifyTurnstile(
    turnstileSecret,
    payload.turnstileToken,
    request,
  );

  if (!turnstileResult.success) {
    const expired = turnstileResult.reason === "timeout-or-duplicate";
    return jsonResponse(
      {
        error: expired
          ? "確認の有効期限が切れました。もう一度お試しください。"
          : "認証を確認できませんでした。もう一度お試しください。",
        field: "turnstile",
      },
      400,
    );
  }

  const salt = env.COMMENT_HASH_SALT;
  if (!salt) {
    return jsonResponse({ error: "コメント機能は準備中です。" }, 503);
  }

  const submitterHash = await hashSubmitter(request, salt);
  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const minuteAgoIso = new Date(now - RATE_LIMIT_MIN_INTERVAL_MS).toISOString();
  const hourAgoIso = new Date(now - RATE_LIMIT_HOURLY_WINDOW_MS).toISOString();

  const [recentRow, hourlyRow] = await Promise.all([
    database
      .prepare(
        "SELECT COUNT(*) as recent FROM comments WHERE submitter_hash = ?1 AND created_at > ?2",
      )
      .bind(submitterHash, minuteAgoIso)
      .first(),
    database
      .prepare(
        "SELECT COUNT(*) as recent FROM comments WHERE submitter_hash = ?1 AND created_at > ?2",
      )
      .bind(submitterHash, hourAgoIso)
      .first(),
  ]);

  if (Number(recentRow?.recent ?? 0) > 0) {
    return jsonResponse({ error: "少し時間を置いてから、もう一度お試しください。" }, 429);
  }

  if (Number(hourlyRow?.recent ?? 0) >= RATE_LIMIT_HOURLY_MAX) {
    return jsonResponse({ error: "投稿が続いています。しばらく時間を置いてください。" }, 429);
  }

  const id = crypto.randomUUID();

  await database
    .prepare(
      `INSERT INTO comments (id, article_path, nickname, body, status, submitter_hash, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, 'visible', ?5, ?6, ?6)`,
    )
    .bind(id, path, nickname, body, submitterHash, nowIso)
    .run();

  return jsonResponse({ comment: { id, nickname, body, createdAt: nowIso } }, 201);
}
