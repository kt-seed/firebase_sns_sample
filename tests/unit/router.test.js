import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';
import { computed, ref } from 'vue';

// useAuthStore のモック
const mockIsAuthenticatedValue = ref(false);
const mockUseAuthStore = vi.fn(() => ({
  isAuthenticated: computed(() => mockIsAuthenticatedValue.value)
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: mockUseAuthStore
}));

describe('Router - 認証ガード', () => {
  let router;

  // ルート定義（実際のルーターと同じ構造）
  const routes = [
    {
      path: '/',
      name: 'home',
      component: { template: '<div>Home</div>' },
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: { template: '<div>Login</div>' }
    },
    {
      path: '/profile/:id',
      name: 'profile',
      component: { template: '<div>Profile</div>' },
      meta: { requiresAuth: true }
    },
    {
      path: '/posts/:id',
      name: 'post-detail',
      component: { template: '<div>PostDetail</div>' },
      meta: { requiresAuth: true }
    }
  ];

  beforeEach(() => {
    // ルーターのインスタンスを作成
    router = createRouter({
      history: createMemoryHistory(),
      routes
    });

    // 認証ガードを追加（実際のルーターと同じロジック）
    router.beforeEach((to, from, next) => {
      const authStore = mockUseAuthStore();
      const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

      if (requiresAuth && !authStore.isAuthenticated.value) {
        // 認証が必要なページで未ログインの場合、ログインページへリダイレクト
        next('/login');
      } else if (to.path === '/login' && authStore.isAuthenticated.value) {
        // ログイン済みの場合、ログインページへのアクセスをホームへリダイレクト
        next('/');
      } else {
        next();
      }
    });

    // モックのリセット
    mockIsAuthenticatedValue.value = false;
    mockUseAuthStore.mockClear();
  });

  describe('非ログイン時の動作', () => {
    beforeEach(() => {
      mockIsAuthenticatedValue.value = false;
    });

    it('認証が必要なページ(/)にアクセスすると/loginへリダイレクト', async () => {
      await router.push('/');
      expect(router.currentRoute.value.path).toBe('/login');
    });

    it('認証が必要なページ(/profile/:id)にアクセスすると/loginへリダイレクト', async () => {
      await router.push('/profile/user-123');
      expect(router.currentRoute.value.path).toBe('/login');
    });

    it('認証が必要なページ(/posts/:id)にアクセスすると/loginへリダイレクト', async () => {
      await router.push('/posts/post-456');
      expect(router.currentRoute.value.path).toBe('/login');
    });

    it('/loginにアクセスするとそのまま通過', async () => {
      await router.push('/login');
      expect(router.currentRoute.value.path).toBe('/login');
    });
  });

  describe('ログイン済みの動作', () => {
    beforeEach(() => {
      mockIsAuthenticatedValue.value = true;
    });

    it('認証が必要なページ(/)にアクセスするとそのまま通過', async () => {
      await router.push('/');
      expect(router.currentRoute.value.path).toBe('/');
    });

    it('認証が必要なページ(/profile/:id)にアクセスするとそのまま通過', async () => {
      await router.push('/profile/user-123');
      expect(router.currentRoute.value.path).toBe('/profile/user-123');
    });

    it('認証が必要なページ(/posts/:id)にアクセスするとそのまま通過', async () => {
      await router.push('/posts/post-456');
      expect(router.currentRoute.value.path).toBe('/posts/post-456');
    });

    it('/loginにアクセスすると/へリダイレクト', async () => {
      await router.push('/login');
      expect(router.currentRoute.value.path).toBe('/');
    });
  });

  describe('認証状態の変化', () => {
    it('非ログイン→ログイン後、/へアクセス可能', async () => {
      // 最初は非ログイン
      mockIsAuthenticatedValue.value = false;
      await router.push('/');
      expect(router.currentRoute.value.path).toBe('/login');

      // ログイン後
      mockIsAuthenticatedValue.value = true;
      await router.push('/');
      expect(router.currentRoute.value.path).toBe('/');
    });

    it('ログイン→ログアウト後、/にアクセスすると/loginへリダイレクト', async () => {
      // 最初はログイン済み
      mockIsAuthenticatedValue.value = true;
      await router.push('/');
      expect(router.currentRoute.value.path).toBe('/');

      // ログアウト後、一度/loginに移動してから/にアクセス
      mockIsAuthenticatedValue.value = false;
      await router.push('/login');
      expect(router.currentRoute.value.path).toBe('/login');

      // 再度/にアクセスするとリダイレクトされる
      await router.push('/');
      expect(router.currentRoute.value.path).toBe('/login');
    });
  });
});
