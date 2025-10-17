import { describe, it, expect, vi, beforeEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import PostCard from '@/components/posts/PostCard.vue';

const likePostMock = vi.fn();
const unlikePostMock = vi.fn();
const checkLikedMock = vi.fn();
const repostPostMock = vi.fn();
const unrepostPostMock = vi.fn();
const checkRepostedMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: {
      id: 'user-1',
      user_metadata: { display_name: 'Tester', icon: 'icon-cat' },
      email: 'tester@example.com'
    },
    isAuthenticated: true
  })
}));

vi.mock('@/composables/useLikes', () => ({
  useLikes: () => ({
    likePost: likePostMock,
    unlikePost: unlikePostMock,
    checkLiked: checkLikedMock
  })
}));

vi.mock('@/composables/useReposts', () => ({
  useReposts: () => ({
    repostPost: repostPostMock,
    unrepostPost: unrepostPostMock,
    checkReposted: checkRepostedMock
  })
}));

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    success: toastSuccessMock,
    error: toastErrorMock
  })
}));

describe('PostCard', () => {
  beforeEach(() => {
    likePostMock.mockResolvedValue({ error: null });
    unlikePostMock.mockResolvedValue({ error: null });
    checkLikedMock.mockResolvedValue({ liked: false, error: null });
    repostPostMock.mockResolvedValue({ error: null });
    unrepostPostMock.mockResolvedValue({ error: null });
    checkRepostedMock.mockResolvedValue({ reposted: false, error: null });
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
  });

  const createWrapper = () =>
    mount(PostCard, {
      props: {
        post: {
          id: 'post-1',
          text: 'Hello world!',
          likes_count: 0,
          reposts_count: 0,
          created_at: new Date().toISOString(),
          users: {
            display_name: 'Tester',
            icon: 'icon-cat'
          }
        }
      }
    });

  it('いいねボタンのクリックで likePost が呼び出される', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    await wrapper.get('[data-testid="like-button"]').trigger('click');

    expect(likePostMock).toHaveBeenCalledWith('post-1', 'user-1');
  });

  it('リポストボタンのクリックで repostPost が呼び出される', async () => {
    const wrapper = createWrapper();
    await flushPromises();

    await wrapper.get('[data-testid="repost-button"]').trigger('click');

    expect(repostPostMock).toHaveBeenCalledWith('post-1', 'user-1');
  });
});
