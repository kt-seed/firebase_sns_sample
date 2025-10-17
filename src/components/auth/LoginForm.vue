<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { useToast } from '@/composables/useToast';
import IconPicker from '@/components/users/IconPicker.vue';
import { DEFAULT_ICON } from '@/utils/icons';

const router = useRouter();
const { signUp, signIn } = useAuth();
const toast = useToast();

const isSignUpMode = ref(false);
const email = ref('');
const password = ref('');
const displayName = ref('');
const selectedIcon = ref(DEFAULT_ICON);
const loading = ref(false);

const MAX_DISPLAY_NAME_LENGTH = 20;

const remainingChars = computed(() => MAX_DISPLAY_NAME_LENGTH - displayName.value.length);
const isDisplayNameTooLong = computed(() => remainingChars.value < 0);

const isFormValid = computed(() => {
  const emailValid = email.value.trim().length > 0;
  const passwordValid = password.value.length >= 6;

  if (!emailValid || !passwordValid) {
    return false;
  }

  if (isSignUpMode.value) {
    const name = displayName.value.trim();
    return name.length > 0 && !isDisplayNameTooLong.value;
  }

  return true;
});

const handleSubmit = async () => {
  if (!isFormValid.value) {
    toast.error('入力内容を確認してください。');
    return;
  }

  loading.value = true;

  try {
    if (isSignUpMode.value) {
      const { error } = await signUp(
        email.value,
        password.value,
        displayName.value.trim(),
        selectedIcon.value
      );

      if (error) {
        if (error.message?.includes('already registered')) {
          toast.error('このメールアドレスは既に登録されています。');
        } else {
          toast.error(`サインアップに失敗しました: ${error.message}`);
        }
        return;
      }

      toast.success('アカウントを作成しました。');
      router.push('/');
      return;
    }

    const { error } = await signIn(email.value, password.value);
    if (error) {
      toast.error('メールアドレスまたはパスワードが正しくありません。');
      return;
    }

    toast.success('ログインしました。');
    router.push('/');
  } catch (error) {
    console.error('認証処理でエラーが発生しました:', error);
    toast.error('エラーが発生しました。時間をおいて再試行してください。');
  } finally {
    loading.value = false;
  }
};

const toggleMode = () => {
  isSignUpMode.value = !isSignUpMode.value;
  email.value = '';
  password.value = '';
  displayName.value = '';
  selectedIcon.value = DEFAULT_ICON;
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
    <div class="w-full max-w-md space-y-8">
      <div class="text-center">
        <h2 class="mt-6 text-3xl font-bold text-gray-900">
          {{ isSignUpMode ? 'アカウント作成' : 'ログイン' }}
        </h2>
        <p class="mt-2 text-sm text-gray-600">
          匿名SNSへようこそ！
        </p>
      </div>

      <form class="mt-8 space-y-6" @submit.prevent="handleSubmit">
        <div class="space-y-4 rounded-md shadow-sm">
          <div v-if="isSignUpMode">
            <label for="displayName" class="block text-sm font-medium text-gray-700 mb-1">
              表示名 <span class="text-red-500">*</span>
            </label>
            <input
              id="displayName"
              v-model="displayName"
              type="text"
              required
              :maxlength="MAX_DISPLAY_NAME_LENGTH"
              class="input-field"
              placeholder="ニックネームを入力"
            />
            <div class="mt-1 text-right">
              <span
                :class="[
                  'text-xs',
                  isDisplayNameTooLong ? 'text-red-500 font-semibold' : 'text-gray-500'
                ]"
              >
                残り {{ Math.max(remainingChars, 0) }} 文字
              </span>
            </div>
          </div>

          <div v-if="isSignUpMode">
            <IconPicker v-model="selectedIcon" />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス <span class="text-red-500">*</span>
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="input-field"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              パスワード <span class="text-red-500">*</span>
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              minlength="6"
              class="input-field"
              placeholder="6文字以上で入力"
            />
            <p class="mt-1 text-xs text-gray-500">
              半角英数字6文字以上で設定してください。
            </p>
          </div>
        </div>

        <button
          type="submit"
          :disabled="loading || !isFormValid"
          class="submit-button"
        >
          <span v-if="loading" class="flex items-center justify-center gap-2">
            <svg class="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
                fill="none"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            処理中...
          </span>
          <span v-else>
            {{ isSignUpMode ? 'アカウント作成' : 'ログイン' }}
          </span>
        </button>

        <div class="text-center">
          <button
            type="button"
            class="toggle-button"
            @click="toggleMode"
          >
            {{
              isSignUpMode
                ? 'すでにアカウントをお持ちの方はこちら'
                : 'アカウントをお持ちでない方はこちら'
            }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<style scoped>
.input-field {
  @apply appearance-none rounded-md block w-full px-3 py-2 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition;
}

.submit-button {
  @apply w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}

.toggle-button {
  @apply text-blue-600 hover:text-blue-500 text-sm font-medium transition-colors;
}
</style>
