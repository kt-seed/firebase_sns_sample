import { describe, it, expect, beforeEach, afterEach, afterAll, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import Timeline from '@/components/posts/Timeline.vue';

const toastInfoMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    info: toastInfoMock,
    error: toastErrorMock
  })
}));

let postsValue;
let hasMoreValue;

const postsStoreMock = {
  loading: false,
  appending: false,
  fetchTimeline: vi.fn(),
  loadMore: vi.fn(),
  deletePost: vi.fn(),
  subscribeToTimeline: vi.fn()
};

Object.defineProperty(postsStoreMock, 'posts', {
  get: () => postsValue,
  set: (val) => {
    postsValue = val;
  }
});

Object.defineProperty(postsStoreMock, 'hasMore', {
  get: () => hasMoreValue,
  set: (val) => {
    hasMoreValue = val;
  }
});

vi.mock('@/stores/posts', () => ({
  usePostsStore: () => postsStoreMock
}));

let isAuthenticatedValue;
let authUserValue = null;

const authStoreMock = {};

Object.defineProperty(authStoreMock, 'isAuthenticated', {
  get: () => isAuthenticatedValue,
  set: (val) => {
    isAuthenticatedValue = val;
  }
});

Object.defineProperty(authStoreMock, 'user', {
  get: () => authUserValue,
  set: (val) => {
    authUserValue = val;
  }
});

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => authStoreMock
}));

const PostCardStub = {
  template: `<div class="post-card-stub" @click="$emit('delete', post.id)">{{ post.text }}</div>`,
  props: {
    post: {
      type: Object,
      required: true
    },
    isOwnPost: {
      type: Boolean,
      default: false
    },
    repostUser: {
      type: Object,
      default: null
    }
  }
};

const originalIntersectionObserver = globalThis.IntersectionObserver;

let intersectionCallback;
let observeMock;
let disconnectMock;

const mountTimeline = () =>
  mount(Timeline, {
    global: {
      stubs: {
        PostCard: PostCardStub
      }
    }
  });

beforeEach(() => {
  postsValue = [];
  hasMoreValue = true;

  postsStoreMock.fetchTimeline.mockResolvedValue({ error: null });
  postsStoreMock.loadMore.mockResolvedValue({ error: null });
  postsStoreMock.deletePost.mockResolvedValue({ error: null });
  postsStoreMock.subscribeToTimeline.mockReturnValue(() => {});

  isAuthenticatedValue = true;
  authStoreMock.user = { id: 'user-1' };

  toastInfoMock.mockReset();
  toastErrorMock.mockReset();

  observeMock = vi.fn();
  disconnectMock = vi.fn();
  intersectionCallback = undefined;

  globalThis.IntersectionObserver = vi.fn((callback) => {
    intersectionCallback = callback;
    return {
      observe: observeMock,
      disconnect: disconnectMock,
      unobserve: vi.fn()
    };
  });
});

afterEach(() => {
  vi.clearAllMocks();
});

afterAll(() => {
  globalThis.IntersectionObserver = originalIntersectionObserver;
});

describe('Timeline.vue', () => {
  it('未ログイン時にホームタブを開くとタイムライン取得をスキップする', async () => {
    authStoreMock.isAuthenticated = false;
    authStoreMock.user = null;

    const wrapper = mountTimeline();
    await flushPromises();

    expect(postsStoreMock.fetchTimeline).not.toHaveBeenCalled();
    expect(postsStoreMock.hasMore).toBe(false);

    const emptyState = wrapper.find('.empty-state');
    expect(emptyState.exists()).toBe(true);
    expect(emptyState.text()).toBe('ホームタイムラインを表示するにはログインが必要です。');
  });

  it('タブ切り替えでフィルターが変更される', async () => {
    const wrapper = mountTimeline();
    await flushPromises();

    expect(postsStoreMock.fetchTimeline).toHaveBeenCalledWith({
      filter: 'following',
      userId: 'user-1'
    });

    postsStoreMock.fetchTimeline.mockClear();

    const buttons = wrapper.findAll('button');
    await buttons[1].trigger('click');
    await flushPromises();

    expect(postsStoreMock.fetchTimeline).toHaveBeenCalledWith({
      filter: 'all',
      userId: 'user-1'
    });
  });

  it('投稿削除イベントでストア関数とトーストを呼び出す', async () => {
    postsStoreMock.posts = [
      {
        timeline_id: 'post-post-1',
        post: { id: 'post-1', user_id: 'user-1', text: 'テスト投稿' },
        repost_user: null
      }
    ];

    const wrapper = mountTimeline();
    await flushPromises();

    const card = wrapper.find('.post-card-stub');
    expect(card.exists()).toBe(true);

    await card.trigger('click');
    await flushPromises();

    expect(postsStoreMock.deletePost).toHaveBeenCalledWith('post-1');
    expect(toastInfoMock).toHaveBeenCalledWith('投稿を削除しました。');
  });

  it('IntersectionObserver の発火で追加ロード処理を実行する', async () => {
    const wrapper = mountTimeline();
    await flushPromises();

    expect(intersectionCallback).toBeTypeOf('function');

    await intersectionCallback([{ isIntersecting: true, target: {} }]);
    await flushPromises();

    expect(postsStoreMock.loadMore).toHaveBeenCalled();
  });
});
