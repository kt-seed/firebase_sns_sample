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
    class="repost-button"
    :class="{ 'repost-button--active': active }"
    :aria-pressed="active"
    :disabled="loading"
    data-testid="repost-button"
    @click="handleClick"
  >
    <span class="repost-button__icon" aria-hidden="true">🔁</span>
    <span class="repost-button__label">リポスト</span>
    <span class="repost-button__count">{{ count }}</span>
  </button>
</template>

<style scoped>
.repost-button {
  @apply inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 transition;
  @apply hover:border-emerald-400 hover:text-emerald-500 disabled:cursor-not-allowed disabled:opacity-60;
}

.repost-button--active {
  @apply border-emerald-400 bg-emerald-50 text-emerald-600;
}

.repost-button__icon {
  @apply text-sm leading-none;
}

.repost-button__label {
  @apply hidden sm:inline;
}

.repost-button__count {
  @apply font-semibold;
}
</style>
