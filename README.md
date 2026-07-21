# 大人のオレが考えちゃいけないこと考える

> 大人になると、考えなくなってしまうことを、もう一度考える。

社会の中で「もう答えが出たこと」として扱われていることを、ゼロから考え直す文章メディアです。

## 最重要：既存LPとは別プロジェクト

このリポジトリは、新規のCloudflare Pages用プロジェクトです。

以下には一切依存しません。

- 既存の`~/ai-kiyoshi-lp`
- 既存Vercelプロジェクト
- 既存Vercel環境変数
- 既存LPのURL、DNS、デプロイ設定

既存LPを移行するためのリポジトリではありません。

## 技術構成

- Astro
- TypeScript
- Markdown / Astro Content Collections
- 静的HTML
- Cloudflare Pages
- Cloudflare Pages Functions
- Cloudflare D1（閲覧カウンター専用）
- CMSなし

## ローカルで確認する

Node.js 22を使用します。

```bash
npm install
cp .env.example .env
npm run dev
```

本番相当の確認：

```bash
npm run verify
```

## 記事を追加する

`src/content/articles/`にMarkdownファイルを追加します。

ファイル名は、そのまま記事URLに使われます。

例：

```text
src/content/articles/okane-to-shiawase.md
↓
/articles/okane-to-shiawase/
```

frontmatter：

```yaml
---
title: "お金持ちになったら、幸せなんだっけ。"
description: "記事一覧、検索結果、SNS共有で使う短い説明文。"
publishedAt: 2026-07-20
updatedAt: 2026-07-21 # 任意
draft: false
featured: false
# 記事ごとにリンクを変える場合のみ指定
affiliateUrl: "https://example.com/affiliate-link"
affiliateLabel: "リンクに表示する商品名"
---
```

本文は次の流れを基本にします。

1. 問いを立てる
2. 一般的な常識を確認する
3. 「でも、なんで？」と考える
4. 複数の視点から考える
5. 矛盾も含めて考える
6. 現時点での仮の結論を出す

固定文「考えるのが疲れたら行ってらっしゃい。」は記事レイアウトが自動で追加します。Markdownには書かないでください。

`draft: true`の記事は、一覧・サイトマップ・本番ビルドから除外されます。

記事末尾のSNS投稿ボタンに使う投稿文は、frontmatterの`sharePrompt`で記事ごとに変更できます（任意）。

```yaml
sharePrompt: "自分の「危険」は、"
# 見出し文言を記事ごとに変える場合のみ（通常は不要）
shareCtaLabel: "自分の考えも、外に置いていく。"
```

## 記事末尾のリンク

アフィリエイト審査中など、通常リンクを表示する場合は`ADULT_LINK_URL`にURLを指定します。

```text
ADULT_LINK_URL=https://www.dmm.co.jp/top/
```

アフィリエイトURLを取得した後は、環境変数`AFFILIATE_URL`に指定します。

```text
AFFILIATE_URL=https://example.com/
```

- `AFFILIATE_URL`を設定：広告リンクとして表示
- 記事frontmatterの`affiliateUrl`を設定：その記事だけ環境変数より優先
- `affiliateLabel`を設定：その記事だけリンク名を変更
- `ADULT_LINK_URL`のみ設定：通常リンクとして表示
- 両方を設定：`AFFILIATE_URL`を優先
- 両方とも未設定または空欄：リンクを表示しない
- `http`または`https`以外：リンクを表示しない
- 成人向けリンクには「18禁」と注意文を表示

静的サイトのため、URL変更後は再デプロイが必要です。

## 閲覧カウンター

トップページの通算訪問数と、記事ごとの閲覧数をD1へ保存します。

- トップページを開く：`/`の閲覧数を加算
- 記事ページを開く：該当する記事URLの閲覧数を加算
- 記事一覧を開く：数字を表示するだけで加算しない
- 同じブラウザ・同じページでは、30分以内の再読み込みを重複計上しない
- 検索エンジンやSNSプレビューなど、代表的なBotのアクセスは加算しない
- 個人情報、IPアドレス、ブラウザIDはD1へ保存しない

D1には次のマイグレーションを適用します。

```bash
npx wrangler d1 execute ai-kiyoshi-page-views \
  --remote \
  --file=migrations/0001_page_views.sql
```

表示用カウンターは読者向けの目安です。正確なアクセス分析にはCloudflare Web Analyticsを使用します。

## コメント機能

記事ごとに、ニックネーム式のコメントを置いていけます。アカウント登録・ログイン不要です。

- ニックネームは任意（未入力は「名無しのオレ」）、最大20文字
- コメントは必須、最大400文字、プレーンテキストのみ（URL・空白のみは投稿不可）
- 新しい順に表示、初回20件、それ以降は「もっと見る」で追加読み込み
- 個人情報・誹謗中傷・宣伝・URLの投稿は禁止（フォーム下に明記）
- 投稿はCloudflare Turnstileで検証し、同一送信元の連投（1分以内・1時間あたりの上限）を制限
- 生のIPアドレスはD1へ保存せず、secret saltでハッシュ化した値のみ連投判定に使用

D1には次の追加マイグレーションを適用します（既存の`page_views`テーブルはそのままです）。

```bash
npx wrangler d1 execute ai-kiyoshi-page-views \
  --remote \
  --file=migrations/0002_comments.sql
```

### Cloudflare Turnstileの設定

1. Cloudflare Dashboard → Turnstile → Add widget（Managedモード、対象ドメインを指定）でSite KeyとSecret Keyを発行します。
2. Site Key（公開値）は、Cloudflare PagesプロジェクトのEnvironment variables（Production / Preview 両方）に`PUBLIC_TURNSTILE_SITE_KEY`として設定します（Astroのビルド時に埋め込まれます）。
3. Secret Keyと、連投判定用・管理画面用の値は、Cloudflare Pagesのsecretとして設定します（リポジトリや設定ファイルには書きません）。

```bash
npx wrangler pages secret put TURNSTILE_SECRET_KEY --project-name=ai-kiyoshi-nandedakke
npx wrangler pages secret put COMMENT_HASH_SALT --project-name=ai-kiyoshi-nandedakke
npx wrangler pages secret put COMMENT_ADMIN_TOKEN --project-name=ai-kiyoshi-nandedakke
```

`COMMENT_HASH_SALT`・`COMMENT_ADMIN_TOKEN`は、十分に長いランダム値を使用してください（例: `openssl rand -hex 32`）。

ローカルで`wrangler pages dev`を使ってFunctionsを試す場合は、`.dev.vars`（gitignore済み）に同じキー名で値を設定します。Cloudflare公式のTurnstileテスト用キー（常に成功: サイトキー`1x00000000000000000000AA` / シークレット`1x0000000000000000000000000000000AA`）を使うと、実際の審査なしに動作確認できます。

### コメント管理画面

`/admin/comments/`（通常のナビゲーションからはリンクしていません、`noindex`）で、コメントの一覧・記事別/状態別の絞り込み・非表示化・再表示・完全削除ができます。管理者トークン（`COMMENT_ADMIN_TOKEN`と同じ値）の入力が必要です。トークンはURLに含めず、タブを閉じると破棄されます（sessionStorageのみ使用）。

## SNSシェア機能

記事末尾にThreads・Xへの投稿ボタンと、リンクコピーボタンを表示します。API連携や自動投稿は行わず、公式のWeb Intent（投稿画面を開くだけ）とクリップボードコピーのみです。投稿の最終確定は読者自身が行います。

## Cloudflare Pagesへ公開する

公開担当は、既存LPと無関係な新規リポジトリ・新規Pagesプロジェクトとして作業してください。

### 1. 新規GitHubリポジトリ

推奨リポジトリ名：

```text
ai-kiyoshi-nandedakke
```

このディレクトリだけをリポジトリに含めます。

### 2. Cloudflare Pages設定

Cloudflare Dashboardから、新しいPagesプロジェクトとしてGitHubリポジトリを接続します。

| 設定 | 値 |
|---|---|
| Production branch | `main` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node.js | `22` |

### 3. 環境変数

最初の公開後、確定したURLを設定して再デプロイします。

```text
SITE_URL=https://<確定したプロジェクト名>.pages.dev
```

`ADULT_LINK_URL`には審査中の通常リンク、`AFFILIATE_URL`には承認後の広告URLを設定します。

### 4. 自動デプロイ

以後、`main`へのpushで本番が更新されます。Pull RequestではプレビューURLを使えます。

## 独自ドメインを追加するとき

Cloudflare Pages側で独自ドメインを追加し、`SITE_URL`を新しいURLへ変更して再デプロイします。

サイト構成や記事URLの設計は変える必要がありません。
