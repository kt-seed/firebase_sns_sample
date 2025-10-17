import { ref } from 'vue';

// トースト通知をアプリ全体で共有するための状態
const toasts = ref([]);
let toastId = 0;

// トースト表示ロジックをまとめた composable
export function useToast() {
  // メッセージをキューに積み、一定時間後に自動で消す
  const showToast = (message, type = 'info', duration = 3000) => {
    const id = toastId++;
    const toast = {
      id,
      message,
      type,
      visible: true
    };

    toasts.value.push(toast);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  // 指定 ID のトーストを即時に取り除く
  const removeToast = (id) => {
    const index = toasts.value.findIndex((t) => t.id === id);
    if (index !== -1) {
      toasts.value.splice(index, 1);
    }
  };

  // すべてのトーストをまとめてクリアする
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
