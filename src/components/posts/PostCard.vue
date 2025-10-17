<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { getIconEmoji } from '@/utils/icons';
import { formatRelativeTime, formatDateTime } from '@/utils/date';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';
import { useLikes } from '@/composables/useLikes';
import { useReposts } from '@/composables/useReposts';
import LikeButton from '@/components/posts/LikeButton.vue';
import RepostButton from '@/components/posts/RepostButton.vue';

const props = defineProps({
  post: {
    type: Object,
    required: true
  },
  isOwnPost: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['delete']);

const authStore = useAuthStore();
const toast = useToast();
const { likePost, unlikePost, checkLiked } = useLikes();
const { repostPost, unrepostPost, checkReposted } = useReposts();

const authorName = computed(() => props.post.users?.display_name ?? '名無し');
const authorIcon = computed(() => getIconEmoji(props.post.users?.icon));
const createdAt = computed(() => props.post.created_at);

const currentUserId = computed(() => authStore.user?.id ?? null);
const isAuthenticated = computed(() => !!currentUserId.value);

const likeCount = ref(props.post.likes_count ?? 0);
const repostCount = ref(props.post.reposts_count ?? 0);
const liked = ref(false);
const reposted = ref(false);
const likeProcessing = ref(false);
const repostProcessing = ref(false);

watch(
  () => props.post.likes_count,
  (value) => {
    if (typeof value === 'number') {
      likeCount.value = value;
    }
  }
);

watch(
  () => props.post.reposts_count,
  (value) => {
    if (typeof value === 'number') {
      repostCount.value = value;
    }
  }
);

const hydrateState = async () => {
  const userId = currentUserId.value;
  if (!userId) {
    liked.value = false;
    reposted.value = false;
    return;
  }

  const postId = props.post.id;
  if (!postId) return;

  try {
    const [likedResult, repostedResult] = await Promise.all([
      checkLiked(postId, userId),
      checkReposted(postId, userId)
    ]);

    if (!likedResult.error) {
      liked.value = !!likedResult.liked;
    }
    if (!repostedResult.error) {
      reposted.value = !!repostedResult.reposted;
    }
  } catch (error) {
    console.error('投稿インタラクション状態の取得に失敗しました:', error);
  }
};

onMounted(() => {
  hydrateState();
});

watch(
  () => [props.post.id, currentUserId.value],
  () => {
    hydrateState();
  }
);

const ensureAuthenticated = () => {
  if (!isAuthenticated.value) {
    toast.error('ログインすると利用できます。');
    return null;
  }
  return currentUserId.value;
};

const handleLikeToggle = async () => {
  const userId = ensureAuthenticated();
  if (!userId || likeProcessing.value) {
    return;
  }

  likeProcessing.value = true;
  const postId = props.post.id;

  try {
    if (liked.value) {
      const { error } = await unlikePost(postId, userId);
      if (error) throw error;
      liked.value = false;
      likeCount.value = Math.max(0, likeCount.value - 1);
    } else {
      const { error } = await likePost(postId, userId);
      if (error) throw error;
      liked.value = true;
      likeCount.value += 1;
    }
  } catch (error) {
    console.error('いいね更新に失敗しました:', error);
    toast.error('いいねの更新に失敗しました。');
  } finally {
    likeProcessing.value = false;
  }
};

const handleRepostToggle = async () => {
  const userId = ensureAuthenticated();
  if (!userId || repostProcessing.value) {
    return;
  }

  repostProcessing.value = true;
  const postId = props.post.id;

  try {
    if (reposted.value) {
      const { error } = await unrepostPost(postId, userId);
      if (error) throw error;
      reposted.value = false;
      repostCount.value = Math.max(0, repostCount.value - 1);
    } else {
      const { error } = await repostPost(postId, userId);
      if (error) throw error;
      reposted.value = true;
      repostCount.value += 1;
    }
  } catch (error) {
    console.error('リポスト更新に失敗しました:', error);
    toast.error('リポストの更新に失敗しました。');
  } finally {
    repostProcessing.value = false;
  }
};

const handleDelete = () => {
  emit('delete', props.post.id);
};
</script>

<template>
  <article class="post-card">
    <div class="flex items-start gap-4">
      <div class="icon-wrapper">
        <span class="text-3xl">{{ authorIcon }}</span>
      </div>

      <div class="flex-1">
        <header class="flex items-center gap-2">
          <h3 class="text-base font-semibold text-slate-900">{{ authorName }}</h3>
          <time
            class="text-xs text-slate-500"
            :datetime="createdAt"
            :title="formatDateTime(createdAt)"
          >
            {{ formatRelativeTime(createdAt) }}
          </time>
          <button
            v-if="isOwnPost"
            type="button"
            class="ml-auto text-xs text-red-500 hover:text-red-600 font-medium"
            @click="handleDelete"
          >
            削除
          </button>
        </header>

        <p class="mt-2 whitespace-pre-wrap break-words text-slate-800">
          {{ post.text }}
        </p>

        <footer class="mt-4 flex flex-wrap items-center gap-3">
          <LikeButton
            :count="likeCount"
            :active="liked"
            :loading="likeProcessing"
            @toggle="handleLikeToggle"
          />
          <RepostButton
            :count="repostCount"
            :active="reposted"
            :loading="repostProcessing"
            @toggle="handleRepostToggle"
          />
        </footer>
      </div>
    </div>
  </article>
</template>

<style scoped>
.post-card {
  @apply rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm hover:shadow-md transition-shadow;
}

.icon-wrapper {
  @apply w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center;
}
</style>
