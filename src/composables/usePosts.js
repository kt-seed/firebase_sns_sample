import { ref } from 'vue';
import { supabase } from '@/lib/supabase';

// 投稿タイムラインに関する CRUD とリアルタイム購読を提供する composable
export function usePosts() {
  const posts = ref([]);
  const loading = ref(false);
  const error = ref(null);

  // タイムライン投稿を最新順で取得する
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

  // 特定ユーザーの投稿だけを取得する
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

  // 新規投稿を作成し、ローカルタイムラインにも即時反映する
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

  // 投稿を削除し、ローカルキャッシュからも取り除く
  const deletePost = async (postId) => {
    loading.value = true;
    error.value = null;

    try {
      const { error: deleteError } = await supabase.from('posts').delete().eq('id', postId);

      if (deleteError) throw deleteError;

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

  // 投稿テーブルの INSERT / DELETE を購読し、ローカル状態をリアルタイム更新する
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

    // 呼び出し側でチャンネル破棄できるようクリーンアップ関数を返す
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
