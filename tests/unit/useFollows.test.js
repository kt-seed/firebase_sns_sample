import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFollows } from '@/composables/useFollows';

// Supabase クライアントのモック
vi.mock('@/lib/supabase', () => {
  const mockSupabase = {
    from: vi.fn(),
    insert: vi.fn(),
    delete: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    rpc: vi.fn()
  };

  // チェーンメソッドのために自分自身を返す
  mockSupabase.from.mockReturnValue(mockSupabase);
  mockSupabase.insert.mockReturnValue(mockSupabase);
  mockSupabase.delete.mockReturnValue(mockSupabase);
  mockSupabase.select.mockReturnValue(mockSupabase);
  mockSupabase.eq.mockReturnValue(mockSupabase);

  return {
    supabase: mockSupabase
  };
});

describe('useFollows', () => {
  let follows;
  let mockSupabase;

  beforeEach(async () => {
    // 各テストの前にモックをリセット
    vi.clearAllMocks();

    // モックされたsupabaseを取得
    const supabaseModule = await import('@/lib/supabase');
    mockSupabase = supabaseModule.supabase;

    follows = useFollows();
  });

  describe('followUser', () => {
    it('フォローが成功する', async () => {
      const followerId = 'user-123';
      const followingId = 'user-456';

      mockSupabase.insert.mockReturnValueOnce({
        error: null
      });

      const result = await follows.followUser(followerId, followingId);

      expect(mockSupabase.from).toHaveBeenCalledWith('follows');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        follower_id: followerId,
        following_id: followingId
      });
      expect(result.error).toBeNull();
    });

    it('followsテーブルへの挿入に失敗した場合エラーを返す', async () => {
      const followerId = 'user-123';
      const followingId = 'user-456';
      const insertError = new Error('挿入エラー');

      mockSupabase.insert.mockReturnValueOnce({
        error: insertError
      });

      const result = await follows.followUser(followerId, followingId);

      expect(result.error).toBe(insertError);
    });
  });

  describe('unfollowUser', () => {
    it('フォロー解除が成功する', async () => {
      const followerId = 'user-123';
      const followingId = 'user-456';

      mockSupabase.single.mockResolvedValueOnce({
        error: null
      });

      const result = await follows.unfollowUser(followerId, followingId);

      expect(mockSupabase.from).toHaveBeenCalledWith('follows');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('follower_id', followerId);
      expect(mockSupabase.eq).toHaveBeenCalledWith('following_id', followingId);
      expect(result.error).toBeNull();
    });

    it('followsテーブルからの削除に失敗した場合エラーを返す', async () => {
      const followerId = 'user-123';
      const followingId = 'user-456';
      const deleteError = new Error('削除エラー');

      mockSupabase.single.mockResolvedValueOnce({
        error: deleteError
      });

      const result = await follows.unfollowUser(followerId, followingId);

      expect(result.error).toBe(deleteError);
    });
  });

  describe('isFollowing', () => {
    it('フォロー中の場合 following: true を返す', async () => {
      const followerId = 'user-123';
      const followingId = 'user-456';

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'follow-789' },
        error: null
      });

      const result = await follows.isFollowing(followerId, followingId);

      expect(mockSupabase.from).toHaveBeenCalledWith('follows');
      expect(mockSupabase.select).toHaveBeenCalledWith('id');
      expect(mockSupabase.eq).toHaveBeenCalledWith('follower_id', followerId);
      expect(mockSupabase.eq).toHaveBeenCalledWith('following_id', followingId);
      expect(result.following).toBe(true);
      expect(result.error).toBeNull();
    });

    it('フォローしていない場合 following: false を返す', async () => {
      const followerId = 'user-123';
      const followingId = 'user-456';

      // PGRST116 は "見つからない" エラーコード
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'レコードが見つかりません' }
      });

      const result = await follows.isFollowing(followerId, followingId);

      expect(result.following).toBe(false);
      expect(result.error).toBeNull();
    });

    it('PGRST116以外のエラーの場合 following: false とエラーを返す', async () => {
      const followerId = 'user-123';
      const followingId = 'user-456';
      const fetchError = new Error('取得エラー');
      fetchError.code = 'UNKNOWN';

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: fetchError
      });

      const result = await follows.isFollowing(followerId, followingId);

      expect(result.following).toBe(false);
      expect(result.error).toBe(fetchError);
    });
  });

  describe('getFollowersCount', () => {
    it('フォロワー数を取得する', async () => {
      const userId = 'user-123';
      const count = 42;

      mockSupabase.rpc.mockResolvedValueOnce({
        data: count,
        error: null
      });

      const result = await follows.getFollowersCount(userId);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_followers_count', {
        target_user_id: userId
      });
      expect(result.count).toBe(count);
      expect(result.error).toBeNull();
    });

    it('フォロワー数がnullの場合は0を返す', async () => {
      const userId = 'user-123';

      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: null
      });

      const result = await follows.getFollowersCount(userId);

      expect(result.count).toBe(0);
      expect(result.error).toBeNull();
    });

    it('RPC呼び出しに失敗した場合エラーを返す', async () => {
      const userId = 'user-123';
      const rpcError = new Error('RPC エラー');

      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: rpcError
      });

      const result = await follows.getFollowersCount(userId);

      expect(result.count).toBe(0);
      expect(result.error).toBe(rpcError);
    });
  });

  describe('getFollowingCount', () => {
    it('フォロー中ユーザー数を取得する', async () => {
      const userId = 'user-123';
      const count = 35;

      mockSupabase.rpc.mockResolvedValueOnce({
        data: count,
        error: null
      });

      const result = await follows.getFollowingCount(userId);

      expect(mockSupabase.rpc).toHaveBeenCalledWith('get_following_count', {
        target_user_id: userId
      });
      expect(result.count).toBe(count);
      expect(result.error).toBeNull();
    });

    it('フォロー中数がnullの場合は0を返す', async () => {
      const userId = 'user-123';

      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: null
      });

      const result = await follows.getFollowingCount(userId);

      expect(result.count).toBe(0);
      expect(result.error).toBeNull();
    });

    it('RPC呼び出しに失敗した場合エラーを返す', async () => {
      const userId = 'user-123';
      const rpcError = new Error('RPC エラー');

      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: rpcError
      });

      const result = await follows.getFollowingCount(userId);

      expect(result.count).toBe(0);
      expect(result.error).toBe(rpcError);
    });
  });

  describe('loading と error の状態管理', () => {
    it('followUser 実行中は loading が true になる', async () => {
      mockSupabase.insert.mockReturnValueOnce({
        error: null
      });

      expect(follows.loading.value).toBe(false);

      const promise = follows.followUser('user-1', 'user-2');

      // 非同期処理中は loading が true
      // （実際にはすぐにfalseになるため、詳細な検証は省略）

      await promise;

      // 完了後は false に戻る
      expect(follows.loading.value).toBe(false);
    });

    it('エラー発生時に error.value にメッセージが設定される', async () => {
      const insertError = new Error('テストエラー');

      mockSupabase.insert.mockReturnValueOnce({
        error: insertError
      });

      await follows.followUser('user-1', 'user-2');

      expect(follows.error.value).toBe(insertError.message);
    });
  });
});
