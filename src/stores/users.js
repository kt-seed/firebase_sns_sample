import { defineStore } from 'pinia';
import { ref } from 'vue';
import { supabase } from '@/lib/supabase';

// users テーブルのプロフィールをキャッシュしながら取得するストア
export const useUsersStore = defineStore('users', () => {
  const profiles = ref({});
  const loading = ref(false);
  const error = ref(null);

  const fetchUserProfile = async (userId) => {
    if (!userId) {
      return { data: null, error: new Error('ユーザーIDが指定されていません。') };
    }

    loading.value = true;
    error.value = null;

    try {
      const { data, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      profiles.value[userId] = data;
      return { data, error: null };
    } catch (err) {
      console.error('ユーザープロフィールの取得に失敗しました:', err);
      error.value = err.message;
      return { data: null, error: err };
    } finally {
      loading.value = false;
    }
  };

  return {
    profiles,
    loading,
    error,
    fetchUserProfile
  };
});
