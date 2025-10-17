<script setup>
// 認証フォームを表示するシンプルなラッパー
import LoginForm from '@/components/auth/LoginForm.vue';
</script>

<template>
  <div class="login-page">
    <LoginForm />
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  background-color: #f9fafb;
}
</style>
