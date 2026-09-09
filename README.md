# マネマネ（Money Manager）

日払い・アルバイトで生活する人向けの家計管理アプリです。「支払日になってお金が足りないと気づく」という課題を、収支の記録と可視化によって事前に防ぐことを目的にしています。

🔗 **本番環境**: https://money-manager-bice-rho.vercel.app

## 主な機能

- **収支管理**：収入・支出の記録、クイック入力ボタン、取引の編集・削除
- **支払日アラート**：固定費・固定給料（収入）を登録し、収支を時系列でシミュレーションして残高不足を事前に警告
- **1日あたりの目安金額**：次の支払い日までに使える金額を自動計算（借入の返済負担・クレジットカードの未引き落とし分も加味）
- **クレジットカード管理**：カード払いの取引は引き落とし日にまとめて残高へ反映
- **借入の記録**：一括／分割（毎日・毎週・毎月）返済に対応
- **カレンダー・月次グラフ・先月比較・カテゴリ別予算・貯金目標**
- **アカウント機能**：メールアドレス＋パスワードでの登録・ログイン・ログアウト・パスワード変更
- **共有リンク**：残高とカテゴリ別収支のみを見せる閲覧専用リンクを発行
- **PWA対応**：ホーム画面に追加してアプリのように起動可能
- **プッシュ通知**：記録がない日に毎日リマインダー通知（Vercel Cron）

## 技術スタック

| 分類 | 技術 |
|---|---|
| フロントエンド | Vite + React |
| デプロイ | Vercel（Hobbyプラン） |
| データベース | Postgres（Neon, Vercel経由） |
| ORM | Prisma |
| API | Vercel Functions（`api/`） |
| 認証 | 自前実装（scryptによるパスワードハッシュ＋署名付きCookieセッション） |

## セットアップ（ローカル開発）

```bash
npm install
npx prisma migrate dev
npm run dev          # フロントエンド（Vite）
node --env-file=.env.local scripts/dev-api-server.mjs   # APIサーバー
```

`.env.local` に以下を設定してください（値はVercel Dashboardや各種サービスから取得）。

```
DATABASE_URL=
SESSION_SECRET=
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VITE_VAPID_PUBLIC_KEY=
CRON_SECRET=
```

## デプロイ

```bash
npx vercel --prod
```

## ディレクトリ構成

```
api/            Vercel Functions（各エンドポイントごとに1ファイル）
lib/            サーバー側共通ロジック（認証・バリデーション・Prismaクライアント）
prisma/         スキーマ・マイグレーション
src/            Reactアプリ本体
  components/   画面パーツ
  hooks/        共通フック
  lib/          クライアント側の計算ロジック
public/         静的ファイル・PWAマニフェスト・Service Worker
```
