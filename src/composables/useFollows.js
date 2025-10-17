import { ref } from 'vue';
import { supabase } from '@/lib/supabase';

export function useFollows() {
  const loading = ref(false);
  const error = ref(null);

  /**
   * ユーザーをフォロー
   * @param {string} followerId - フォローするユーザーID
   * @param {string} followingId - フォロー対象ユーザーID
   */
  const followUser = async (followerId, followingId) => {
    loading.value = true;
    error.value = null;

    try {
      const { error: insertError } = await supabase.from('follows').insert({
        follower_id: followerId,
        following_id: followingId
      });

      if (insertError) throw insertError;

      return { error: null };
    } catch (err) {
      console.error('フォローエラー:', err);
      error.value = err.message;
      return { error: err };
    } finally {
      loading.value = false;
    }
  };

  /**
   * フォロー解除
   * @param {string} followerId - フォローしているユーザーID
   * @param {string} followingId - フォロー対象ユーザーID
   */
  const unfollowUser = async (followerId, followingId) => {
    loading.value = true;
    error.value = null;

    try {
      const { error: deleteError } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

      if (deleteError) throw deleteError;

      return { error: null };
    } catch (err) {
      console.error('フォロー解除エラー:', err);
      error.value = err.message;
      return { error: err };
    } finally {
      loading.value = false;
    }
  };

  /**
   * フォロー状態を確認
   * @param {string} followerId - フォローしているユーザーID
   * @param {string} followingId - フォロー対象ユーザーID
   */
  const isFollowing = async (followerId, followingId) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      return { following: !!data, error: null };
    } catch (err) {
      console.error('フォロー確認エラー:', err);
      return { following: false, error: err };
    }
  };

  /**
   * フォロワー数を取得
   * @param {string} userId - ユーザーID
   */
  const getFollowersCount = async (userId) => {
    try {
      const { data, error: fetchError } = await supabase.rpc('get_followers_count', {
        target_user_id: userId
      });

      if (fetchError) throw fetchError;

      return { count: data ?? 0, error: null };
    } catch (err) {
      console.error('フォロワー数取得エラー:', err);
      return { count: 0, error: err };
    }
  };

  /**
   * フォロー中ユーザー数を取得
   * @param {string} userId - ユーザーID
   */
  const getFollowingCount = async (userId) => {
    try {
      const { data, error: fetchError } = await supabase.rpc('get_following_count', {
        target_user_id: userId
      });

      if (fetchError) throw fetchError;

      return { count: data ?? 0, error: null };
    } catch (err) {
      console.error('フォロー中数取得エラー:', err);
      return { count: 0, error: err };
    }
  };

  return {
    loading,
    error,
    followUser,
    unfollowUser,
    isFollowing,
    getFollowersCount,
    getFollowingCount
  };
}
