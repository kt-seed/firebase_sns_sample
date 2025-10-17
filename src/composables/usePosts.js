import { ref } from 'vue';
import { supabase } from '@/lib/supabase';

const PAGE_SIZE = 20;

const adaptPost = (row) => ({
  timeline_id: `post-${row.id}`,
  type: 'post',
  created_at: row.created_at,
  post: row,
  repost_user: null
});

const adaptRepost = (row) => ({
  timeline_id: `repost-${row.id}`,
  type: 'repost',
  created_at: row.created_at,
  post: row.posts,
  repost_user: row.user
});

export function usePosts() {
  const posts = ref([]);
  const loading = ref(false);
  const appending = ref(false);
  const error = ref(null);
  const hasMore = ref(true);

  const context = ref({
    filter: 'all',
    userId: null,
    followingIds: [],
    postCursor: null,
    repostCursor: null
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

  const buildPostQuery = async (filter, userId, cursor, cachedFollowingIds = []) => {
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

  const buildRepostQuery = async (filter, userId, cursor, cachedFollowingIds = []) => {
    let reposterIds = cachedFollowingIds;

    if (filter === 'following') {
      if (!userId) {
        return { query: null, followingIds: [] };
      }

      if (!reposterIds.length) {
        reposterIds = await fetchFollowingIds(userId);
      }

      if (!reposterIds.includes(userId)) {
        reposterIds = [...reposterIds, userId];
      }

      if (!reposterIds.length) {
        return { query: null, followingIds: reposterIds };
      }
    }

    let query = supabase
      .from('reposts')
      .select(
        `
        id,
        created_at,
        user:users!reposts_user_id_fkey (
          id,
          display_name,
          icon
        ),
        posts (
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
        )
      `
      )
      .order('created_at', { ascending: false });

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    if (filter === 'following' && reposterIds.length) {
      query = query.in('user_id', reposterIds);
    }

    return { query, followingIds: reposterIds };
  };

  const mergeEntries = (postRows = [], repostRows = []) => {
    const postEntries = (postRows ?? []).map(adaptPost);
    const repostEntries = (repostRows ?? []).map(adaptRepost).filter((entry) => !!entry.post);

    const combined = [...postEntries, ...repostEntries].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return combined;
  };

  const fetchTimeline = async ({ filter = 'all', userId = null } = {}) => {
    loading.value = true;
    error.value = null;

    try {
      const { query: postQuery, followingIds } = await buildPostQuery(filter, userId, null);
      const { query: repostQuery, followingIds: nextFollowingIds } = await buildRepostQuery(
        filter,
        userId,
        null,
        followingIds
      );

      const postsResult = postQuery ? await postQuery.limit(PAGE_SIZE) : { data: [], error: null };
      if (postsResult.error) throw postsResult.error;

      const repostResult = repostQuery
        ? await repostQuery.limit(PAGE_SIZE)
        : { data: [], error: null };
      if (repostResult.error) throw repostResult.error;

      const combined = mergeEntries(postsResult.data, repostResult.data);

      posts.value = combined;

      const postCursor = postsResult.data && postsResult.data.length === PAGE_SIZE
        ? postsResult.data[postsResult.data.length - 1].created_at
        : null;
      const repostCursor = repostResult.data && repostResult.data.length === PAGE_SIZE
        ? repostResult.data[repostResult.data.length - 1].created_at
        : null;

      hasMore.value = !!(postCursor || repostCursor);
      context.value = {
        filter,
        userId,
        followingIds: nextFollowingIds,
        postCursor,
        repostCursor
      };

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

  const appendEntries = (entries = []) => {
    if (!entries.length) return;

    const map = new Map(posts.value.map((entry) => [entry.timeline_id, entry]));
    for (const entry of entries) {
      map.set(entry.timeline_id, entry);
    }
    posts.value = Array.from(map.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  };

  const loadMore = async () => {
    const { filter, userId, followingIds, postCursor, repostCursor } = context.value;

    if (!hasMore.value || appending.value) {
      return { data: [], error: null };
    }

    if (!postCursor && !repostCursor) {
      hasMore.value = false;
      return { data: [], error: null };
    }

    appending.value = true;
    error.value = null;

    try {
      const postQueryContext = await buildPostQuery(filter, userId, postCursor, followingIds);
      const repostQueryContext = await buildRepostQuery(filter, userId, repostCursor, followingIds);

      const postsResult = postCursor && postQueryContext.query
        ? await postQueryContext.query.limit(PAGE_SIZE)
        : { data: [], error: null };
      if (postsResult.error) throw postsResult.error;

      const repostResult = repostCursor && repostQueryContext.query
        ? await repostQueryContext.query.limit(PAGE_SIZE)
        : { data: [], error: null };
      if (repostResult.error) throw repostResult.error;

      const combined = mergeEntries(postsResult.data, repostResult.data);
      appendEntries(combined);

      const nextPostCursor = postsResult.data && postsResult.data.length === PAGE_SIZE
        ? postsResult.data[postsResult.data.length - 1].created_at
        : null;
      const nextRepostCursor = repostResult.data && repostResult.data.length === PAGE_SIZE
        ? repostResult.data[repostResult.data.length - 1].created_at
        : null;

      context.value = {
        filter,
        userId,
        followingIds,
        postCursor: nextPostCursor,
        repostCursor: nextRepostCursor
      };

      hasMore.value = !!(nextPostCursor || nextRepostCursor);

      return { data: combined, error: null };
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

      appendEntries([adaptPost(data)]);
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

      posts.value = posts.value.filter((entry) => entry.post.id !== postId);
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
            appendEntries([adaptPost(data)]);
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
          posts.value = posts.value.filter((entry) => entry.post.id !== payload.old.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reposts'
        },
        async (payload) => {
          if (filter === 'following') {
            const targetIds = context.value.followingIds;
            if (!targetIds.includes(payload.new.user_id)) {
              return;
            }
          }

          const { data } = await supabase
            .from('reposts')
            .select(
              `
              id,
              created_at,
              user:users!reposts_user_id_fkey (
                id,
                display_name,
                icon
              ),
              posts (
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
              )
            `
            )
            .eq('id', payload.new.id)
            .single();

          if (data && data.posts) {
            appendEntries([adaptRepost(data)]);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'reposts'
        },
        (payload) => {
          posts.value = posts.value.filter((entry) => entry.timeline_id !== `repost-${payload.old.id}`);
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
