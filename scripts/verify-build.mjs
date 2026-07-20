import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const dist = join(root, "dist");
const removedSlugs = [
  "doryoku-wa-erai",
  "hatarakanai-to-dame",
  "rule-wa-mamoru",
];
const requiredFiles = [
  "index.html",
  "articles/index.html",
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
const rssXml = await readFile(join(dist, "rss.xml"), "utf8");
const redirects = await readFile(join(dist, "_redirects"), "utf8");

if (!homeHtml.includes("まだ、問いはありません。")) {
  throw new Error("トップページに0記事時の表示がありません。");
}

if (!archiveHtml.includes("まだ、問いはありません。")) {
  throw new Error("記事一覧に0記事時の表示がありません。");
}

if (rssXml.includes("<item>")) {
  throw new Error("RSSに削除した仮記事が残っています。");
}

for (const slug of removedSlugs) {
  if (!redirects.includes(`/articles/${slug}/ /articles/ 302`)) {
    throw new Error(`${slug}: 削除済み記事の転送設定がありません。`);
  }
}

console.log("Build verification passed: 0 articles, empty states, RSS and sitemap.");
