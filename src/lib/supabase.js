import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabaseの環境変数が設定されていません。.env に URL と anon key を指定してください。'
  );
}

// Supabase クライアントをアプリ全体で共有する
export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// テーブル名の定数をまとめて管理する
export const TABLES = {
  USERS: 'users',
  POSTS: 'posts',
  LIKES: 'likes',
  REPOSTS: 'reposts',
  FOLLOWS: 'follows'
};

// 接続確認用の簡易ヘルパー
export async function checkSupabaseConnection() {
  try {
    const { error } = await supabase.from(TABLES.USERS).select('id').limit(1);
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Supabase接続エラー:', error);
    return false;
  }
}
