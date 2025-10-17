import { defineStore } from 'pinia';
import { useAuth } from '@/composables/useAuth';

// useAuth composable を Pinia ストアとして公開する薄いラッパー
export const useAuthStore = defineStore('auth', () => {
  const auth = useAuth();

  return {
    ...auth
  };
});
