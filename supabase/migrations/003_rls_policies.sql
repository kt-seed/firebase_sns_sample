-- ============================================
-- マイグレーション3: Row Level Security (RLS)
-- ============================================
-- 作成日: 2025-10-17
-- 説明: 行レベルセキュリティポリシーの設定

-- RLSを有効化
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- ============================================
-- usersテーブルのポリシー
-- ============================================

-- 全ユーザー情報は誰でも閲覧可能
CREATE POLICY "Users are viewable by everyone"
  ON users FOR SELECT
  USING (true);

-- 自分のプロフィールのみ更新可能
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- 新規ユーザーの自動作成（auth.usersと連携）
CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================
-- postsテーブルのポリシー
-- ============================================

-- 認証済みユーザーは全投稿を閲覧可能
CREATE POLICY "Posts are viewable by authenticated users"
  ON posts FOR SELECT
  TO authenticated
  USING (true);

-- 認証済みユーザーは投稿を作成可能
CREATE POLICY "Users can create posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 自分の投稿のみ削除可能
CREATE POLICY "Users can delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- likesテーブルのポリシー
-- ============================================

-- 認証済みユーザーは全いいねを閲覧可能
CREATE POLICY "Likes are viewable by authenticated users"
  ON likes FOR SELECT
  TO authenticated
  USING (true);

-- 認証済みユーザーはいいね可能
CREATE POLICY "Users can create likes"
  ON likes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 自分のいいねのみ削除可能
CREATE POLICY "Users can delete own likes"
  ON likes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- repostsテーブルのポリシー
-- ============================================

-- 認証済みユーザーは全リポストを閲覧可能
CREATE POLICY "Reposts are viewable by authenticated users"
  ON reposts FOR SELECT
  TO authenticated
  USING (true);

-- 認証済みユーザーはリポスト可能
CREATE POLICY "Users can create reposts"
  ON reposts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 自分のリポストのみ削除可能
CREATE POLICY "Users can delete own reposts"
  ON reposts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- followsテーブルのポリシー
-- ============================================

-- 認証済みユーザーは全フォロー関係を閲覧可能
CREATE POLICY "Follows are viewable by authenticated users"
  ON follows FOR SELECT
  TO authenticated
  USING (true);

-- 認証済みユーザーはフォロー可能
CREATE POLICY "Users can create follows"
  ON follows FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = follower_id);

-- 自分のフォローのみ削除可能
CREATE POLICY "Users can delete own follows"
  ON follows FOR DELETE
  TO authenticated
  USING (auth.uid() = follower_id);
