<script setup>
import { onMounted } from 'vue';
import { RouterView } from 'vue-router';
import ToastNotification from '@/components/common/ToastNotification.vue';
import { useAuth } from '@/composables/useAuth';

const { initAuth } = useAuth();

// アプリ起動時に Supabase のセッション状態を同期する
onMounted(async () => {
  await initAuth();
});
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
