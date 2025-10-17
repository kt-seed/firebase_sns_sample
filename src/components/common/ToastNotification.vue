<script setup>
import { useToast } from '@/composables/useToast';

const { toasts, removeToast } = useToast();

const toastClassMap = {
  success: 'bg-green-500 hover:bg-green-600',
  error: 'bg-red-500 hover:bg-red-600',
  warning: 'bg-yellow-500 hover:bg-yellow-600',
  info: 'bg-blue-500 hover:bg-blue-600'
};

const toastIconMap = {
  success: '✔',
  error: '✖',
  warning: '⚠',
  info: 'ℹ'
};

const resolveToastClass = (type) => {
  const baseClass =
    'px-6 py-4 rounded-lg shadow-lg text-white mb-3 transition-all duration-300 cursor-pointer';
  return `${baseClass} ${toastClassMap[type] ?? toastClassMap.info}`;
};

const resolveToastIcon = (type) => toastIconMap[type] ?? toastIconMap.info;
</script>

<template>
  <div class="fixed top-4 right-4 z-50 max-w-md">
    <transition-group name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="resolveToastClass(toast.type)"
        @click="removeToast(toast.id)"
      >
        <div class="flex items-start gap-3">
          <span class="text-lg font-bold leading-none pt-0.5">
            {{ resolveToastIcon(toast.type) }}
          </span>
          <p class="text-sm leading-relaxed">
            {{ toast.message }}
          </p>
          <button
            class="ml-auto text-sm text-white/80 hover:text-white transition-colors"
            type="button"
            aria-label="閉じる"
            @click.stop="removeToast(toast.id)"
          >
            ×
          </button>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active,
.toast-move {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
