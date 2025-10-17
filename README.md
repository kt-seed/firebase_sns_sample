# Twitter風SNSサービス

ショーケース目的で作成する、誰でも投稿可能なTwitterライクなSNSサービスです。

## 📋 プロジェクト概要

- **目的**: ポートフォリオ/ショーケース用のSNSアプリケーション
- **コンセプト**: シンプルで使いやすいTwitter風の投稿プラットフォーム

## 🛠 技術スタック

### フロントエンド
- **Vue.js 3** - メインフレームワーク
- **Vite** - ビルドツール
- **Tailwind CSS** - スタイリング（推奨）

### バックエンド・インフラ
- **Firebase Authentication** - Google OAuth認証
- **Firebase Firestore** - NoSQLデータベース（投稿データ保存）
- **Firebase Storage** - 画像ストレージ
- **Vercel** - ホスティング・デプロイ

### プラン
- **Firebase Spark（無料プラン）**
  - Firestore: 1GB、50K読み取り/日、20K書き込み/日
  - Storage: 5GB、1GB/日ダウンロード
  - Authentication: 無制限

## 🎯 主要機能（MVP）

### フェーズ1 - コア機能
- [x] Google OAuth ログイン
- [ ] 投稿の作成・表示（タイムライン）
- [ ] ユーザープロフィール表示
- [ ] 投稿の削除（自分の投稿のみ）

### フェーズ2 - インタラクション
- [ ] いいね機能
- [ ] コメント/返信機能
- [ ] リツイート機能

### フェーズ3 - 拡張機能
- [ ] フォロー/フォロワー
- [ ] 画像アップロード
- [ ] ハッシュタグ
- [ ] 検索機能
- [ ] ユーザープロフィール編集

## 📊 データ構造

### users コレクション
```javascript
{
  uid: string,              // Google OAuth UID
  displayName: string,      // 表示名
  photoURL: string,         // プロフィール画像URL
  email: string,            // メールアドレス
  createdAt: timestamp,     // アカウント作成日時
  followersCount: number,   // フォロワー数
  followingCount: number    // フォロー数
}
```

### posts コレクション
```javascript
{
  id: string,               // 自動生成ID
  text: string,             // 投稿内容（最大280文字）
  authorId: string,         // 投稿者UID
  authorName: string,       // 投稿者名（非正規化）
  authorPhoto: string,      // 投稿者画像URL（非正規化）
  createdAt: timestamp,     // 投稿日時
  likesCount: number,       // いいね数
  repliesCount: number,     // 返信数
  retweetsCount: number     // リツイート数
}
```

### likes コレクション
```javascript
{
  postId: string,           // 投稿ID
  userId: string,           // いいねしたユーザーID
  createdAt: timestamp      // いいね日時
}
```

## 🚀 セットアップ

### 前提条件
- Node.js 18以上
- **pnpm** (パッケージマネージャー)
- Firebaseプロジェクト
- Googleアカウント

### pnpm のインストール
```bash
npm install -g pnpm
```

### インストール
```bash
# リポジトリをクローン
git clone [repository-url]
cd twitter-clone

# 依存関係をインストール
pnpm install

# 環境変数を設定
cp .env.example .env
# .envファイルにFirebaseの設定を記入
```

### 環境変数
`.env`ファイルに以下を設定：
```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

### 開発サーバー起動
```bash
pnpm dev
```

### ビルド
```bash
pnpm build
```

## 📦 デプロイ

### Vercel へのデプロイ
```bash
# Vercel CLIをインストール
pnpm add -g vercel

# デプロイ
vercel
```

または、GitHubリポジトリと連携して自動デプロイ。

## 📝 ドキュメント管理

### ドキュメントの更新
このプロジェクトでは、実装の進捗に応じてドキュメントを最新の状態に保ちます：

- **README.md**: 機能追加や仕様変更があった場合は必ず更新
- **CLAUDE.md**: 実装パターンや設計方針の変更があった場合は更新
- 更新内容はGitコミットに含める

### ドキュメント更新のタイミング
- ✅ 新機能の実装完了時
- ✅ データ構造の変更時
- ✅ セットアップ手順の変更時
- ✅ 技術スタックの追加・変更時
- ✅ セキュリティルールの更新時

## 🌐 言語方針

このプロジェクトでは、**すべての開発関連コミュニケーションを日本語で統一**します：

### 日本語を使用する場所
- ✅ **コードコメント**: すべて日本語で記述
- ✅ **Gitコミットメッセージ**: 日本語で明確に
- ✅ **Pull Requestのタイトル・説明**: 日本語
- ✅ **コードレビューコメント**: 日本語
- ✅ **Issue/タスク管理**: 日本語
- ✅ **チャットでの議論**: 日本語
- ✅ **ドキュメント**: 日本語

### コミットメッセージの例
```bash
# Good ✅
git commit -m "feat: Google OAuth認証機能を実装"
git commit -m "fix: タイムラインの表示順序を修正"
git commit -m "docs: README.mdにデプロイ手順を追加"

# Bad ❌
git commit -m "feat: implement google oauth"
git commit -m "fix timeline order"
```

### コードコメントの例
```javascript
// Good ✅
// ユーザーの投稿を取得してタイムラインに表示する
const fetchUserPosts = async (userId) => {
  // Firestoreから最新50件を取得
  const posts = await getPosts(userId, 50);
  return posts;
};

// Bad ❌
// Fetch user posts and display on timeline
const fetchUserPosts = async (userId) => {
  // Get latest 50 from Firestore
  const posts = await getPosts(userId, 50);
  return posts;
};
```

## 🔒 セキュリティ

### Firestoreセキュリティルール
- 認証済みユーザーのみ読み書き可能
- ユーザーは自分の投稿のみ削除可能
- いいね・フォローの重複防止

### Storageセキュリティルール
- 認証済みユーザーのみアップロード可能
- ファイルサイズ制限: 5MB
- 画像形式のみ許可

