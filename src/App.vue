<script setup>
import { RouterView } from 'vue-router';
import ToastNotification from '@/components/common/ToastNotification.vue';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

// アプリ起動時に Supabase のセッション状態を同期する
// onMountedではなく、setup時点で実行して、ルーターガードが動作する前に認証状態を初期化する
authStore.initAuth();
</script>

<template>
  <div id="app">
    <ToastNotification />
    <RouterView />
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
}
</style>
