import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestingPinia } from '../utils/pinia';

// Supabase クライアントのモック
const mockSupabase = {
  from: vi.fn(() => mockSupabase),
  select: vi.fn(() => mockSupabase),
  eq: vi.fn(() => mockSupabase),
  single: vi.fn()
};

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase
}));

describe('useUsersStore', () => {
  let useUsersStore;

  beforeEach(async () => {
    vi.resetModules();
    createTestingPinia();

    // モックのリセット
    vi.clearAllMocks();

    const module = await import('@/stores/users.js');
    useUsersStore = module.useUsersStore;
  });

  describe('fetchUserProfile', () => {
    it('ユーザープロフィールを正常に取得できる', async () => {
      const userId = 'user-123';
      const mockProfile = {
        id: userId,
        display_name: 'テストユーザー',
        icon: 'icon-cat',
        bio: 'こんにちは'
      };

      mockSupabase.single.mockResolvedValueOnce({
        data: mockProfile,
        error: null
      });

      const store = useUsersStore();
      const result = await store.fetchUserProfile(userId);

      expect(mockSupabase.from).toHaveBeenCalledWith('users');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', userId);
      expect(result.data).toEqual(mockProfile);
      expect(result.error).toBeNull();
      expect(store.profiles[userId]).toEqual(mockProfile);
    });

    it('userIdが未指定の場合エラーを返す', async () => {
      const store = useUsersStore();
      const result = await store.fetchUserProfile(null);

      expect(result.data).toBeNull();
      expect(result.error).toBeInstanceOf(Error);
      expect(result.error.message).toBe('ユーザーIDが指定されていません。');
      expect(mockSupabase.from).not.toHaveBeenCalled();
    });

    it('Supabaseからの取得に失敗した場合エラーを返す', async () => {
      const userId = 'user-123';
      const fetchError = new Error('取得エラー');

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: fetchError
      });

      const store = useUsersStore();
      const result = await store.fetchUserProfile(userId);

      expect(result.data).toBeNull();
      expect(result.error).toBe(fetchError);
      expect(store.error).toBe(fetchError.message);
    });

    it('同じユーザーを複数回取得しても、キャッシュに保存される', async () => {
      const userId = 'user-456';
      const mockProfile1 = {
        id: userId,
        display_name: 'ユーザー1'
      };
      const mockProfile2 = {
        id: userId,
        display_name: 'ユーザー2（更新後）'
      };

      mockSupabase.single
        .mockResolvedValueOnce({
          data: mockProfile1,
          error: null
        })
        .mockResolvedValueOnce({
          data: mockProfile2,
          error: null
        });

      const store = useUsersStore();

      await store.fetchUserProfile(userId);
      expect(store.profiles[userId]).toEqual(mockProfile1);

      await store.fetchUserProfile(userId);
      expect(store.profiles[userId]).toEqual(mockProfile2);
    });
  });

  describe('loading と error の状態管理', () => {
    it('fetchUserProfile 実行前は loading が false', () => {
      const store = useUsersStore();
      expect(store.loading).toBe(false);
    });

    it('fetchUserProfile 実行後は loading が false に戻る', async () => {
      const userId = 'user-123';

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: userId },
        error: null
      });

      const store = useUsersStore();

      const promise = store.fetchUserProfile(userId);
      await promise;

      expect(store.loading).toBe(false);
    });

    it('エラー発生時に error が設定される', async () => {
      const userId = 'user-123';
      const fetchError = new Error('テストエラー');

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: fetchError
      });

      const store = useUsersStore();
      await store.fetchUserProfile(userId);

      expect(store.error).toBe(fetchError.message);
    });
  });

  describe('profiles キャッシュ', () => {
    it('複数のユーザーを取得するとすべてキャッシュされる', async () => {
      const user1 = { id: 'user-1', display_name: 'ユーザー1' };
      const user2 = { id: 'user-2', display_name: 'ユーザー2' };

      mockSupabase.single
        .mockResolvedValueOnce({ data: user1, error: null })
        .mockResolvedValueOnce({ data: user2, error: null });

      const store = useUsersStore();

      await store.fetchUserProfile('user-1');
      await store.fetchUserProfile('user-2');

      expect(store.profiles['user-1']).toEqual(user1);
      expect(store.profiles['user-2']).toEqual(user2);
    });

    it('初期状態では profiles が空オブジェクト', () => {
      const store = useUsersStore();
      expect(store.profiles).toEqual({});
    });
  });
});
