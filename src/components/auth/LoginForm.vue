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

// true のときはサインアップ、false のときはログインフォームを表示する
const isSignUp = ref(false);
const email = ref('');
const password = ref('');
const displayName = ref('');
const selectedIcon = ref(DEFAULT_ICON);
const loading = ref(false);

const MAX_DISPLAY_NAME_LENGTH = 20;

const remainingChars = computed(() => MAX_DISPLAY_NAME_LENGTH - displayName.value.length);
const isDisplayNameTooLong = computed(() => displayName.value.length > MAX_DISPLAY_NAME_LENGTH);

const isFormValid = computed(() => {
  const emailValid = email.value.trim().length > 0;
  const passwordValid = password.value.length >= 6;

  if (isSignUp.value) {
    const displayNameValid =
      displayName.value.trim().length > 0 && !isDisplayNameTooLong.value;
    return emailValid && passwordValid && displayNameValid;
  }

  return emailValid && passwordValid;
});

// 認証ボタン押下時のエントリーポイント
const handleSubmit = async () => {
  if (!isFormValid.value) {
    toast.error('入力内容を確認してください');
    return;
  }

  loading.value = true;

  try {
    if (isSignUp.value) {
      const { error: signUpError } = await signUp(
        email.value,
        password.value,
        displayName.value.trim(),
        selectedIcon.value
      );

      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          toast.error('このメールアドレスは既に登録されています');
        } else {
          toast.error(`サインアップに失敗しました: ${signUpError.message}`);
        }
        return;
      }

      toast.success('アカウントが作成されました');
      router.push('/');
    } else {
      const { error: signInError } = await signIn(email.value, password.value);

      if (signInError) {
        toast.error('メールアドレスまたはパスワードが正しくありません');
        return;
      }

      toast.success('ログインしました');
      router.push('/');
    }
  } catch (err) {
    console.error('認証エラー:', err);
    toast.error('エラーが発生しました');
  } finally {
    loading.value = false;
  }
};

const toggleMode = () => {
  isSignUp.value = !isSignUp.value;
  email.value = '';
  password.value = '';
  displayName.value = '';
  selectedIcon.value = DEFAULT_ICON;
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {{ isSignUp ? 'アカウント作成' : 'ログイン' }}
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          匿名SNSへようこそ
        </p>
      </div>

      <form @submit.prevent="handleSubmit" class="mt-8 space-y-6">
        <div class="rounded-md shadow-sm space-y-4">
          <div v-if="isSignUp">
            <label for="displayName" class="block text-sm font-medium text-gray-700 mb-1">
              表示名
              <span class="text-red-500">*</span>
            </label>
            <input
              id="displayName"
              v-model="displayName"
              type="text"
              required
              :maxlength="MAX_DISPLAY_NAME_LENGTH"
              class="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="ニックネーム"
            />
            <div class="mt-1 text-right">
              <span
                :class="[
                  'text-xs',
                  isDisplayNameTooLong ? 'text-red-500 font-bold' : 'text-gray-500'
                ]"
              >
                {{ remainingChars >= 0 ? remainingChars : 0 }} 文字残り
              </span>
            </div>
          </div>

          <div v-if="isSignUp">
            <IconPicker v-model="selectedIcon" />
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
              <span class="text-red-500">*</span>
            </label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-gray-700 mb-1">
              パスワード
              <span class="text-red-500">*</span>
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              minlength="6"
              class="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="6文字以上"
            />
            <p class="mt-1 text-xs text-gray-500">
              パスワードは6文字以上で入力してください
            </p>
          </div>
        </div>

        <div>
          <button
            type="submit"
            :disabled="loading || !isFormValid"
            class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span v-if="loading" class="flex items-center gap-2">
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
              {{ isSignUp ? 'アカウント作成' : 'ログイン' }}
            </span>
          </button>
        </div>

        <div class="text-center">
          <button
            type="button"
            @click="toggleMode"
            class="text-blue-600 hover:text-blue-500 text-sm font-medium transition-colors"
          >
            {{
              isSignUp
                ? 'すでにアカウントをお持ちの方はこちら'
                : 'アカウントをお持ちでない方はこちら'
            }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
