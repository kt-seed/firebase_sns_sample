<script setup>
import { useToast } from '@/composables/useToast';

const { toasts, removeToast } = useToast();

// トーストの種類に応じて背景色を切り替える
const getToastClass = (type) => {
  const baseClass =
    'px-6 py-4 rounded-lg shadow-lg text-white mb-4 transition-all duration-300 cursor-pointer';
  const typeClasses = {
    success: 'bg-green-500 hover:bg-green-600',
    error: 'bg-red-500 hover:bg-red-600',
    warning: 'bg-yellow-500 hover:bg-yellow-600',
    info: 'bg-blue-500 hover:bg-blue-600'
  };
  return `${baseClass} ${typeClasses[type] || typeClasses.info}`;
};

const getToastIcon = (type) => {
  const icons = {
    success: 'OK',
    error: 'ERR',
    warning: '!',
    info: 'i'
  };
  return icons[type] || icons.info;
};
</script>

<template>
  <div class="fixed top-4 right-4 z-50 max-w-md">
    <transition-group name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        :class="getToastClass(toast.type)"
        @click="removeToast(toast.id)"
      >
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-sm font-bold uppercase tracking-wide">{{ getToastIcon(toast.type) }}</span>
            <span class="font-medium">{{ toast.message }}</span>
          </div>
          <button
            class="ml-4 text-white hover:text-gray-200 transition-colors"
            @click.stop="removeToast(toast.id)"
          >
            <span class="sr-only">閉じる</span>
            ×
          </button>
        </div>
      </div>
    </transition-group>
  </div>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.toast-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
