import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PostForm from '@/components/posts/PostForm.vue';

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    success: toastSuccessMock,
    error: toastErrorMock
  })
}));

const authStoreMock = {
  isAuthenticated: true,
  user: { value: { id: 'user-1' } }
};

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStoreMock
}));

const postsStoreMock = {
  createPost: vi.fn()
};

vi.mock('@/stores/posts', () => ({
  usePostsStore: () => postsStoreMock
}));

describe('PostForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authStoreMock.isAuthenticated = true;
    authStoreMock.user.value = { id: 'user-1' };
    postsStoreMock.createPost.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
  });

  it('未ログイン状態で投稿しようとするとエラーを表示する', async () => {
    authStoreMock.isAuthenticated = false;
    const wrapper = mount(PostForm);

    await wrapper.find('form').trigger('submit.prevent');

    expect(toastErrorMock).toHaveBeenCalledWith('ログイン後に投稿できます。');
    expect(postsStoreMock.createPost).not.toHaveBeenCalled();
  });

  it('正常に投稿が完了した場合はフォームをリセットする', async () => {
    postsStoreMock.createPost.mockResolvedValue({
      data: { id: 'post-1' },
      error: null
    });

    const wrapper = mount(PostForm);
    const textarea = wrapper.find('textarea');

    await textarea.setValue('  テスト投稿  ');
    await wrapper.find('form').trigger('submit.prevent');

    expect(postsStoreMock.createPost).toHaveBeenCalledWith('テスト投稿', 'user-1');
    expect(toastSuccessMock).toHaveBeenCalledWith('投稿しました。');
    expect(textarea.element.value).toBe('');
  });
});
