import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestingPinia } from '../utils/pinia';

const mockPosts = { value: [] };
const mockHasMore = { value: false };
const fetchTimelineMock = vi.fn();
const loadMoreMock = vi.fn();
const createPostMock = vi.fn();
const deletePostMock = vi.fn();
const subscribeMock = vi.fn();

const usePostsMock = vi.fn(() => ({
  posts: mockPosts,
  hasMore: mockHasMore,
  fetchTimeline: fetchTimelineMock,
  loadMore: loadMoreMock,
  createPost: createPostMock,
  deletePost: deletePostMock,
  subscribeToTimeline: subscribeMock
}));

vi.mock('@/composables/usePosts', () => ({
  usePosts: usePostsMock
}));

describe('usePostsStore', () => {
  let usePostsStore;

  beforeEach(async () => {
    vi.resetModules();
    createTestingPinia();

    mockPosts.value = [];
    mockHasMore.value = false;
    fetchTimelineMock.mockReset().mockResolvedValue({ error: null });
    loadMoreMock.mockReset().mockResolvedValue({ error: null });
    createPostMock.mockReset().mockResolvedValue({ data: null, error: null });
    deletePostMock.mockReset().mockResolvedValue({ error: null });
    subscribeMock.mockReset().mockReturnValue(() => {});
    usePostsMock.mockClear();

    const module = await import('@/stores/posts.js');
    usePostsStore = module.usePostsStore;
  });

  it('usePosts composable の戻り値がそのまま展開される', async () => {
    const store = usePostsStore();
    expect(usePostsMock).toHaveBeenCalledTimes(1);
    expect(store.posts.value).toStrictEqual(mockPosts.value);
    const params = { filter: 'all' };
    await store.fetchTimeline(params);
    expect(fetchTimelineMock).toHaveBeenCalledWith(params);
  });

  it('createPost を呼び出すと composable の関数が実行される', async () => {
    const store = usePostsStore();
    await store.createPost('テスト', 'user-1');
    expect(createPostMock).toHaveBeenCalledWith('テスト', 'user-1');
  });

  it('subscribeToTimeline の戻り値を変換せずに返す', () => {
    const unsubscribe = () => {};
    subscribeMock.mockReturnValue(unsubscribe);

    const store = usePostsStore();
    const result = store.subscribeToTimeline({ filter: 'all' });

    expect(subscribeMock).toHaveBeenCalledWith({ filter: 'all' });
    expect(result).toBe(unsubscribe);
  });
});
