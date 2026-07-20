import { access, readFile } from "node:fs/promises";
import { join } from "node:path";

const root = new URL("../", import.meta.url).pathname;
const dist = join(root, "dist");
const slugs = ["doryoku-wa-erai", "hatarakanai-to-dame", "rule-wa-mamoru"];
const requiredFiles = [
  "index.html",
  "articles/index.html",
  "about/index.html",
  "rss.xml",
  "robots.txt",
  "sitemap-index.xml",
  "og.png",
];

for (const relativePath of requiredFiles) {
  await access(join(dist, relativePath));
}

for (const slug of slugs) {
  const html = await readFile(
    join(dist, "articles", slug, "index.html"),
    "utf8",
  );

  if (!html.includes("頭疲れたら行ってらっしゃい。")) {
    throw new Error(`${slug}: 固定の末尾文が見つかりません。`);
  }

  if (html.includes("data-affiliate-link")) {
    throw new Error(`${slug}: URL未設定なのに広告リンクが表示されています。`);
  }
}

console.log("Build verification passed: 3 articles, fixed ending, RSS and sitemap.");
