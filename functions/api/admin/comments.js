import {
  MAX_ADMIN_PAGE_SIZE,
  checkAdminAuth,
  jsonResponse,
  normalizeArticlePath,
} from "../../_lib/comments.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const database = env.VIEW_DB;

  if (!database) {
    return jsonResponse({ error: "コメント機能は準備中です。" }, 503);
  }

  if (!(await checkAdminAuth(request, env))) {
    return jsonResponse({ error: "認証が必要です。" }, 401);
  }

  const url = new URL(request.url);
  const pathParam = url.searchParams.get("path");
  const path = pathParam ? normalizeArticlePath(pathParam) : null;

  if (pathParam && !path) {
    return jsonResponse({ error: "記事が見つかりません。" }, 400);
  }

  const statusParam = url.searchParams.get("status");
  const status = ["visible", "hidden"].includes(statusParam) ? statusParam : null;

  const requestedLimit = Number(url.searchParams.get("limit"));
  const limit =
    Number.isFinite(requestedLimit) && requestedLimit > 0
      ? Math.min(Math.floor(requestedLimit), MAX_ADMIN_PAGE_SIZE)
      : MAX_ADMIN_PAGE_SIZE;

  const requestedOffset = Number(url.searchParams.get("offset"));
  const offset =
    Number.isFinite(requestedOffset) && requestedOffset > 0
      ? Math.floor(requestedOffset)
      : 0;

  const conditions = [];
  const params = [];

  if (path) {
    conditions.push(`article_path = ?${params.length + 1}`);
    params.push(path);
  }

  if (status) {
    conditions.push(`status = ?${params.length + 1}`);
    params.push(status);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countStmt = database.prepare(
    `SELECT COUNT(*) as total FROM comments ${whereClause}`,
  );
  const listStmt = database.prepare(
    `SELECT id, article_path, nickname, body, status, created_at, updated_at
     FROM comments
     ${whereClause}
     ORDER BY created_at DESC, id DESC
     LIMIT ?${params.length + 1} OFFSET ?${params.length + 2}`,
  );

  const [countRow, listResult] = await Promise.all([
    countStmt.bind(...params).first(),
    listStmt.bind(...params, limit, offset).all(),
  ]);

  const total = Number(countRow?.total ?? 0);
  const comments = (listResult.results ?? []).map((row) => ({
    id: row.id,
    articlePath: row.article_path,
    nickname: row.nickname,
    body: row.body,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));

  return jsonResponse({ comments, total, hasMore: offset + comments.length < total });
}
