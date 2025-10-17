import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const mockAuth = {
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  getSession: vi.fn(),
  onAuthStateChange: vi.fn()
};

const fromMock = vi.fn();
const removeChannelMock = vi.fn();

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: mockAuth,
    from: fromMock,
    removeChannel: removeChannelMock,
    channel: vi.fn()
  }
}));

const importUseAuth = async () => {
  const module = await import('@/composables/useAuth.js');
  return module.useAuth;
};

describe('useAuth', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    fromMock.mockReset();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('メールとパスワードでサインアップできる', async () => {
    mockAuth.signUp.mockResolvedValue({
      data: { user: { id: 'user-1' } },
      error: null
    });

    const useAuth = await importUseAuth();
    const { signUp } = useAuth();
    const result = await signUp('test@example.com', 'password', 'テストユーザー', 'icon-cat');

    expect(mockAuth.signUp).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
      options: {
        data: {
          display_name: 'テストユーザー',
          icon: 'icon-cat'
        }
      }
    });
    expect(result.error).toBeNull();
  });

  it('サインインが失敗した場合はエラーを返す', async () => {
    const authError = new Error('invalid credentials');
    mockAuth.signInWithPassword.mockResolvedValue({
      data: null,
      error: authError
    });

    const useAuth = await importUseAuth();
    const { signIn } = useAuth();
    const result = await signIn('test@example.com', 'wrong-password');

    expect(mockAuth.signInWithPassword).toHaveBeenCalled();
    expect(result.error).toBe(authError);
  });

  it('initAuth 呼び出しでプロフィールが存在しない場合は作成する', async () => {
    const user = {
      id: 'user-1',
      email: 'test@example.com',
      user_metadata: {}
    };

    mockAuth.getSession.mockResolvedValue({
      data: { session: { user } },
      error: null
    });

    mockAuth.onAuthStateChange.mockReturnValue({
      data: {
        subscription: {
          unsubscribe: vi.fn()
        }
      }
    });

    const maybeSingleMock = vi.fn().mockResolvedValue({
      data: null,
      error: null
    });
    const eqMock = vi.fn(() => ({
      maybeSingle: maybeSingleMock
    }));
    const selectMock = vi.fn(() => ({
      eq: eqMock
    }));
    const insertMock = vi.fn().mockResolvedValue({ error: null });

    fromMock.mockImplementation((table) => {
      if (table === 'users') {
        return {
          select: selectMock,
          insert: insertMock
        };
      }
      return {};
    });

    const useAuth = await importUseAuth();
    const { initAuth } = useAuth();
    await initAuth();

    expect(selectMock).toHaveBeenCalledWith('id');
    expect(eqMock).toHaveBeenCalledWith('id', 'user-1');
    expect(maybeSingleMock).toHaveBeenCalled();
    expect(insertMock).toHaveBeenCalledWith({
      id: 'user-1',
      email: 'test@example.com',
      display_name: 'test',
      icon: 'icon-cat'
    });
  });
});
