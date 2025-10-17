import { defineStore } from 'pinia';
import { usePosts } from '@/composables/usePosts';

// 投稿まわりのロジックを Pinia ストアとして公開する
export const usePostsStore = defineStore('posts', () => {
  const postComposable = usePosts();

  return {
    ...postComposable
  };
});
