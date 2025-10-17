import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

// 画面構成ごとのルート定義
const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/Home.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/Login.vue')
  },
  {
    path: '/profile/:id',
    name: 'profile',
    component: () => import('@/views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/posts/:id',
    name: 'post-detail',
    component: () => import('@/views/PostDetail.vue'),
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// 認証ガード: 認証が必要なページへのアクセスを制御
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();

  await authStore.initAuth();

  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth);

  if (requiresAuth && !authStore.isAuthenticated) {
    next('/login');
  } else if (to.path === '/login' && authStore.isAuthenticated) {
    next('/');
  } else {
    next();
  }
});

export default router;
