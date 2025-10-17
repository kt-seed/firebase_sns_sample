<script setup>
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import Header from '@/components/common/Header.vue';
import IconPicker from '@/components/users/IconPicker.vue';
import { useAuthStore } from '@/stores/auth';
import { useUsersStore } from '@/stores/users';
import { useToast } from '@/composables/useToast';
import { useFollows } from '@/composables/useFollows';
import { supabase } from '@/lib/supabase';
import { DEFAULT_ICON, getIconEmoji } from '@/utils/icons';

const route = useRoute();
const authStore = useAuthStore();
const usersStore = useUsersStore();
const toast = useToast();
const { getFollowersCount, getFollowingCount } = useFollows();

const profile = ref(null);
const profileLoading = ref(true);
const profileError = ref('');

const displayName = ref('');
const selectedIcon = ref(DEFAULT_ICON);
const email = ref('');
const bio = ref('');

const newPassword = ref('');
const confirmPassword = ref('');

const savingProfile = ref(false);
const changingPassword = ref(false);
const countsLoading = ref(true);

const postCount = ref(0);
const followersCount = ref(0);
const followingCount = ref(0);

const routeUserId = computed(() => route.params.id ?? null);
const currentUserId = computed(() => authStore.user?.id ?? null);
const effectiveUserId = computed(() => {
  if (routeUserId.value && routeUserId.value !== 'me') {
    return routeUserId.value;
  }
  return currentUserId.value ?? null;
});
const isOwnProfile = computed(
  () => !!currentUserId.value && effectiveUserId.value === currentUserId.value
);

const avatarEmoji = computed(() => getIconEmoji(profile.value?.icon ?? selectedIcon.value));

const loadCounts = async (targetUserId) => {
  if (!targetUserId) return;
  countsLoading.value = true;

  try {
    const [followersResult, followingResult] = await Promise.all([
      getFollowersCount(targetUserId),
      getFollowingCount(targetUserId)
    ]);

    if (followersResult.error) throw followersResult.error;
    if (followingResult.error) throw followingResult.error;

    const { count: posts, error: postsError } = await supabase
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', targetUserId);

    if (postsError) throw postsError;

    postCount.value = posts ?? 0;
    followersCount.value = followersResult.count ?? 0;
    followingCount.value = followingResult.count ?? 0;
  } catch (error) {
    console.error('プロフィール統計の取得に失敗しました:', error);
    toast.error('プロフィール情報の取得に失敗しました。');
  } finally {
    countsLoading.value = false;
  }
};

const loadProfile = async (targetUserId) => {
  if (!targetUserId) return;

  profileLoading.value = true;
  profileError.value = '';

  try {
    const { data, error } = await usersStore.fetchUserProfile(targetUserId);

    if (error) {
      throw error;
    }

    profile.value = data;
    displayName.value = data?.display_name ?? '';
    selectedIcon.value = data?.icon ?? DEFAULT_ICON;
    email.value = data?.email ?? '';
    bio.value = data?.bio ?? '';
  } catch (error) {
    console.error('プロフィール取得に失敗しました:', error);
    profile.value = null;
    profileError.value = 'プロフィール情報の取得に失敗しました。';
  } finally {
    profileLoading.value = false;
  }
};

const handleProfileSave = async () => {
  if (!isOwnProfile.value) {
    toast.error('プロフィールの編集は本人のみ可能です。');
    return;
  }

  if (!displayName.value.trim()) {
    toast.error('表示名を入力してください。');
    return;
  }

  savingProfile.value = true;

  try {
    const { error } = await authStore.updateProfile(
      displayName.value.trim(),
      selectedIcon.value,
      bio.value.trim()
    );

    if (error) throw error;

    toast.success('プロフィールを更新しました。');
    await loadProfile(effectiveUserId.value);
  } catch (error) {
    console.error('プロフィール更新に失敗しました:', error);
    toast.error('プロフィールの更新に失敗しました。');
  } finally {
    savingProfile.value = false;
  }
};

const handlePasswordChange = async () => {
  if (!isOwnProfile.value) {
    toast.error('パスワードの変更は本人のみ可能です。');
    return;
  }

  if (newPassword.value.length < 6) {
    toast.error('パスワードは6文字以上で設定してください。');
    return;
  }

  if (newPassword.value !== confirmPassword.value) {
    toast.error('確認用パスワードが一致しません。');
    return;
  }

  changingPassword.value = true;

  try {
    const { error } = await authStore.updatePassword(newPassword.value);
    if (error) throw error;

    toast.success('パスワードを更新しました。');
    newPassword.value = '';
    confirmPassword.value = '';
  } catch (error) {
    console.error('パスワード更新に失敗しました:', error);
    toast.error('パスワードの更新に失敗しました。');
  } finally {
    changingPassword.value = false;
  }
};

watch(
  effectiveUserId,
  async (targetId) => {
    if (!targetId) {
      profile.value = null;
      return;
    }
    await loadProfile(targetId);
    await loadCounts(targetId);
  },
  { immediate: true }
);
</script>

<template>
  <div class="min-h-screen bg-slate-100">
    <Header />
    <main class="container mx-auto max-w-5xl px-4 py-8">
      <div v-if="profileLoading" class="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p class="text-slate-500">プロフィール情報を読み込み中です...</p>
      </div>

      <div v-else-if="profileError" class="rounded-xl border border-red-200 bg-white p-8 text-center shadow-sm">
        <p class="text-red-500">{{ profileError }}</p>
      </div>

      <div v-else-if="!profile" class="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p class="text-slate-500">指定されたユーザーのプロフィールが見つかりませんでした。</p>
      </div>

      <div v-else class="grid gap-6 md:grid-cols-3">
        <section class="space-y-6 md:col-span-2">
          <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="flex items-center gap-4">
              <div class="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 text-3xl">
                {{ avatarEmoji }}
              </div>
              <div>
                <h1 class="text-2xl font-semibold text-slate-800">{{ profile.display_name }}</h1>
                <p class="text-sm text-slate-500">ユーザーID: {{ profile.id }}</p>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-800">プロフィール編集</h2>
            <p v-if="!isOwnProfile" class="mt-2 text-sm text-slate-500">
              他のユーザーのプロフィールは閲覧のみ可能です。
            </p>

            <form v-if="isOwnProfile" class="mt-6 space-y-6" @submit.prevent="handleProfileSave">
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">表示名</label>
                <input
                  v-model="displayName"
                  type="text"
                  maxlength="50"
                  required
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">プロフィールアイコン</label>
                <IconPicker v-model="selectedIcon" />
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">自己紹介</label>
                <textarea
                  v-model="bio"
                  rows="4"
                  maxlength="160"
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="自己紹介を入力してください（任意）"
                />
              </div>

              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="savingProfile"
                  class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {{ savingProfile ? '更新中...' : 'プロフィールを更新' }}
                </button>
              </div>
            </form>

            <div v-else class="mt-6 space-y-4">
              <div>
                <h3 class="text-sm font-semibold text-slate-700">表示名</h3>
                <p class="text-slate-600">{{ profile.display_name }}</p>
              </div>
              <div>
                <h3 class="text-sm font-semibold text-slate-700">自己紹介</h3>
                <p class="text-slate-600">
                  {{ profile.bio ? profile.bio : '自己紹介は未設定です。' }}
                </p>
              </div>
            </div>
          </div>

          <div
            v-if="isOwnProfile"
            class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 class="text-lg font-semibold text-slate-800">パスワードの変更</h2>

            <form class="mt-6 space-y-6" @submit.prevent="handlePasswordChange">
              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">新しいパスワード</label>
                <input
                  v-model="newPassword"
                  type="password"
                  minlength="6"
                  required
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="6文字以上で入力"
                />
              </div>

              <div>
                <label class="mb-2 block text-sm font-medium text-slate-700">確認用パスワード</label>
                <input
                  v-model="confirmPassword"
                  type="password"
                  minlength="6"
                  required
                  class="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="新しいパスワードを再入力"
                />
              </div>

              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="changingPassword"
                  class="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {{ changingPassword ? '更新中...' : 'パスワードを変更' }}
                </button>
              </div>
            </form>
          </div>
        </section>

        <aside class="space-y-6">
          <div
            v-if="isOwnProfile"
            class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 class="text-lg font-semibold text-slate-800">アカウント情報</h2>
            <dl class="mt-4 space-y-3 text-sm">
              <div class="flex items-center justify-between">
                <dt class="text-slate-500">メールアドレス</dt>
                <dd class="font-medium text-slate-800">{{ email }}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-slate-500">ユーザーID</dt>
                <dd class="font-medium text-slate-800">{{ profile.id }}</dd>
              </div>
            </dl>
          </div>

          <div v-else class="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
            このユーザーのメールアドレスは表示されません。
          </div>

          <div class="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 class="text-lg font-semibold text-slate-800">アクティビティ</h2>

            <div v-if="countsLoading" class="mt-4 text-sm text-slate-500">
              集計情報を読み込み中です...
            </div>

            <dl v-else class="mt-4 space-y-3 text-sm">
              <div class="flex items-center justify-between">
                <dt class="text-slate-500">投稿数</dt>
                <dd class="font-medium text-slate-800">{{ postCount }}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-slate-500">フォロワー</dt>
                <dd class="font-medium text-slate-800">{{ followersCount }}</dd>
              </div>
              <div class="flex items-center justify-between">
                <dt class="text-slate-500">フォロー中</dt>
                <dd class="font-medium text-slate-800">{{ followingCount }}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </main>
  </div>
</template>
