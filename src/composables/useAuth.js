import { computed, ref } from 'vue';
import { supabase } from '@/lib/supabase';
import { DEFAULT_ICON } from '@/utils/icons';

// 認証状態をアプリ全体で共有するためのリアクティブな値
const user = ref(null);
const session = ref(null);
const loading = ref(true);

// Supabase 認証に関する操作をひとまとめにした composable
export function useAuth() {
  const isAuthenticated = computed(() => !!user.value);

  // メール・パスワードでサインアップする
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
      console.error('サインアップエラー:', error);
      return { data: null, error };
    }
  };

  // メール・パスワードでログインする
  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('ログインエラー:', error);
      return { data: null, error };
    }
  };

  // セッションを破棄してログアウト状態に戻す
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      user.value = null;
      session.value = null;
      return { error: null };
    } catch (error) {
      console.error('ログアウトエラー:', error);
      return { error };
    }
  };

  // パスワードリセットメールを送信する
  const resetPassword = async (email) => {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('パスワードリセットエラー:', error);
      return { data: null, error };
    }
  };

  // ログイン中ユーザーのパスワードを変更する
  const updatePassword = async (newPassword) => {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('パスワード更新エラー:', error);
      return { data: null, error };
    }
  };

  // users テーブル上のプロフィール情報を更新する
  const updateProfile = async (displayName, icon, bio) => {
    try {
      if (!user.value) {
        throw new Error('ログインしていません');
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
      console.error('プロフィール更新エラー:', error);
      return { data: null, error };
    }
  };

  // users テーブルにプロフィールがない場合は初期レコードを作成する
  const ensureUserProfile = async (authUser) => {
    try {
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .single();

      if (!existingProfile) {
        const displayName = authUser.user_metadata?.display_name || authUser.email.split('@')[0];
        const icon = authUser.user_metadata?.icon || DEFAULT_ICON;

        const { error } = await supabase.from('users').insert({
          id: authUser.id,
          email: authUser.email,
          display_name: displayName,
          icon
        });

        if (error) throw error;
      }
    } catch (error) {
      console.error('プロフィール作成エラー:', error);
    }
  };

  // アプリ起動時と認証状態の変化を監視して共通状態を更新する
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

      supabase.auth.onAuthStateChange(async (event, newSession) => {
        session.value = newSession;
        user.value = newSession?.user ?? null;

        if (event === 'SIGNED_IN' && user.value) {
          await ensureUserProfile(user.value);
        }
      });
    } catch (error) {
      console.error('認証初期化エラー:', error);
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
