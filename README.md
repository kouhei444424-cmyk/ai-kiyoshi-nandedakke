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
- CMS・データベースなし

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
---
```

本文は次の流れを基本にします。

1. 問いを立てる
2. 一般的な常識を確認する
3. 「でも、なんで？」と考える
4. 複数の視点から考える
5. 矛盾も含めて考える
6. 現時点での仮の結論を出す

固定文「頭疲れたら行ってらっしゃい。」は記事レイアウトが自動で追加します。Markdownには書かないでください。

`draft: true`の記事は、一覧・RSS・サイトマップ・本番ビルドから除外されます。

## アフィリエイトリンク

環境変数`AFFILIATE_URL`にURLを指定します。

```text
AFFILIATE_URL=https://example.com/
```

- 未設定または空欄：リンクを表示しない
- `http`または`https`以外：リンクを表示しない
- 設定済み：記事末尾に「広告」表記とリンクを表示

静的サイトのため、URL変更後は再デプロイが必要です。

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

`AFFILIATE_URL`は現時点では設定しません。

### 4. 自動デプロイ

以後、`main`へのpushで本番が更新されます。Pull RequestではプレビューURLを使えます。

## 独自ドメインを追加するとき

Cloudflare Pages側で独自ドメインを追加し、`SITE_URL`を新しいURLへ変更して再デプロイします。

サイト構成や記事URLの設計は変える必要がありません。
