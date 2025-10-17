<script setup>
import { computed, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { usePostsStore } from '@/stores/posts';
import { useToast } from '@/composables/useToast';

const authStore = useAuthStore();
const postsStore = usePostsStore();
const toast = useToast();

const text = ref('');
const submitting = ref(false);

const MAX_CHAR_COUNT = 280;

const remainingChars = computed(() => MAX_CHAR_COUNT - text.value.length);
const isTooLong = computed(() => remainingChars.value < 0);
const isTextEmpty = computed(() => text.value.trim().length === 0);
const isAuthenticated = computed(() => authStore.isAuthenticated);
// Piniaストアから返されるrefは自動的にアンラップされるため、.valueは不要
const currentUserId = computed(() => authStore.user?.id ?? null);
const isSubmitDisabled = computed(
  () => submitting.value || !isAuthenticated.value || isTextEmpty.value || isTooLong.value
);

const placeholderText = computed(() =>
  isAuthenticated.value ? '今の気持ちをつぶやいてみましょう...' : 'ログインすると投稿できます。'
);

const resetForm = () => {
  text.value = '';
};

const handleSubmit = async () => {
  if (!isAuthenticated.value) {
    toast.error('ログイン後に投稿できます。');
    return;
  }

  if (isSubmitDisabled.value) {
    return;
  }

  submitting.value = true;

  try {
    const trimmed = text.value.trim();
    const { error } = await postsStore.createPost(trimmed, currentUserId.value);

    if (error) {
      toast.error('投稿に失敗しました。もう一度お試しください。');
      return;
    }

    toast.success('投稿しました。');
    resetForm();
  } catch (error) {
    console.error('投稿処理でエラーが発生しました:', error);
    toast.error('投稿に失敗しました。しばらくしてから再度お試しください。');
  } finally {
    submitting.value = false;
  }
};
</script>

<template>
  <div class="post-form">
    <form @submit.prevent="handleSubmit">
      <textarea
        v-model="text"
        class="post-textarea"
        :placeholder="placeholderText"
        :maxlength="MAX_CHAR_COUNT * 2"
        :disabled="!authStore.isAuthenticated"
      />

      <div class="mt-3 flex items-center justify-between text-sm">
        <span :class="['text-xs', isTooLong ? 'text-red-500 font-semibold' : 'text-slate-500']">
          残り {{ Math.max(remainingChars, 0) }} 文字
        </span>
        <button
          type="submit"
          class="submit-button"
          :disabled="isSubmitDisabled"
        >
          {{ submitting ? '投稿中...' : '投稿する' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.post-form {
  @apply rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm;
}

.post-textarea {
  @apply w-full min-h-[120px] resize-none border border-slate-200 rounded-lg px-4 py-3 text-base text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:text-slate-400 transition;
}

.submit-button {
  @apply inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition;
}
</style>
