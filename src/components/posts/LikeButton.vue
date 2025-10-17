<script setup>
const props = defineProps({
  count: {
    type: Number,
    default: 0
  },
  active: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggle']);

const handleClick = () => {
  if (props.loading) {
    return;
  }
  emit('toggle');
};
</script>

<template>
  <button
    type="button"
    class="like-button"
    :class="{ 'like-button--active': active }"
    :aria-pressed="active"
    :disabled="loading"
    data-testid="like-button"
    @click="handleClick"
  >
    <span class="like-button__icon" aria-hidden="true">
      {{ active ? '❤️' : '🤍' }}
    </span>
    <span class="like-button__label">
      いいね
    </span>
    <span class="like-button__count">
      {{ count }}
    </span>
  </button>
</template>

<style scoped>
.like-button {
  @apply inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition;
  @apply hover:border-pink-400 hover:text-pink-500 disabled:cursor-not-allowed disabled:opacity-60;
}

.like-button--active {
  @apply border-pink-400 bg-pink-50 text-pink-600;
}

.like-button__icon {
  @apply text-sm leading-none;
}

.like-button__label {
  @apply hidden sm:inline;
}

.like-button__count {
  @apply font-semibold;
}
</style>
