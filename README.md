# Anonymous SNS

匿名で気軽に投稿できる Twitter 風 SNS を目標とした学習用プロジェクトです。Vue 3（Composition API）と Supabase を中心に、フロントエンドからバックエンドまで一貫したモダンな構成を採用しています。

## 主要技術
- Vue 3 + Vite
- Pinia / Vue Router
- Tailwind CSS
- Supabase（PostgreSQL / Authentication / Realtime）
- pnpm

## セットアップ
1. **Supabase プロジェクトを作成**
   - Dashboard で新規プロジェクトを作成し、メール/パスワード認証を有効化（Confirm Email は開発中は OFF 推奨）。
   - `supabase/migrations` 配下の SQL を順番に実行し、スキーマ・関数を構築。
   - `posts`, `likes`, `reposts`, `follows` の Realtime を有効化。

2. **環境変数を設定**
   ```bash
   cp .env.example .env
   ```
   Supabase の Project URL と anon key を `.env` に追記します。

3. **依存関係をインストール**
   ```bash
   pnpm install
   ```

4. **開発サーバーを起動**
   ```bash
   pnpm dev
   ```
   `http://localhost:5173` にアクセスしてください。

## ディレクトリ構成
```
src/
├── assets/             # グローバルスタイルなど
├── components/         # Vue コンポーネント（認証・共通・ユーザー系）
├── composables/        # Supabase と連携するロジック（認証・投稿など）
├── lib/                # Supabase クライアント初期化
├── router/             # Vue Router 設定
├── stores/             # Pinia ストア
├── utils/              # ユーティリティ（アイコン定義など）
├── views/              # 画面コンポーネント
├── App.vue
└── main.js
```

## 主要スクリプト
| コマンド       | 内容                     |
| -------------- | ------------------------ |
| `pnpm dev`     | 開発サーバーを起動       |
| `pnpm build`   | 本番ビルドを作成         |
| `pnpm preview` | ビルド成果物をローカルで確認 |

## コーディング指針
- コード、コメント、ドキュメントは日本語で統一します。
- Supabase と通信する処理は composable にまとめ、UI 側では Pinia 経由で扱います。
- スタイルは Tailwind CSS を基本とし、補足の CSS は必要最小限に留めます。

## ライセンス
このリポジトリのライセンスは未定義です。利用する場合は管理者に確認してください。
