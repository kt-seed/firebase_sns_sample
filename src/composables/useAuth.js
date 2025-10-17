import { computed, ref } from 'vue';
import { supabase } from '@/lib/supabase';
import { DEFAULT_ICON } from '@/utils/icons';

// アプリ全体で共有する認証状態
const user = ref(null);
const session = ref(null);
const loading = ref(true);

let authSubscription = null;

export function useAuth() {
  const isAuthenticated = computed(() => !!user.value);

  const signUp = async (email, password, displayName, icon = DEFAULT_ICON) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            icon
          }
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('サインアップに失敗しました:', error);
      return { data: null, error };
    }
  };

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('ログインに失敗しました:', error);
      return { data: null, error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      user.value = null;
      session.value = null;
      return { error: null };
    } catch (error) {
      console.error('ログアウトに失敗しました:', error);
      return { error };
    }
  };

  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('パスワードリセットに失敗しました:', error);
      return { data: null, error };
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('パスワード更新に失敗しました:', error);
      return { data: null, error };
    }
  };

  const ensureUserProfile = async (authUser) => {
    try {
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .maybeSingle();

      if (!profile) {
        const displayName =
          authUser.user_metadata?.display_name ?? authUser.email?.split('@')[0] ?? '名無し';
        const icon = authUser.user_metadata?.icon ?? DEFAULT_ICON;

        const { error } = await supabase.from('users').insert({
          id: authUser.id,
          email: authUser.email,
          display_name: displayName,
          icon
        });

        if (error) throw error;
      }
    } catch (error) {
      console.error('プロフィール作成に失敗しました:', error);
    }
  };

  const updateProfile = async (displayName, icon, bio) => {
    try {
      if (!user.value) {
        throw new Error('ログイン中のユーザーが見つかりません。');
      }

      const { data, error } = await supabase
        .from('users')
        .update({
          display_name: displayName,
          icon,
          bio,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.value.id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('プロフィール更新に失敗しました:', error);
      return { data: null, error };
    }
  };

  const initAuth = async () => {
    try {
      const {
        data: { session: currentSession }
      } = await supabase.auth.getSession();

      session.value = currentSession;
      user.value = currentSession?.user ?? null;

      if (user.value) {
        await ensureUserProfile(user.value);
      }

      if (authSubscription) {
        authSubscription.unsubscribe();
      }

      const {
        data: { subscription }
      } = supabase.auth.onAuthStateChange(async (event, newSession) => {
        session.value = newSession;
        user.value = newSession?.user ?? null;

        if (event === 'SIGNED_IN' && user.value) {
          await ensureUserProfile(user.value);
        }
      });

      authSubscription = subscription;
    } catch (error) {
      console.error('認証初期化に失敗しました:', error);
    } finally {
      loading.value = false;
    }
  };

  return {
    user,
    session,
    loading,
    isAuthenticated,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    initAuth
  };
}
