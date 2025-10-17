-- ============================================
-- マイグレーション4: ビューとファンクション
-- ============================================
-- 作成日: 2025-10-17
-- 説明: 便利なビューとヘルパー関数の作成

-- ============================================
-- ビュー
-- ============================================

-- タイムライン用のビュー（投稿とユーザー情報をJOIN）
CREATE VIEW timeline_posts AS
SELECT
  posts.*,
  users.display_name,
  users.icon
FROM posts
JOIN users ON posts.user_id = users.id
ORDER BY posts.created_at DESC;

-- ============================================
-- ヘルパー関数
-- ============================================

-- ユーザーがいいねした投稿を取得する関数
CREATE OR REPLACE FUNCTION user_liked_posts(target_user_id UUID)
RETURNS TABLE (
  post_id UUID,
  liked_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT likes.post_id, likes.created_at
  FROM likes
  WHERE likes.user_id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- フォロワー数を取得する関数
CREATE OR REPLACE FUNCTION get_followers_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM follows
    WHERE following_id = target_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- フォロー数を取得する関数
CREATE OR REPLACE FUNCTION get_following_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM follows
    WHERE follower_id = target_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- カウント管理関数
-- ============================================

-- いいね数を増やす関数
CREATE OR REPLACE FUNCTION increment_likes_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET likes_count = likes_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- いいね数を減らす関数
CREATE OR REPLACE FUNCTION decrement_likes_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- リポスト数を増やす関数
CREATE OR REPLACE FUNCTION increment_reposts_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET reposts_count = reposts_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- リポスト数を減らす関数
CREATE OR REPLACE FUNCTION decrement_reposts_count(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET reposts_count = GREATEST(reposts_count - 1, 0)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
