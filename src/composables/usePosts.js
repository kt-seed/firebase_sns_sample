import { ref } from 'vue';
import { supabase } from '@/lib/supabase';

export function usePosts() {
  const posts = ref([]);
  const loading = ref(false);
  const error = ref(null);

  /**
   * タイムラインの投稿を取得（ユーザー情報とJOIN）
   * @param {number} limit - 取得する投稿数
   */
  const fetchTimeline = async (limit = 50) => {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select(
          `
          *,
          users (
            display_name,
            icon
          )
        `
        )
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      posts.value = data;
      return { data, error: null };
    } catch (err) {
      console.error('タイムライン取得エラー:', err);
      error.value = err.message;
      return { data: null, error: err };
    } finally {
      loading.value = false;
    }
  };

  /**
   * 特定ユーザーの投稿を取得
   * @param {string} userId - ユーザーID
   */
  const fetchUserPosts = async (userId) => {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select(
          `
          *,
          users (
            display_name,
            icon
          )
        `
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      return { data, error: null };
    } catch (err) {
      console.error('ユーザー投稿取得エラー:', err);
      error.value = err.message;
      return { data: null, error: err };
    } finally {
      loading.value = false;
    }
  };

  /**
   * 投稿を作成
   * @param {string} text - 投稿内容
   * @param {string} userId - 投稿者ID
   */
  const createPost = async (text, userId) => {
    loading.value = true;
    error.value = null;

    try {
      const { data, error: insertError } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          text: text.trim()
        })
        .select(
          `
          *,
          users (
            display_name,
            icon
          )
        `
        )
        .single();

      if (insertError) throw insertError;

      // ローカルの投稿リストに追加
      posts.value.unshift(data);

      return { data, error: null };
    } catch (err) {
      console.error('投稿作成エラー:', err);
      error.value = err.message;
      return { data: null, error: err };
    } finally {
      loading.value = false;
    }
  };

  /**
   * 投稿を削除
   * @param {string} postId - 投稿ID
   */
  const deletePost = async (postId) => {
    loading.value = true;
    error.value = null;

    try {
      const { error: deleteError } = await supabase.from('posts').delete().eq('id', postId);

      if (deleteError) throw deleteError;

      // ローカルの投稿リストから削除
      posts.value = posts.value.filter((post) => post.id !== postId);

      return { error: null };
    } catch (err) {
      console.error('投稿削除エラー:', err);
      error.value = err.message;
      return { error: err };
    } finally {
      loading.value = false;
    }
  };

  /**
   * リアルタイムで投稿を購読
   */
  const subscribeToTimeline = () => {
    const channel = supabase
      .channel('timeline-posts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        async (payload) => {
          // 新規投稿をユーザー情報と共に取得
          const { data } = await supabase
            .from('posts')
            .select(
              `
              *,
              users (
                display_name,
                icon
              )
            `
            )
            .eq('id', payload.new.id)
            .single();

          if (data) {
            posts.value.unshift(data);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'posts'
        },
        (payload) => {
          posts.value = posts.value.filter((post) => post.id !== payload.old.id);
        }
      )
      .subscribe();

    // クリーンアップ関数を返す
    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    posts,
    loading,
    error,
    fetchTimeline,
    fetchUserPosts,
    createPost,
    deletePost,
    subscribeToTimeline
  };
}
