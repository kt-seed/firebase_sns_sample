import { ref } from 'vue';
import { supabase } from '@/lib/supabase';

// リポスト操作とカウンター更新を扱う composable
export function useReposts() {
  const loading = ref(false);
  const error = ref(null);

  // リポストを作成し、投稿のリポスト数を増加させる
  const repostPost = async (postId, userId) => {
    loading.value = true;
    error.value = null;

    try {
      const { error: insertError } = await supabase.from('reposts').insert({
        post_id: postId,
        user_id: userId
      });

      if (insertError) throw insertError;

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

  // リポストを取り消し、投稿のリポスト数を減少させる
  const unrepostPost = async (postId, userId) => {
    loading.value = true;
    error.value = null;

    try {
      const { error: deleteError } = await supabase
        .from('reposts')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);

      if (deleteError) throw deleteError;

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

  // 指定投稿をリポスト済みかどうか確認する
  const checkReposted = async (postId, userId) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('reposts')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) throw fetchError;

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
