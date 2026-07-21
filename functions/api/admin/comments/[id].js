import { checkAdminAuth, isSameOrigin, jsonResponse } from "../../../_lib/comments.js";

const ID_PATTERN = /^[0-9a-f-]{36}$/i;

function isValidId(id) {
  return typeof id === "string" && ID_PATTERN.test(id);
}

export async function onRequestPatch(context) {
  const { request, env, params } = context;
  const database = env.VIEW_DB;

  if (!database) {
    return jsonResponse({ error: "コメント機能は準備中です。" }, 503);
  }

  if (!isSameOrigin(request)) {
    return jsonResponse({ error: "許可されていないリクエストです。" }, 403);
  }

  if (!(await checkAdminAuth(request, env))) {
    return jsonResponse({ error: "認証が必要です。" }, 401);
  }

  const id = params.id;

  if (!isValidId(id)) {
    return jsonResponse({ error: "コメントが見つかりません。" }, 404);
  }

  let payload;
  try {
    payload = await request.json();
  } catch {
    return jsonResponse({ error: "送信内容を確認できませんでした。" }, 400);
  }

  const action = payload?.action;

  if (action !== "show" && action !== "hide") {
    return jsonResponse({ error: "不正な操作です。" }, 400);
  }

  const status = action === "show" ? "visible" : "hidden";
  const nowIso = new Date().toISOString();

  const result = await database
    .prepare("UPDATE comments SET status = ?1, updated_at = ?2 WHERE id = ?3")
    .bind(status, nowIso, id)
    .run();

  if (!result.meta || result.meta.changes === 0) {
    return jsonResponse({ error: "コメントが見つかりません。" }, 404);
  }

  return jsonResponse({ id, status, updatedAt: nowIso });
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  const database = env.VIEW_DB;

  if (!database) {
    return jsonResponse({ error: "コメント機能は準備中です。" }, 503);
  }

  if (!isSameOrigin(request)) {
    return jsonResponse({ error: "許可されていないリクエストです。" }, 403);
  }

  if (!(await checkAdminAuth(request, env))) {
    return jsonResponse({ error: "認証が必要です。" }, 401);
  }

  const id = params.id;

  if (!isValidId(id)) {
    return jsonResponse({ error: "コメントが見つかりません。" }, 404);
  }

  const result = await database
    .prepare("DELETE FROM comments WHERE id = ?1")
    .bind(id)
    .run();

  if (!result.meta || result.meta.changes === 0) {
    return jsonResponse({ error: "コメントが見つかりません。" }, 404);
  }

  return jsonResponse({ id, deleted: true });
}
