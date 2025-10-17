<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import { getIconEmoji } from '@/utils/icons';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const displayName = computed(() => {
  const user = authStore.user.value;
  if (!user) {
    return 'ゲスト';
  }
  return user.user_metadata?.display_name ?? user.email ?? 'ゲスト';
});

const profileIcon = computed(() => {
  const user = authStore.user.value;
  return getIconEmoji(user?.user_metadata?.icon);
});

const handleLogOut = async () => {
  const { error } = await authStore.signOut();
  if (error) {
    toast.error('ログアウトに失敗しました。');
    return;
  }
  toast.info('ログアウトしました。');
  router.push('/login');
};
</script>

<template>
  <header class="app-header">
    <RouterLink to="/" class="brand">
      匿名SNS
    </RouterLink>

    <div class="flex items-center gap-6">
      <RouterLink to="/" class="nav-link">
        ホーム
      </RouterLink>

      <RouterLink v-if="!authStore.isAuthenticated" to="/login" class="primary-button">
        ログイン
      </RouterLink>

      <div v-else class="flex items-center gap-3">
        <div class="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-sm text-slate-700">
          <span class="text-xl leading-none">{{ profileIcon }}</span>
          <span>{{ displayName }}</span>
        </div>
        <button type="button" class="secondary-button" @click="handleLogOut">
          ログアウト
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  @apply sticky top-0 z-40 flex items-center justify-between bg-white border-b border-slate-200 px-6 py-4 shadow-sm;
}

.brand {
  @apply text-xl font-bold text-slate-900 hover:text-blue-600 transition-colors;
}

.nav-link {
  @apply text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors;
}

.primary-button {
  @apply inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors;
}

.secondary-button {
  @apply inline-flex items-center px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-100 transition-colors;
}
</style>
