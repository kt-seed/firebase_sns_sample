<script setup>
import { computed } from 'vue';
import { getIconEmoji } from '@/utils/icons';
import { formatRelativeTime, formatDateTime } from '@/utils/date';

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

const authorName = computed(() => props.post.users?.display_name ?? '名無し');
const authorIcon = computed(() => getIconEmoji(props.post.users?.icon));
const createdAt = computed(() => props.post.created_at);

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

        <footer class="mt-3 text-xs text-slate-500 flex gap-4">
          <span>いいね {{ post.likes_count ?? 0 }}</span>
          <span>リポスト {{ post.reposts_count ?? 0 }}</span>
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
