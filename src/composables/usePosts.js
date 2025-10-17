import { ref } from 'vue';
import { supabase } from '@/lib/supabase';

const PAGE_SIZE = 20;

export function usePosts() {
  const posts = ref([]);
  const loading = ref(false);
  const appending = ref(false);
  const error = ref(null);
  const hasMore = ref(true);

  const context = ref({
    filter: 'all', // all | following
    userId: null,
    followingIds: []
  });

  const fetchFollowingIds = async (userId) => {
    if (!userId) {
      return [];
    }

    const { data, error: followError } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', userId);

    if (followError) {
      throw followError;
    }

    return data.map((row) => row.following_id);
  };

  const buildQuery = async (filter, userId, cursor, cachedFollowingIds = []) => {
    let followingIds = cachedFollowingIds;

    if (filter === 'following') {
      if (!userId) {
        return { query: null, followingIds: [] };
      }

      if (!followingIds.length) {
        followingIds = await fetchFollowingIds(userId);
      }

      if (!followingIds.includes(userId)) {
        followingIds = [...followingIds, userId];
      }

      if (!followingIds.length) {
        return { query: null, followingIds };
      }
    }

    let query = supabase
      .from('posts')
      .select(
        `
        id,
        user_id,
        text,
        created_at,
        likes_count,
        reposts_count,
        users (
          id,
          display_name,
          icon
        )
      `
      )
      .order('created_at', { ascending: false });

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    if (filter === 'following' && followingIds.length) {
      query = query.in('user_id', followingIds);
    }

    return { query, followingIds };
  };

  const fetchTimeline = async ({ filter = 'all', userId = null } = {}) => {
    loading.value = true;
    error.value = null;

    try {
      const { query, followingIds } = await buildQuery(filter, userId, null);

      if (!query) {
        posts.value = [];
        hasMore.value = false;
        context.value = { filter, userId, followingIds };
        return { data: [], error: null };
      }

      const { data, error: fetchError } = await query.limit(PAGE_SIZE);
      if (fetchError) throw fetchError;

      posts.value = data ?? [];
      hasMore.value = (data?.length ?? 0) === PAGE_SIZE;
      context.value = { filter, userId, followingIds };

      return { data: posts.value, error: null };
    } catch (err) {
      console.error('タイムライン取得に失敗しました:', err);
      error.value = err.message;
      posts.value = [];
      hasMore.value = false;
      return { data: null, error: err };
    } finally {
      loading.value = false;
    }
  };

  const loadMore = async () => {
    if (!hasMore.value || appending.value || posts.value.length === 0) {
      return { data: [], error: null };
    }

    appending.value = true;
    error.value = null;

    try {
      const lastPost = posts.value[posts.value.length - 1];
      const { filter, userId, followingIds } = context.value;

      const { query, followingIds: nextFollowingIds } = await buildQuery(
        filter,
        userId,
        lastPost.created_at,
        followingIds
      );

      if (!query) {
        hasMore.value = false;
        context.value = { filter, userId, followingIds: nextFollowingIds };
        return { data: [], error: null };
      }

      const { data, error: fetchError } = await query.limit(PAGE_SIZE);
      if (fetchError) throw fetchError;

      if (data?.length) {
        posts.value.push(...data);
      }

      if (!data || data.length < PAGE_SIZE) {
        hasMore.value = false;
      }

      context.value = { filter, userId, followingIds: nextFollowingIds };

      return { data: data ?? [], error: null };
    } catch (err) {
      console.error('投稿の追加取得に失敗しました:', err);
      error.value = err.message;
      return { data: null, error: err };
    } finally {
      appending.value = false;
    }
  };

  const createPost = async (text, userId) => {
    if (!userId) {
      return { data: null, error: new Error('ユーザーが認証されていません。') };
    }

    try {
      const { data, error: insertError } = await supabase
        .from('posts')
        .insert({
          user_id: userId,
          text: text.trim()
        })
        .select(
          `
          id,
          user_id,
          text,
          created_at,
          likes_count,
          reposts_count,
          users (
            id,
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
      console.error('投稿の作成に失敗しました:', err);
      return { data: null, error: err };
    }
  };

  const deletePost = async (postId) => {
    try {
      const { error: deleteError } = await supabase.from('posts').delete().eq('id', postId);
      if (deleteError) throw deleteError;

      posts.value = posts.value.filter((post) => post.id !== postId);
      return { error: null };
    } catch (err) {
      console.error('投稿の削除に失敗しました:', err);
      return { error: err };
    }
  };

  const subscribeToTimeline = ({ filter = 'all', userId = null } = {}) => {
    const channel = supabase
      .channel(`timeline-${filter}-${userId ?? 'guest'}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'posts'
        },
        async (payload) => {
          if (filter === 'following') {
            const targetIds = context.value.followingIds;
            if (!targetIds.includes(payload.new.user_id)) {
              return;
            }
          }

          const { data } = await supabase
            .from('posts')
            .select(
              `
              id,
              user_id,
              text,
              created_at,
              likes_count,
              reposts_count,
              users (
                id,
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

    return () => {
      supabase.removeChannel(channel);
    };
  };

  return {
    posts,
    loading,
    appending,
    error,
    hasMore,
    fetchTimeline,
    loadMore,
    createPost,
    deletePost,
    subscribeToTimeline
  };
}
