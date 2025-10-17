import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Supabaseの環境変数が設定されていません。.envファイルに以下を設定してください:\n' +
      'VITE_SUPABASE_URL=your-project-url\n' +
      'VITE_SUPABASE_ANON_KEY=your-anon-key'
  );
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export const TABLES = {
  USERS: 'users',
  POSTS: 'posts',
  LIKES: 'likes',
  REPOSTS: 'reposts',
  FOLLOWS: 'follows'
};

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
