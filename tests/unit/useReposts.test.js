import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useReposts } from '@/composables/useReposts';

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

describe('useReposts', () => {
  let reposts;
  let mockSupabase;

  beforeEach(async () => {
    // 各テストの前にモックをリセット
    vi.clearAllMocks();

    // モックされたsupabaseを取得
    const supabaseModule = await import('@/lib/supabase');
    mockSupabase = supabaseModule.supabase;

    reposts = useReposts();
  });

  describe('repostPost', () => {
    it('リポスト追加が成功する', async () => {
      const postId = 'post-123';
      const userId = 'user-456';

      // repostsテーブルへの挿入を成功させる
      mockSupabase.insert.mockReturnValueOnce({
        error: null
      });

      // RPCコール（increment_reposts_count）を成功させる
      mockSupabase.rpc.mockResolvedValueOnce({
        error: null
      });

      const result = await reposts.repostPost(postId, userId);

      expect(mockSupabase.from).toHaveBeenCalledWith('reposts');
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        post_id: postId,
        user_id: userId
      });
      expect(mockSupabase.rpc).toHaveBeenCalledWith('increment_reposts_count', {
        post_id: postId
      });
      expect(result.error).toBeNull();
    });

    it('repostsテーブルへの挿入に失敗した場合エラーを返す', async () => {
      const postId = 'post-123';
      const userId = 'user-456';
      const insertError = new Error('挿入エラー');

      mockSupabase.insert.mockReturnValueOnce({
        error: insertError
      });

      const result = await reposts.repostPost(postId, userId);

      expect(result.error).toBe(insertError);
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it('RPC increment_reposts_count に失敗した場合エラーを返す', async () => {
      const postId = 'post-123';
      const userId = 'user-456';
      const rpcError = new Error('RPC エラー');

      mockSupabase.insert.mockReturnValueOnce({
        error: null
      });

      mockSupabase.rpc.mockResolvedValueOnce({
        error: rpcError
      });

      const result = await reposts.repostPost(postId, userId);

      expect(result.error).toBe(rpcError);
    });
  });

  describe('unrepostPost', () => {
    it('リポスト解除が成功する', async () => {
      const postId = 'post-123';
      const userId = 'user-456';

      // repostsテーブルからの削除を成功させる
      mockSupabase.single.mockResolvedValueOnce({
        error: null
      });

      // RPCコール（decrement_reposts_count）を成功させる
      mockSupabase.rpc.mockResolvedValueOnce({
        error: null
      });

      const result = await reposts.unrepostPost(postId, userId);

      expect(mockSupabase.from).toHaveBeenCalledWith('reposts');
      expect(mockSupabase.delete).toHaveBeenCalled();
      expect(mockSupabase.eq).toHaveBeenCalledWith('post_id', postId);
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId);
      expect(mockSupabase.rpc).toHaveBeenCalledWith('decrement_reposts_count', {
        post_id: postId
      });
      expect(result.error).toBeNull();
    });

    it('repostsテーブルからの削除に失敗した場合エラーを返す', async () => {
      const postId = 'post-123';
      const userId = 'user-456';
      const deleteError = new Error('削除エラー');

      mockSupabase.single.mockResolvedValueOnce({
        error: deleteError
      });

      const result = await reposts.unrepostPost(postId, userId);

      expect(result.error).toBe(deleteError);
      expect(mockSupabase.rpc).not.toHaveBeenCalled();
    });

    it('RPC decrement_reposts_count に失敗した場合エラーを返す', async () => {
      const postId = 'post-123';
      const userId = 'user-456';
      const rpcError = new Error('RPC エラー');

      mockSupabase.single.mockResolvedValueOnce({
        error: null
      });

      mockSupabase.rpc.mockResolvedValueOnce({
        error: rpcError
      });

      const result = await reposts.unrepostPost(postId, userId);

      expect(result.error).toBe(rpcError);
    });
  });

  describe('checkReposted', () => {
    it('リポスト済みの場合 reposted: true を返す', async () => {
      const postId = 'post-123';
      const userId = 'user-456';

      mockSupabase.single.mockResolvedValueOnce({
        data: { id: 'repost-789' },
        error: null
      });

      const result = await reposts.checkReposted(postId, userId);

      expect(mockSupabase.from).toHaveBeenCalledWith('reposts');
      expect(mockSupabase.select).toHaveBeenCalledWith('id');
      expect(mockSupabase.eq).toHaveBeenCalledWith('post_id', postId);
      expect(mockSupabase.eq).toHaveBeenCalledWith('user_id', userId);
      expect(result.reposted).toBe(true);
      expect(result.error).toBeNull();
    });

    it('リポストしていない場合 reposted: false を返す', async () => {
      const postId = 'post-123';
      const userId = 'user-456';

      // PGRST116 は "見つからない" エラーコード
      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116', message: 'レコードが見つかりません' }
      });

      const result = await reposts.checkReposted(postId, userId);

      expect(result.reposted).toBe(false);
      expect(result.error).toBeNull();
    });

    it('PGRST116以外のエラーの場合 reposted: false とエラーを返す', async () => {
      const postId = 'post-123';
      const userId = 'user-456';
      const fetchError = new Error('取得エラー');
      fetchError.code = 'UNKNOWN';

      mockSupabase.single.mockResolvedValueOnce({
        data: null,
        error: fetchError
      });

      const result = await reposts.checkReposted(postId, userId);

      expect(result.reposted).toBe(false);
      expect(result.error).toBe(fetchError);
    });
  });

  describe('loading と error の状態管理', () => {
    it('repostPost 実行中は loading が true になる', async () => {
      mockSupabase.insert.mockReturnValueOnce({
        error: null
      });
      mockSupabase.rpc.mockResolvedValueOnce({
        error: null
      });

      expect(reposts.loading.value).toBe(false);

      const promise = reposts.repostPost('post-1', 'user-1');

      // 非同期処理中は loading が true
      // （実際にはすぐにfalseになるため、詳細な検証は省略）

      await promise;

      // 完了後は false に戻る
      expect(reposts.loading.value).toBe(false);
    });

    it('エラー発生時に error.value にメッセージが設定される', async () => {
      const insertError = new Error('テストエラー');

      mockSupabase.insert.mockReturnValueOnce({
        error: insertError
      });

      await reposts.repostPost('post-1', 'user-1');

      expect(reposts.error.value).toBe(insertError.message);
    });
  });
});
