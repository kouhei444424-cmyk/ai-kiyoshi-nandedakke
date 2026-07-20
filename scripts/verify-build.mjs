import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const dist = join(root, "dist");
const firstArticleSlug = "hito-wa-nande-nagutte-wa-ikenai";
const removedSlugs = [
  "doryoku-wa-erai",
  "hatarakanai-to-dame",
  "rule-wa-mamoru",
];
const requiredFiles = [
  "index.html",
  "articles/index.html",
  `articles/${firstArticleSlug}/index.html`,
  "about/index.html",
  "rss.xml",
  "robots.txt",
  "sitemap-index.xml",
  "og.png",
  "_redirects",
];

for (const relativePath of requiredFiles) {
  await access(join(dist, relativePath));
}

for (const slug of removedSlugs) {
  try {
    await access(join(dist, "articles", slug, "index.html"));
    throw new Error(`${slug}: 削除した仮記事が出力に残っています。`);
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !("code" in error) ||
      error.code !== "ENOENT"
    ) {
      throw error;
    }
  }
}

const homeHtml = await readFile(join(dist, "index.html"), "utf8");
const archiveHtml = await readFile(join(dist, "articles", "index.html"), "utf8");
const articleHtml = await readFile(
  join(dist, "articles", firstArticleSlug, "index.html"),
  "utf8",
);
const rssXml = await readFile(join(dist, "rss.xml"), "utf8");
const redirects = await readFile(join(dist, "_redirects"), "utf8");

if (!homeHtml.includes("人をなんで殴っちゃいけないんだっけ。")) {
  throw new Error("トップページに一本目の記事がありません。");
}

if (!archiveHtml.includes("人をなんで殴っちゃいけないんだっけ。")) {
  throw new Error("記事一覧に一本目の記事がありません。");
}

if (!rssXml.includes("<item>") || !rssXml.includes(firstArticleSlug)) {
  throw new Error("RSSに一本目の記事がありません。");
}

if (
  articleHtml.includes("康平") ||
  articleHtml.includes("山口") ||
  articleHtml.includes("AIきよし")
) {
  throw new Error("記事に個人名または不要な人格名が残っています。");
}

if (
  !articleHtml.includes("人類は、この雑なゲームに飽きた。") ||
  !articleHtml.includes("暴力を、面倒な手続きのいちばん奥に隠したことだ。")
) {
  throw new Error("新しい文体の記事本文が出力されていません。");
}

if (
  !articleHtml.includes("FANZAトップへ") ||
  !articleHtml.includes("考えるのが疲れたら行ってらっしゃい。") ||
  !articleHtml.includes("18歳未満の方は閲覧できません。") ||
  !articleHtml.includes("https://www.dmm.co.jp/top/")
) {
  throw new Error("記事末尾の18禁表記または通常リンクがありません。");
}

for (const slug of removedSlugs) {
  if (!redirects.includes(`/articles/${slug}/ /articles/ 302`)) {
    throw new Error(`${slug}: 削除済み記事の転送設定がありません。`);
  }
}

console.log(
  "Build verification passed: 1 anonymous article, adult notice, RSS and sitemap.",
);
