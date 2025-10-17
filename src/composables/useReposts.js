import { ref } from 'vue';
import { supabase } from '@/lib/supabase';

export function useReposts() {
  const loading = ref(false);
  const error = ref(null);

  /**
   * リポストを作成
   * @param {string} postId - 投稿ID
   * @param {string} userId - ユーザーID
   */
  const repostPost = async (postId, userId) => {
    loading.value = true;
    error.value = null;

    try {
      // リポストを追加
      const { error: insertError } = await supabase.from('reposts').insert({
        post_id: postId,
        user_id: userId
      });

      if (insertError) throw insertError;

      // 投稿のリポスト数を更新
      const { error: updateError } = await supabase.rpc('increment_reposts_count', {
        post_id: postId
      });

      if (updateError) throw updateError;

      return { error: null };
    } catch (err) {
      console.error('リポストエラー:', err);
      error.value = err.message;
      return { error: err };
    } finally {
      loading.value = false;
    }
  };

  /**
   * リポストを削除
   * @param {string} postId - 投稿ID
   * @param {string} userId - ユーザーID
   */
  const unrepostPost = async (postId, userId) => {
    loading.value = true;
    error.value = null;

    try {
      // リポストを削除
      const { error: deleteError } = await supabase
        .from('reposts')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

      // 投稿のリポスト数を更新
      const { error: updateError } = await supabase.rpc('decrement_reposts_count', {
        post_id: postId
      });

      if (updateError) throw updateError;

      return { error: null };
    } catch (err) {
      console.error('リポスト解除エラー:', err);
      error.value = err.message;
      return { error: err };
    } finally {
      loading.value = false;
    }
  };

  /**
   * ユーザーが投稿をリポストしているか確認
   * @param {string} postId - 投稿ID
   * @param {string} userId - ユーザーID
   */
  const checkReposted = async (postId, userId) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('reposts')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      return { reposted: !!data, error: null };
    } catch (err) {
      console.error('リポスト確認エラー:', err);
      return { reposted: false, error: err };
    }
  };

  return {
    loading,
    error,
    repostPost,
    unrepostPost,
    checkReposted
  };
}
