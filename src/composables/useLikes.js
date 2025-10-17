import { ref } from 'vue';
import { supabase } from '@/lib/supabase';

export function useLikes() {
  const loading = ref(false);
  const error = ref(null);

  /**
   * いいねを追加
   * @param {string} postId - 投稿ID
   * @param {string} userId - ユーザーID
   */
  const likePost = async (postId, userId) => {
    loading.value = true;
    error.value = null;

    try {
      // いいねを追加
      const { error: insertError } = await supabase.from('likes').insert({
        post_id: postId,
        user_id: userId
      });

      if (insertError) throw insertError;

      // 投稿のいいね数を更新
      const { error: updateError } = await supabase.rpc('increment_likes_count', {
        post_id: postId
      });

      if (updateError) throw updateError;

      return { error: null };
    } catch (err) {
      console.error('いいねエラー:', err);
      error.value = err.message;
      return { error: err };
    } finally {
      loading.value = false;
    }
  };

  /**
   * いいねを削除
   * @param {string} postId - 投稿ID
   * @param {string} userId - ユーザーID
   */
  const unlikePost = async (postId, userId) => {
    loading.value = true;
    error.value = null;

    try {
      // いいねを削除
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // 投稿のいいね数を更新
      const { error: updateError } = await supabase.rpc('decrement_likes_count', {
        post_id: postId
      });

      if (updateError) throw updateError;

      return { error: null };
    } catch (err) {
      console.error('いいね解除エラー:', err);
      error.value = err.message;
      return { error: err };
    } finally {
      loading.value = false;
    }
  };

  /**
   * ユーザーが投稿をいいねしているか確認
   * @param {string} postId - 投稿ID
   * @param {string} userId - ユーザーID
   */
  const checkLiked = async (postId, userId) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      return { liked: !!data, error: null };
    } catch (err) {
      console.error('いいね確認エラー:', err);
      return { liked: false, error: err };
    }
  };

  return {
    loading,
    error,
    likePost,
    unlikePost,
    checkLiked
  };
}
