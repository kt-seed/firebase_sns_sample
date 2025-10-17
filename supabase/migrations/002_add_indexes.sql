-- ============================================
-- マイグレーション2: インデックスの追加
-- ============================================
-- 作成日: 2025-10-17
-- 説明: パフォーマンス向上のためのインデックス作成

-- postsテーブル
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- likesテーブル
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_id ON likes(user_id);

-- repostsテーブル
CREATE INDEX idx_reposts_post_id ON reposts(post_id);
CREATE INDEX idx_reposts_user_id ON reposts(user_id);

-- followsテーブル
CREATE INDEX idx_follows_follower ON follows(follower_id);
CREATE INDEX idx_follows_following ON follows(following_id);
