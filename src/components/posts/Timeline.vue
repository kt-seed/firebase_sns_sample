<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import PostCard from '@/components/posts/PostCard.vue';
import { usePostsStore } from '@/stores/posts';
import { useAuthStore } from '@/stores/auth';
import { useToast } from '@/composables/useToast';

const postsStore = usePostsStore();
const authStore = useAuthStore();
const toast = useToast();
const isAuthenticated = computed(() => authStore.isAuthenticated);

const tabs = [
  { key: 'following', label: 'ホーム' },
  { key: 'all', label: 'すべて' }
];

const activeTab = ref('following');
const isInitialLoading = ref(false);
const sentinel = ref(null);
let observer;
let unsubscribeRealtime;

const refreshRealtimeSubscription = () => {
  if (unsubscribeRealtime) {
    unsubscribeRealtime();
    unsubscribeRealtime = null;
  }

  // Piniaストアから返されるrefは自動的にアンラップされるため、.valueは不要
  const userId = authStore.user?.id ?? null;
  unsubscribeRealtime = postsStore.subscribeToTimeline({
    filter: activeTab.value,
    userId
  });
};

const loadTimeline = async () => {
  if (activeTab.value === 'following' && !isAuthenticated.value) {
    postsStore.posts = [];
    postsStore.hasMore = false;
    return;
  }

  isInitialLoading.value = true;
  // Piniaストアから返されるrefは自動的にアンラップされるため、.valueは不要
  const userId = authStore.user?.id ?? null;
  const { error } = await postsStore.fetchTimeline({
    filter: activeTab.value,
    userId
  });
  isInitialLoading.value = false;

  if (error) {
    toast.error('タイムラインの読み込みに失敗しました。');
    return;
  }

  refreshRealtimeSubscription();
};

const loadMore = async () => {
  if (postsStore.loading || postsStore.appending || !postsStore.hasMore) {
    return;
  }

  const { error } = await postsStore.loadMore();
  if (error) {
    toast.error('追加の投稿取得に失敗しました。');
  }
};

const handleIntersection = (entries) => {
  const [entry] = entries;
  if (entry.isIntersecting) {
    loadMore();
  }
};

const setupObserver = () => {
  if (observer) {
    observer.disconnect();
  }

  observer = new IntersectionObserver(handleIntersection, {
    root: null,
    threshold: 1.0
  });

  if (sentinel.value) {
    observer.observe(sentinel.value);
  }
};

// Piniaストアから返されるrefは自動的にアンラップされるため、.valueは不要
watch(
  [activeTab, () => authStore.user?.id],
  () => {
    loadTimeline();
  },
  { immediate: true }
);

onMounted(() => {
  setupObserver();
});

onBeforeUnmount(() => {
  if (observer) {
    observer.disconnect();
  }
  if (unsubscribeRealtime) {
    unsubscribeRealtime();
  }
});

const emptyStateMessage = () => {
  if (activeTab.value === 'following') {
    if (!isAuthenticated.value) {
      return 'ホームタイムラインを表示するにはログインが必要です。';
    }
    return 'まだフォローしているユーザーの投稿がありません。';
  }

  return '投稿がまだありません。最初の投稿を作成してみましょう。';
};

// Piniaストアから返されるrefは自動的にアンラップされるため、.valueは不要
const isOwnPost = (entry) => authStore.user?.id === entry.post.user_id;

const handleDelete = async (postId) => {
  const { error } = await postsStore.deletePost(postId);
  if (error) {
    toast.error('投稿の削除に失敗しました。');
    return;
  }
  toast.info('投稿を削除しました。');
};
</script>

<template>
  <section>
    <nav class="tab-list">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        :class="['tab-item', tab.key === activeTab ? 'tab-item--active' : '']"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </nav>

    <div class="mt-4 space-y-4">
      <div v-if="isInitialLoading" class="loading-state">
        読み込み中...
      </div>

      <template v-else>
        <PostCard
          v-for="entry in postsStore.posts"
          :key="entry.timeline_id"
          :post="entry.post"
          :repost-user="entry.repost_user"
          :is-own-post="isOwnPost(entry)"
          @delete="handleDelete"
        />

        <p v-if="!postsStore.posts.length" class="empty-state">
          {{ emptyStateMessage() }}
        </p>
      </template>
    </div>

    <div ref="sentinel" class="h-1"></div>

    <div v-if="postsStore.appending" class="loading-more">
      さらに読み込み中...
    </div>
  </section>
</template>

<style scoped>
.tab-list {
  @apply flex gap-3 border-b border-slate-200;
}

.tab-item {
  @apply px-4 py-2 text-sm font-medium text-slate-500 rounded-t-lg transition-colors;
}

.tab-item--active {
  @apply bg-white text-slate-900 border border-slate-200 border-b-white;
}

.loading-state,
.loading-more {
  @apply text-sm text-slate-500 text-center py-4;
}

.empty-state {
  @apply text-sm text-slate-500 text-center py-10;
}
</style>
