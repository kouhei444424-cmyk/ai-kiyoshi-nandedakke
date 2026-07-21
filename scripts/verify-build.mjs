import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const dist = join(root, "dist");
const firstArticleSlug = "hito-wa-nande-nagutte-wa-ikenai";
const secondArticleSlug = "speeding";
const removedSlugs = [
  "doryoku-wa-erai",
  "hatarakanai-to-dame",
  "rule-wa-mamoru",
];
const requiredFiles = [
  "index.html",
  "articles/index.html",
  `articles/${firstArticleSlug}/index.html`,
  `articles/${secondArticleSlug}/index.html`,
  "about/index.html",
  "robots.txt",
  "sitemap-index.xml",
  "og.png",
  "_redirects",
];
const requiredSourceFiles = [
  "functions/api/views.js",
  "migrations/0001_page_views.sql",
];

for (const relativePath of requiredFiles) {
  await access(join(dist, relativePath));
}

for (const relativePath of requiredSourceFiles) {
  await access(join(root, relativePath));
}

try {
  await access(join(dist, "rss.xml"));
  throw new Error("削除したRSSが出力に残っています。");
} catch (error) {
  if (
    !(error instanceof Error) ||
    !("code" in error) ||
    error.code !== "ENOENT"
  ) {
    throw error;
  }
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
const speedingArticleHtml = await readFile(
  join(dist, "articles", secondArticleSlug, "index.html"),
  "utf8",
);
const redirects = await readFile(join(dist, "_redirects"), "utf8");

if (!homeHtml.includes("人をなんで殴っちゃいけないんだっけ。")) {
  throw new Error("トップページに一本目の記事がありません。");
}

if (!homeHtml.includes("スピード違反って、なんでしちゃいけないんだっけ。")) {
  throw new Error("トップページに二本目の記事がありません。");
}

if (
  !homeHtml.includes("通算訪問数") ||
  !homeHtml.includes('data-view-counter="/"') ||
  !homeHtml.includes('data-view-track="/"') ||
  !homeHtml.includes("data-view-counter-value")
) {
  throw new Error("トップページに通算訪問数カウンターがありません。");
}

if (homeHtml.includes('href="/rss.xml"')) {
  throw new Error("トップページに削除したRSSリンクが残っています。");
}

if (!archiveHtml.includes("人をなんで殴っちゃいけないんだっけ。")) {
  throw new Error("記事一覧に一本目の記事がありません。");
}

if (!archiveHtml.includes("スピード違反って、なんでしちゃいけないんだっけ。")) {
  throw new Error("記事一覧に二本目の記事がありません。");
}

if (
  !archiveHtml.includes(
    'data-view-counter="/articles/hito-wa-nande-nagutte-wa-ikenai/"',
  ) ||
  !archiveHtml.includes("View")
) {
  throw new Error("記事一覧に記事別の閲覧数表示がありません。");
}

if (
  articleHtml.includes("康平") ||
  articleHtml.includes("山口") ||
  articleHtml.includes("AIきよし")
) {
  throw new Error("記事に個人名または不要な人格名が残っています。");
}

if (
  speedingArticleHtml.includes("康平") ||
  speedingArticleHtml.includes("山口") ||
  speedingArticleHtml.includes("AIきよし")
) {
  throw new Error("二本目の記事に個人名または不要な人格名が残っています。");
}

if (
  !articleHtml.includes("読む前に、10秒だけ考えてみて。") ||
  articleHtml.includes("THINKING TIME / 10 SEC.") ||
  !articleHtml.includes("「痛いから」以外で。") ||
  !articleHtml.includes("人類は、この雑なゲームに飽きた。") ||
  !articleHtml.includes("暴力を、面倒な手続きのいちばん奥に隠したことだ。")
) {
  throw new Error("新しい文体の記事本文が出力されていません。");
}

if (articleHtml.includes('class="article__description"')) {
  throw new Error("記事ページに不要なサブタイトルが表示されています。");
}

if (speedingArticleHtml.includes('class="article__description"')) {
  throw new Error("二本目の記事ページに不要なサブタイトルが表示されています。");
}

if (
  !speedingArticleHtml.includes("読む前に、10秒だけ考えてみて。") ||
  !speedingArticleHtml.includes("速度差も怖い。絶対的な速さも怖い。") ||
  !speedingArticleHtml.includes("道路はオープンワールドだけど、NPCはいない。") ||
  !speedingArticleHtml.includes("周りの人が、その速度を前提にしていないからだ。") ||
  !speedingArticleHtml.includes("でも、たぶんまた変わる。")
) {
  throw new Error("二本目の記事本文が最終稿と一致しません。");
}

if (
  !articleHtml.includes(
    'data-view-track="/articles/hito-wa-nande-nagutte-wa-ikenai/"',
  ) ||
  !articleHtml.includes("article__views")
) {
  throw new Error("記事ページに閲覧数カウンターがありません。");
}

if (
  !articleHtml.includes("FANZAトップへ") ||
  !articleHtml.includes("考えるのが疲れたら行ってらっしゃい。") ||
  !articleHtml.includes("18歳未満の方は閲覧できません。") ||
  !articleHtml.includes("https://www.dmm.co.jp/top/")
) {
  throw new Error("記事末尾の18禁表記または通常リンクがありません。");
}

if (
  !speedingArticleHtml.includes("FANZAトップへ") ||
  !speedingArticleHtml.includes("考えるのが疲れたら行ってらっしゃい。") ||
  !speedingArticleHtml.includes("18歳未満の方は閲覧できません。") ||
  !speedingArticleHtml.includes("https://www.dmm.co.jp/top/")
) {
  throw new Error("二本目の記事末尾の18禁表記または通常リンクがありません。");
}

for (const slug of removedSlugs) {
  if (!redirects.includes(`/articles/${slug}/ /articles/ 302`)) {
    throw new Error(`${slug}: 削除済み記事の転送設定がありません。`);
  }
}

console.log(
  "Build verification passed: 2 anonymous articles, view counters, adult notice and sitemap.",
);
