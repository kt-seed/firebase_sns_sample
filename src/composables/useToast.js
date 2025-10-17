import { ref } from 'vue';

// トースト通知をアプリ全体で共有するための状態
const toasts = ref([]);
let nextToastId = 0;

export function useToast() {
  const showToast = (message, type = 'info', duration = 3000) => {
    const id = nextToastId++;

    toasts.value.push({
      id,
      message,
      type
    });

    if (duration > 0) {
      window.setTimeout(() => removeToast(id), duration);
    }

    return id;
  };

  const removeToast = (id) => {
    const index = toasts.value.findIndex((toast) => toast.id === id);
    if (index !== -1) {
      toasts.value.splice(index, 1);
    }
  };

  const clearAllToasts = () => {
    toasts.value = [];
  };

  const success = (message, duration = 3000) => showToast(message, 'success', duration);
  const error = (message, duration = 5000) => showToast(message, 'error', duration);
  const warning = (message, duration = 4000) => showToast(message, 'warning', duration);
  const info = (message, duration = 3000) => showToast(message, 'info', duration);

  return {
    toasts,
    showToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info
  };
}
