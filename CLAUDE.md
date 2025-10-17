# CLAUDE.md - 実装方針ドキュメント

このドキュメントはClaude Code CLIでの開発時に参照するための実装ガイドラインです。

## 📋 重要な方針

### パッケージマネージャー
このプロジェクトでは **pnpm** を使用します。npm や yarn は使用しないでください。

```bash
# pnpmのインストール
npm install -g pnpm

# 依存関係のインストール
pnpm install

# パッケージの追加
pnpm add [package-name]

# 開発用パッケージの追加
pnpm add -D [package-name]
```

### 言語方針
**すべての開発関連コミュニケーションを日本語で統一します。**

#### 日本語で記述するもの
- ✅ コードコメント
- ✅ Gitコミットメッセージ
- ✅ Pull Requestのタイトル・説明
- ✅ コードレビューコメント
- ✅ Issue/タスク管理
- ✅ チャットでの技術議論

#### コミットメッセージの規約
```bash
# プレフィックスを使用した日本語コミットメッセージ
feat: 新機能の追加
fix: バグ修正
docs: ドキュメントの更新
style: コードスタイルの修正（機能変更なし）
refactor: リファクタリング
test: テストの追加・修正
chore: ビルドプロセスやツールの変更

# 例
git commit -m "feat: Google OAuth認証機能を実装"
git commit -m "fix: タイムラインの投稿が重複表示される問題を修正"
git commit -m "docs: CLAUDE.mdにFirebaseセキュリティルールを追加"
git commit -m "refactor: usePosts composableを関数単位で分割"
```

### ドキュメント管理方針
**実装の進捗に応じてドキュメントを必ず更新します。**

#### 更新が必要なタイミング
1. **機能実装完了時**
   - README.mdの機能リストを更新
   - CLAUDE.mdに実装パターンを追加
   
2. **データ構造変更時**
   - README.mdのデータ構造セクションを更新
   - CLAUDE.mdのFirestoreコレクション定義を更新

3. **設定変更時**
   - セットアップ手順の更新
   - 環境変数の追加・変更
   - セキュリティルールの更新

4. **技術的な意思決定時**
   - 新しいライブラリの採用理由
   - アーキテクチャの変更理由
   - パフォーマンス最適化の手法

#### ドキュメント更新の手順
```bash
# 1. 機能実装
git add src/components/NewFeature.vue

# 2. ドキュメント更新
git add README.md CLAUDE.md

# 3. まとめてコミット
git commit -m "feat: 新機能を実装し、ドキュメントを更新"
```

---

## 🎯 プロジェクト目標

Twitter風のSNSサービスをVue.js + Firebase + Vercelで構築する。
ショーケース目的のため、シンプルで保守性の高いコードを優先。

---

## 📁 プロジェクト構造

```
twitter-clone/
├── src/
│   ├── assets/              # 静的ファイル
│   ├── components/          # Vue コンポーネント
│   │   ├── auth/           # 認証関連
│   │   │   ├── LoginButton.vue
│   │   │   └── UserProfile.vue
│   │   ├── posts/          # 投稿関連
│   │   │   ├── PostCard.vue
│   │   │   ├── PostForm.vue
│   │   │   └── Timeline.vue
│   │   ├── common/         # 共通コンポーネント
│   │   │   ├── Header.vue
│   │   │   ├── Sidebar.vue
│   │   │   └── LoadingSpinner.vue
│   ├── composables/        # Vue Composition API
│   │   ├── useAuth.js
│   │   ├── usePosts.js
│   │   └── useLikes.js
│   ├── firebase/           # Firebase設定
│   │   └── config.js
│   ├── router/             # Vue Router
│   │   └── index.js
│   ├── stores/             # Pinia Store (状態管理)
│   │   ├── auth.js
│   │   └── posts.js
│   ├── views/              # ページコンポーネント
│   │   ├── Home.vue
│   │   ├── Profile.vue
│   │   └── PostDetail.vue
│   ├── App.vue
│   └── main.js
├── public/
├── .env.example
├── .env
├── .gitignore
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── README.md
└── CLAUDE.md
```

---

## 🔧 Firebase セットアップ手順

### 1. Firebase プロジェクト作成
1. https://console.firebase.google.com/ にアクセス
2. 「プロジェクトを追加」
3. プロジェクト名: `twitter-clone-showcase`
4. Google アナリティクス: 無効化（任意）

### 2. Authentication 設定
1. Authentication → 「始める」
2. Sign-in method → Google を有効化
3. サポートメールを選択して保存

### 3. Firestore Database 設定
1. Firestore Database → 「データベースの作成」
2. 本番環境モードを選択
3. ロケーション: `asia-northeast1` (東京)

**初期セキュリティルール:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 認証済みユーザーのみアクセス可能
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.authorId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.authorId == request.auth.uid;
    }
    
    match /likes/{likeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

### 4. Storage 設定
1. Storage → 「始める」
2. デフォルトのセキュリティルールで開始
3. ロケーション: Firestoreと同じ

**Storageセキュリティルール:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /images/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

### 5. Web アプリ登録
1. プロジェクト概要 → Web アプリ追加
2. アプリニックネーム: `twitter-clone-web`
3. 設定情報を `.env` にコピー

---

## 💻 実装ガイドライン

### Vue.js コーディング規約

#### Composition API を使用
```javascript
<script setup>
import { ref, computed, onMounted } from 'vue';

const count = ref(0);
const double = computed(() => count.value * 2);

onMounted(() => {
  console.log('Component mounted');
});
</script>
```

#### コンポーネント命名規則
- PascalCase: `PostCard.vue`, `LoginButton.vue`
- 2単語以上を推奨: `UserProfile.vue` ✅ `Profile.vue` ❌
- 日本語コメントで役割を明記

#### Props と Emits の型定義
```javascript
<script setup>
// プロパティの定義（投稿カードコンポーネント）
const props = defineProps({
  post: {
    type: Object,
    required: true
  },
  showActions: {
    type: Boolean,
    default: true
  }
});

// イベントの定義
const emit = defineEmits(['like', 'delete']);
</script>
```

#### コードコメントの記述例
```javascript
/**
 * 投稿を取得してタイムラインに表示する
 * @param {string} userId - ユーザーID
 * @param {number} limit - 取得する投稿数
 * @returns {Promise<Array>} 投稿の配列
 */
const fetchUserPosts = async (userId, limit = 50) => {
  // Firestoreから最新の投稿を取得
  const postsRef = collection(db, 'posts');
  const q = query(
    postsRef,
    where('authorId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limit)
  );
  
  // クエリを実行
  const snapshot = await getDocs(q);
  
  // ドキュメントを配列に変換
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};
```

---

### Firebase 実装パターン

#### 認証: `src/composables/useAuth.js`
```javascript
import { ref, computed } from 'vue';
import { auth, googleProvider } from '@/firebase/config';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

const user = ref(null);
const loading = ref(true);

export function useAuth() {
  const isAuthenticated = computed(() => !!user.value);

  const login = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      user.value = result.user;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      user.value = null;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  // 認証状態の監視
  onAuthStateChanged(auth, (currentUser) => {
    user.value = currentUser;
    loading.value = false;
  });

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout
  };
}
```

#### 投稿取得: `src/composables/usePosts.js`
```javascript
import { ref } from 'vue';
import { db } from '@/firebase/config';
import { 
  collection, 
  query, 
  orderBy, 
  limit,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot
} from 'firebase/firestore';

export function usePosts() {
  const posts = ref([]);
  const loading = ref(true);

  // リアルタイムでタイムライン取得
  const fetchTimeline = () => {
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      posts.value = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      loading.value = false;
    });
  };

  // 投稿作成
  const createPost = async (text, authorId, authorName, authorPhoto) => {
    try {
      await addDoc(collection(db, 'posts'), {
        text,
        authorId,
        authorName,
        authorPhoto,
        createdAt: serverTimestamp(),
        likesCount: 0,
        repliesCount: 0,
        retweetsCount: 0
      });
    } catch (error) {
      console.error('Create post error:', error);
      throw error;
    }
  };

  // 投稿削除
  const deletePost = async (postId) => {
    try {
      await deleteDoc(doc(db, 'posts', postId));
    } catch (error) {
      console.error('Delete post error:', error);
      throw error;
    }
  };

  return {
    posts,
    loading,
    fetchTimeline,
    createPost,
    deletePost
  };
}
```

---

## 🎨 UI/UX 設計方針

### デザインシステム

#### カラーパレット (Tailwind CSS)
```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: '#1DA1F2',    // Twitter Blue
        secondary: '#14171A',  // Black
        dark: '#192734',       // Dark Gray
        light: '#AAB8C2',      // Light Gray
        lighter: '#E1E8ED',    // Extra Light Gray
        danger: '#E0245E',     // Red
      }
    }
  }
}
```

#### レイアウト構造
- **3カラムレイアウト**: サイドバー（左）、メインコンテンツ（中央）、ウィジェット（右）
- **レスポンシブ**: モバイルは1カラム、タブレットは2カラム
- **最大幅**: メインコンテンツは `max-w-2xl`

---

## 🚀 実装の優先順位

### Phase 1: 基本機能（MVP）
1. ✅ Firebase セットアップ
2. 認証機能（Google OAuth）
   - ログインボタン
   - ユーザー情報表示
   - ログアウト
3. 投稿機能
   - 投稿フォーム（280文字制限）
   - タイムライン表示
   - 投稿削除（自分の投稿のみ）
4. 基本レイアウト
   - ヘッダー
   - サイドバー
   - メインコンテンツエリア

### Phase 2: インタラクション
1. いいね機能
   - いいねボタン
   - いいね数表示
   - いいね解除
2. コメント/返信
   - 返信フォーム
   - 返信スレッド表示
3. リツイート
   - リツイートボタン
   - リツイート数表示

### Phase 3: 拡張機能
1. プロフィールページ
   - ユーザー情報表示
   - ユーザーの投稿一覧
2. フォロー機能
   - フォローボタン
   - フォロワー/フォロー一覧
3. 画像アップロード
   - 画像選択UI
   - プレビュー表示
   - Firebase Storage連携
4. 検索・ハッシュタグ
   - 検索バー
   - ハッシュタグのリンク化
   - ハッシュタグページ

---

## 🧪 テスト方針

### 開発時の確認項目
- [ ] Google ログインが正常に動作
- [ ] 投稿の作成・表示が正常
- [ ] リアルタイム更新が動作
- [ ] 自分の投稿のみ削除可能
- [ ] セキュリティルールが正常に機能
- [ ] レスポンシブデザインが適切
- [ ] Firebase Sparkプランの制限内

### パフォーマンス最適化
- Firestoreクエリの最適化（limit使用）
- 画像の遅延読み込み（lazy loading）
- コンポーネントの遅延読み込み
- 不要な再レンダリングの防止

---

## 📦 デプロイ手順

### Vercel デプロイ

#### 初回デプロイ
```bash
# Vercel CLIインストール
pnpm add -g vercel

# プロジェクトディレクトリで実行
vercel

# 環境変数を設定
vercel env add VITE_FIREBASE_API_KEY
vercel env add VITE_FIREBASE_AUTH_DOMAIN
# ... 他の環境変数も追加
```

#### GitHub連携（推奨）
1. GitHubリポジトリを作成
2. Vercelダッシュボードで「Import Project」
3. リポジトリを選択
4. 環境変数を設定
5. デプロイ → 以降は自動デプロイ

---

## 🔍 トラブルシューティング

### よくある問題

#### Firebase 認証エラー
- **原因**: Vercelの本番URLがFirebaseの承認済みドメインに未登録
- **解決**: Firebase Console → Authentication → Settings → Authorized domains に追加

#### Firestore 読み取りエラー
- **原因**: セキュリティルールが厳しすぎる
- **確認**: Firestoreルールとクエリが一致しているか確認

#### 環境変数が読み込めない
- **原因**: `.env`ファイルの記述ミスまたはVercelの環境変数未設定
- **確認**: `VITE_` プレフィックスが必要（Vite使用時）

---

## 📚 参考リソース

- [Vue.js 公式ドキュメント](https://vuejs.org/)
- [Firebase 公式ドキュメント](https://firebase.google.com/docs)
- [Vercel ドキュメント](https://vercel.com/docs)
- [Tailwind CSS](https://tailwindcss.com/)

---

## 💡 開発のヒント

### Claude Code CLI での開発時
1. このファイル（CLAUDE.md）とREADME.mdを必ず参照
2. コンポーネントは小さく分割して再利用性を高める
3. Firebase操作はcomposablesに集約
4. エラーハンドリングを必ず実装
5. コンソールログで動作確認しながら進める
6. **機能実装後は必ずドキュメントを更新**
7. **コミット前にCLAUDE.mdの方針に沿っているか確認**

### コード品質
- ESLintとPrettierを使用
- コミット前にlintチェック
- コンポーネントは100行以内を目安に
- **日本語でわかりやすいコメントを記述**
- **変数名・関数名は英語、コメントは日本語**

### Pull Request のテンプレート
```markdown
## 変更内容
<!-- 何を変更したか簡潔に説明 -->

## 変更理由
<!-- なぜこの変更が必要か -->

## 影響範囲
<!-- どのファイル・機能に影響するか -->

## テスト内容
- [ ] ローカルで動作確認済み
- [ ] セキュリティルールを確認
- [ ] レスポンシブ対応を確認

## スクリーンショット
<!-- UI変更がある場合は画像を添付 -->

## 関連Issue
<!-- 関連するIssue番号があれば記載 -->

## チェックリスト
- [ ] コードコメントを日本語で記述
- [ ] コミットメッセージを日本語で記述
- [ ] README.md/CLAUDE.mdを更新（必要な場合）
- [ ] Lintエラーがない
- [ ] 不要なconsole.logを削除
```

---

最終更新: 2025-10-17

## 📌 更新履歴
このセクションに主要な変更を記録してください。

### 2025-10-17
- 初版作成
- pnpm使用を明記
- 日本語方針を追加
- ドキュメント更新方針を追加
