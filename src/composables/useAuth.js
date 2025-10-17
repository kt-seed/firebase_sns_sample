import { computed, ref } from 'vue';
import { supabase } from '@/lib/supabase';
import { DEFAULT_ICON } from '@/utils/icons';

// アプリ全体で共有する認証状態
const user = ref(null);
const session = ref(null);
const loading = ref(true);

let authSubscription = null;
let initPromise = null;
let sessionRefreshTimer = null;

const REFRESH_MARGIN_MS = 60_000;
const MIN_REFRESH_DELAY_MS = 5_000;
const REFRESH_RETRY_DELAY_MS = 30_000;

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

      clearSessionRefresh();
      if (typeof supabase.auth.stopAutoRefresh === 'function') {
        supabase.auth.stopAutoRefresh();
      }

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
      const displayName =
        authUser.user_metadata?.display_name ?? authUser.email?.split('@')[0] ?? '名無し';
      const icon = authUser.user_metadata?.icon ?? DEFAULT_ICON;

      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .maybeSingle();

      if (profile) {
        return;
      }

      const { error } = await supabase
        .from('users')
        .upsert(
          {
            id: authUser.id,
            email: authUser.email,
            display_name: displayName,
            icon
          },
          { onConflict: 'id' }
        );

      if (error) throw error;
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

  function clearSessionRefresh() {
    if (sessionRefreshTimer) {
      clearTimeout(sessionRefreshTimer);
      sessionRefreshTimer = null;
    }
  }

  function scheduleSessionRefresh(currentSession) {
    clearSessionRefresh();

    if (!currentSession?.expires_at) {
      return;
    }

    const expirationMs = currentSession.expires_at * 1000;
    const now = Date.now();
    const delay = Math.max(expirationMs - now - REFRESH_MARGIN_MS, MIN_REFRESH_DELAY_MS);

    sessionRefreshTimer = setTimeout(async () => {
      try {
        const { data, error } = await supabase.auth.refreshSession();
        if (error) {
          throw error;
        }

        if (data?.session) {
          await applySession(data.session, { ensureProfile: false });
        }
      } catch (error) {
        console.error('セッション更新に失敗しました:', error);

        if (session.value) {
          sessionRefreshTimer = setTimeout(() => {
            scheduleSessionRefresh(session.value);
          }, REFRESH_RETRY_DELAY_MS);
        } else {
          clearSessionRefresh();
        }
      }
    }, delay);
  }

  async function applySession(nextSession, { ensureProfile = false } = {}) {
    session.value = nextSession ?? null;
    user.value = nextSession?.user ?? null;

    if (user.value && ensureProfile) {
      await ensureUserProfile(user.value);
    }

    if (user.value) {
      if (typeof supabase.auth.startAutoRefresh === 'function') {
        supabase.auth.startAutoRefresh();
      }
      scheduleSessionRefresh(nextSession);
    } else {
      if (typeof supabase.auth.stopAutoRefresh === 'function') {
        supabase.auth.stopAutoRefresh();
      }
      clearSessionRefresh();
    }
  }

  const initAuth = async () => {
    if (authSubscription) {
      return;
    }

    if (initPromise) {
      return initPromise;
    }

    loading.value = true;

    initPromise = (async () => {
      try {
        const {
          data: { session: currentSession }
        } = await supabase.auth.getSession();

        await applySession(currentSession, { ensureProfile: true });

        if (authSubscription) {
          authSubscription.unsubscribe();
        }

        const {
          data: { subscription }
        } = supabase.auth.onAuthStateChange(async (event, newSession) => {
          if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
            await applySession(null);
            return;
          }

          const shouldEnsureProfile = event === 'SIGNED_IN';
          await applySession(newSession, { ensureProfile: shouldEnsureProfile });
        });

        authSubscription = subscription;
      } catch (error) {
        console.error('認証初期化に失敗しました:', error);
      } finally {
        loading.value = false;
        initPromise = null;
      }
    })();

    return initPromise;
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
