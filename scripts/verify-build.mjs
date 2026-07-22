import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const dist = join(root, "dist");
const firstArticleSlug = "hito-wa-nande-nagutte-wa-ikenai";
const secondArticleSlug = "speeding";
const thirdArticleSlug = "dangerous-men";
const fourthArticleSlug = "obake-kowai";
const fifthArticleSlug = "egg-color";
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
  `articles/${thirdArticleSlug}/index.html`,
  `articles/${fourthArticleSlug}/index.html`,
  `articles/${fifthArticleSlug}/index.html`,
  "about/index.html",
  "robots.txt",
  "sitemap-index.xml",
  "og.png",
  "_redirects",
];
const requiredSourceFiles = [
  "functions/api/views.js",
  "migrations/0001_page_views.sql",
  "functions/api/comments.js",
  "functions/api/admin/comments.js",
  "functions/api/admin/comments/[id].js",
  "functions/_lib/comments.js",
  "migrations/0002_comments.sql",
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
const thirdArticleHtml = await readFile(
  join(dist, "articles", thirdArticleSlug, "index.html"),
  "utf8",
);
const fourthArticleHtml = await readFile(
  join(dist, "articles", fourthArticleSlug, "index.html"),
  "utf8",
);
const fifthArticleHtml = await readFile(
  join(dist, "articles", fifthArticleSlug, "index.html"),
  "utf8",
);
const redirects = await readFile(join(dist, "_redirects"), "utf8");

if (!homeHtml.includes("人をなんで殴っちゃいけないんだっけ。")) {
  throw new Error("トップページに一本目の記事がありません。");
}

if (!homeHtml.includes("スピード違反って、なんでしちゃいけないんだっけ。")) {
  throw new Error("トップページに二本目の記事がありません。");
}

if (!homeHtml.includes("危ないことをするのって、なんでだいたい男なんだっけ。")) {
  throw new Error("トップページに三本目の記事がありません。");
}

if (!homeHtml.includes("おばけって、なんで怖いんだっけ。")) {
  throw new Error("トップページに四本目の記事がありません。");
}

if (!homeHtml.includes("冷静に考えたら鶏のたまごって食べちゃいけねぇ色してない？")) {
  throw new Error("トップページに五本目の記事がありません。");
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

if (!archiveHtml.includes("危ないことをするのって、なんでだいたい男なんだっけ。")) {
  throw new Error("記事一覧に三本目の記事がありません。");
}

if (!archiveHtml.includes("おばけって、なんで怖いんだっけ。")) {
  throw new Error("記事一覧に四本目の記事がありません。");
}

if (!archiveHtml.includes("冷静に考えたら鶏のたまごって食べちゃいけねぇ色してない？")) {
  throw new Error("記事一覧に五本目の記事がありません。");
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
  thirdArticleHtml.includes("康平") ||
  thirdArticleHtml.includes("山口") ||
  thirdArticleHtml.includes("AIきよし")
) {
  throw new Error("三本目の記事に個人名または不要な人格名が残っています。");
}

if (
  fourthArticleHtml.includes("康平") ||
  fourthArticleHtml.includes("山口") ||
  fourthArticleHtml.includes("AIきよし")
) {
  throw new Error("四本目の記事に個人名または不要な人格名が残っています。");
}

if (
  fifthArticleHtml.includes("康平") ||
  fifthArticleHtml.includes("山口") ||
  fifthArticleHtml.includes("AIきよし")
) {
  throw new Error("五本目の記事に個人名または不要な人格名が残っています。");
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

if (thirdArticleHtml.includes('class="article__description"')) {
  throw new Error("三本目の記事ページに不要なサブタイトルが表示されています。");
}

if (fourthArticleHtml.includes('class="article__description"')) {
  throw new Error("四本目の記事ページに不要なサブタイトルが表示されています。");
}

if (fifthArticleHtml.includes('class="article__description"')) {
  throw new Error("五本目の記事ページに不要なサブタイトルが表示されています。");
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
  !thirdArticleHtml.includes("読む前に、10秒だけ考えてみて。") ||
  !thirdArticleHtml.includes("弱い自分を、その場から消したい。") ||
  !thirdArticleHtml.includes("考えなくていい感じ") ||
  !thirdArticleHtml.includes("自分が強くなったように感じる、あの数秒。") ||
  !thirdArticleHtml.includes("でも、たぶんまた変わる。")
) {
  throw new Error("三本目の記事本文が最終稿と一致しません。");
}

if (
  !fourthArticleHtml.includes("読む前に、10秒だけ考えてみて。") ||
  !fourthArticleHtml.includes("怖がっていたというより、怖さで遊んでいた。") ||
  !fourthArticleHtml.includes("想像力が勝手に残業を始める") ||
  !fourthArticleHtml.includes("おばけは存在ではなく、余白なのかもしれない。") ||
  !fourthArticleHtml.includes("でも、たぶんまた変わる。")
) {
  throw new Error("四本目の記事本文が最終稿と一致しません。");
}

if (
  !fifthArticleHtml.includes("読む前に、10秒だけ考えてみて。") ||
  !fifthArticleHtml.includes("料理は、食材の身元を消している") ||
  !fifthArticleHtml.includes("ほぼ現場である。") ||
  !fifthArticleHtml.includes("たまごがうまかった記憶が、あの黄色をうまそうに見せている。") ||
  !fifthArticleHtml.includes("でも、たぶんまた変わる。")
) {
  throw new Error("五本目の記事本文が最終稿と一致しません。");
}

if (
  !articleHtml.includes(
    'data-view-track="/articles/hito-wa-nande-nagutte-wa-ikenai/"',
  ) ||
  !articleHtml.includes("article__views")
) {
  throw new Error("記事ページに閲覧数カウンターがありません。");
}

for (const [index, html] of [
  articleHtml,
  speedingArticleHtml,
  thirdArticleHtml,
  fourthArticleHtml,
  fifthArticleHtml,
].entries()) {
  if (
    !html.includes("広告・18禁") ||
    !html.includes("考えるのが疲れたら行ってらっしゃい。") ||
    !html.includes("18歳未満の方は閲覧できません。") ||
    !html.includes("https://al.fanza.co.jp/") ||
    !html.includes("af_id=kiyoshi0505-001") ||
    !html.includes('rel="sponsored nofollow noopener"') ||
    !html.includes('data-affiliate-link="true"')
  ) {
    throw new Error(`${index + 1}本目の記事末尾に広告リンクまたは18禁表記がありません。`);
  }
}

if (
  !articleHtml.includes("mkmp00733") ||
  !articleHtml.includes("ch=search_link") ||
  !articleHtml.includes("-実写版- 乙葉ちゃんとSEX") ||
  articleHtml.includes("id%3Doshi017")
) {
  throw new Error("一本目の記事に専用アフィリエイトリンクがありません。");
}

if (
  !speedingArticleHtml.includes("id%3Dh_113spe00004") ||
  !speedingArticleHtml.includes("ch=search_link") ||
  !speedingArticleHtml.includes("万引き スーパーの人妻たち") ||
  speedingArticleHtml.includes("id%3Doshi017")
) {
  throw new Error("二本目の記事に専用アフィリエイトリンクがありません。");
}

if (!thirdArticleHtml.includes("とうか") || !thirdArticleHtml.includes("id%3Doshi017")) {
  throw new Error("三本目の記事の共通アフィリエイトリンクが変わっています。");
}

if (
  !fourthArticleHtml.includes("id%3Dsqde00028") ||
  !fourthArticleHtml.includes("ch=search_link") ||
  !fourthArticleHtml.includes("服を脱いだら性欲お化け")
) {
  throw new Error("四本目の記事に専用アフィリエイトリンクがありません。");
}

if (
  !fifthArticleHtml.includes("id%3Dhikb00010") ||
  !fifthArticleHtml.includes("ch=search_link") ||
  !fifthArticleHtml.includes("イカすパツキン外人天国20人300分")
) {
  throw new Error("五本目の記事に専用アフィリエイトリンクがありません。");
}

for (const slug of removedSlugs) {
  if (!redirects.includes(`/articles/${slug}/ /articles/ 302`)) {
    throw new Error(`${slug}: 削除済み記事の転送設定がありません。`);
  }
}

for (const [index, html] of [
  articleHtml,
  speedingArticleHtml,
  thirdArticleHtml,
  fourthArticleHtml,
  fifthArticleHtml,
].entries()) {
  if (
    !html.includes("Threadsで書く") ||
    !html.includes("Xで書く") ||
    !html.includes("リンクをコピー") ||
    !html.includes("ほかの人は、どう思った？") ||
    !html.includes("今日のところの考えを、置いていけます。") ||
    !html.includes("置いていく")
  ) {
    throw new Error(`${index + 1}本目の記事にSNSシェアまたはコメント欄の表示がありません。`);
  }

  const shareIndex = html.indexOf("Threadsで書く");
  const commentIndex = html.indexOf("ほかの人は、どう思った？");
  const endingIndex = html.indexOf("考えるのが疲れたら行ってらっしゃい。");
  const navIndex = html.indexOf("ほかの「なんでだっけ。」を見る");

  if (
    !(shareIndex > 0 && commentIndex > shareIndex && endingIndex > commentIndex && navIndex > endingIndex)
  ) {
    throw new Error(
      `${index + 1}本目の記事末尾の表示順（本文→SNS→コメント→締め→ナビ）が崩れています。`,
    );
  }
}

if (
  !articleHtml.includes("twitter.com/intent/tweet") ||
  !articleHtml.includes("threads.com/intent/post")
) {
  throw new Error("一本目の記事にSNS投稿用リンクがありません。");
}

console.log(
  "Build verification passed: 5 anonymous articles, view counters, sponsored adult links and sitemap.",
);
