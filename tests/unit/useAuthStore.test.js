import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createTestingPinia } from '../utils/pinia';

// useAuth composable のモック
const mockUser = { value: null };
const mockSession = { value: null };
const mockLoading = { value: false };
const signUpMock = vi.fn();
const signInMock = vi.fn();
const signOutMock = vi.fn();
const resetPasswordMock = vi.fn();
const initAuthMock = vi.fn();

const useAuthMock = vi.fn(() => ({
  user: mockUser,
  session: mockSession,
  loading: mockLoading,
  signUp: signUpMock,
  signIn: signInMock,
  signOut: signOutMock,
  resetPassword: resetPasswordMock,
  initAuth: initAuthMock
}));

vi.mock('@/composables/useAuth', () => ({
  useAuth: useAuthMock
}));

describe('useAuthStore', () => {
  let useAuthStore;

  beforeEach(async () => {
    vi.resetModules();
    createTestingPinia();

    // モックのリセット
    mockUser.value = null;
    mockSession.value = null;
    mockLoading.value = false;
    signUpMock.mockReset().mockResolvedValue({ error: null });
    signInMock.mockReset().mockResolvedValue({ error: null });
    signOutMock.mockReset().mockResolvedValue({ error: null });
    resetPasswordMock.mockReset().mockResolvedValue({ error: null });
    initAuthMock.mockReset();
    useAuthMock.mockClear();

    const module = await import('@/stores/auth.js');
    useAuthStore = module.useAuthStore;
  });

  it('useAuth composable の戻り値がそのまま展開される', () => {
    const store = useAuthStore();

    expect(useAuthMock).toHaveBeenCalledTimes(1);
    expect(store.user.value).toBe(mockUser.value);
    expect(store.session.value).toBe(mockSession.value);
    expect(store.loading.value).toBe(mockLoading.value);
  });

  it('signUp 関数が呼び出せる', async () => {
    const store = useAuthStore();
    const email = 'test@example.com';
    const password = 'password123';

    await store.signUp(email, password);

    expect(signUpMock).toHaveBeenCalledWith(email, password);
  });

  it('signIn 関数が呼び出せる', async () => {
    const store = useAuthStore();
    const email = 'test@example.com';
    const password = 'password123';

    await store.signIn(email, password);

    expect(signInMock).toHaveBeenCalledWith(email, password);
  });

  it('signOut 関数が呼び出せる', async () => {
    const store = useAuthStore();

    await store.signOut();

    expect(signOutMock).toHaveBeenCalled();
  });

  it('resetPassword 関数が呼び出せる', async () => {
    const store = useAuthStore();
    const email = 'test@example.com';

    await store.resetPassword(email);

    expect(resetPasswordMock).toHaveBeenCalledWith(email);
  });

  it('initAuth 関数が呼び出せる', () => {
    const store = useAuthStore();

    store.initAuth();

    expect(initAuthMock).toHaveBeenCalled();
  });

  it('user の状態が反映される', () => {
    const testUser = { id: 'user-123', email: 'test@example.com' };
    mockUser.value = testUser;

    const store = useAuthStore();

    expect(store.user.value).toBe(testUser);
  });

  it('session の状態が反映される', () => {
    const testSession = { access_token: 'token-abc', user: { id: 'user-123' } };
    mockSession.value = testSession;

    const store = useAuthStore();

    expect(store.session.value).toBe(testSession);
  });

  it('loading の状態が反映される', () => {
    mockLoading.value = true;

    const store = useAuthStore();

    expect(store.loading.value).toBe(true);
  });
});
