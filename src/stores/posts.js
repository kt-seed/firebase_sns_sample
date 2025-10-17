import { defineStore } from 'pinia';
import { usePosts } from '@/composables/usePosts';

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
