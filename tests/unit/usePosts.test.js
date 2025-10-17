import { describe, it, expect, beforeEach, vi } from 'vitest';

const fromMock = vi.fn();
const channelMock = vi.fn(() => ({
  on: vi.fn().mockReturnThis(),
  subscribe: vi.fn(() => ({ unsubscribe: vi.fn() }))
}));
const removeChannelMock = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {},
    from: fromMock,
    channel: channelMock,
    removeChannel: removeChannelMock
  }
}));

const importUsePosts = async () => {
  const module = await import('@/composables/usePosts.js');
  return module.usePosts;
};

describe('usePosts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    fromMock.mockReset();
  });

  it('タイムラインを取得し posts 状態を更新する', async () => {
    const postsData = [
      {
        id: 'post-1',
        user_id: 'user-1',
        text: 'こんにちは',
        created_at: '2024-01-01T00:00:00.000Z'
      },
      {
        id: 'post-2',
        user_id: 'user-2',
        text: 'こんばんは',
        created_at: '2024-01-02T00:00:00.000Z'
      }
    ];

    const postsBuilder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: postsData, error: null }),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      insert: vi.fn(),
      delete: vi.fn()
    };

    fromMock.mockImplementation((table) => {
      if (table === 'posts') {
        return postsBuilder;
      }
      if (table === 'follows') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: [], error: null })
          }))
        };
      }
      return {};
    });

    const usePosts = await importUsePosts();
    const { posts, fetchTimeline, hasMore } = usePosts();
    const { error } = await fetchTimeline();

    expect(error).toBeNull();
    expect(posts.value).toHaveLength(2);
    expect(posts.value[0].id).toBe('post-1');
    expect(hasMore.value).toBe(false);
  });

  it('フォローが無くてもホームタブで自分の投稿を取得できる', async () => {
    const postsData = [
      {
        id: 'post-self',
        user_id: 'user-1',
        text: '自分の投稿',
        created_at: '2024-01-05T00:00:00.000Z'
      }
    ];

    const postsBuilder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: postsData, error: null }),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      insert: vi.fn(),
      delete: vi.fn()
    };

    const followsEqMock = vi.fn().mockResolvedValue({ data: [], error: null });
    const followsSelectMock = vi.fn(() => ({
      eq: followsEqMock
    }));

    fromMock.mockImplementation((table) => {
      if (table === 'posts') {
        return postsBuilder;
      }
      if (table === 'follows') {
        return {
          select: followsSelectMock
        };
      }
      return {};
    });

    const usePosts = await importUsePosts();
    const { posts, fetchTimeline, hasMore } = usePosts();
    const { error } = await fetchTimeline({ filter: 'following', userId: 'user-1' });

    expect(error).toBeNull();
    expect(posts.value).toHaveLength(1);
    expect(posts.value[0].id).toBe('post-self');
    expect(followsEqMock).toHaveBeenCalledWith('follower_id', 'user-1');
    expect(postsBuilder.in).toHaveBeenCalledWith('user_id', ['user-1']);
    expect(hasMore.value).toBe(false);
  });

  it('createPost 実行時に投稿が追加される', async () => {
    const insertedPost = {
      id: 'post-10',
      user_id: 'user-1',
      text: 'テスト投稿',
      created_at: '2024-01-03T00:00:00.000Z'
    };

    const singleMock = vi.fn().mockResolvedValue({
      data: insertedPost,
      error: null
    });
    const selectAfterInsertMock = vi.fn(() => ({
      single: singleMock
    }));
    const insertMock = vi.fn(() => ({
      select: selectAfterInsertMock
    }));

    const postsBuilder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      insert: insertMock,
      delete: vi.fn()
    };

    fromMock.mockImplementation((table) => {
      if (table === 'posts') {
        return postsBuilder;
      }
      if (table === 'follows') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: [], error: null })
          }))
        };
      }
      return {};
    });

    const usePosts = await importUsePosts();
    const { posts, createPost } = usePosts();
    const { data, error } = await createPost(' テスト投稿 ', 'user-1');

    expect(error).toBeNull();
    expect(data).toEqual(insertedPost);
    expect(posts.value[0]).toEqual(insertedPost);
    expect(insertMock).toHaveBeenCalledWith({
      user_id: 'user-1',
      text: 'テスト投稿'
    });
  });

  it('認証されていない状態で createPost を呼ぶとエラーを返す', async () => {
    const usePosts = await importUsePosts();
    const { createPost } = usePosts();

    const { error } = await createPost('投稿できない', null);
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe('ユーザーが認証されていません。');
  });

  it('deletePost 実行で投稿が削除される', async () => {
    const deleteEqMock = vi.fn().mockResolvedValue({ error: null });
    const deleteMock = vi.fn(() => ({
      eq: deleteEqMock
    }));

    const postsBuilder = {
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      insert: vi.fn(),
      delete: deleteMock
    };

    fromMock.mockImplementation((table) => {
      if (table === 'posts') {
        return postsBuilder;
      }
      return {};
    });

    const usePosts = await importUsePosts();
    const { posts, deletePost } = usePosts();
    posts.value = [
      { id: 'post-1', user_id: 'user-1', text: '残す' },
      { id: 'post-2', user_id: 'user-1', text: '削除する' }
    ];

    const { error } = await deletePost('post-2');

    expect(error).toBeNull();
    expect(posts.value).toHaveLength(1);
    expect(posts.value[0].id).toBe('post-1');
    expect(deleteEqMock).toHaveBeenCalledWith('id', 'post-2');
  });
});
