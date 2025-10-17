import { defineStore } from 'pinia';
import { usePosts } from '@/composables/usePosts';

// 投稿周りのロジックを Pinia ストア経由で再利用できるようにする
export const usePostsStore = defineStore('posts', () => {
  const {
    posts,
    loading,
    error,
    fetchTimeline,
    fetchUserPosts,
    createPost,
    deletePost,
    subscribeToTimeline
  } = usePosts();

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
});
