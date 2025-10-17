import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import LoginForm from '@/components/auth/LoginForm.vue';

// Vue Router のモック
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

// useAuth composable のモック
const signUpMock = vi.fn();
const signInMock = vi.fn();
vi.mock('@/composables/useAuth', () => ({
  useAuth: () => ({
    signUp: signUpMock,
    signIn: signInMock
  })
}));

// useToast composable のモック
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    success: toastSuccessMock,
    error: toastErrorMock
  })
}));

// IconPicker コンポーネントのモック
vi.mock('@/components/users/IconPicker.vue', () => ({
  default: {
    name: 'IconPicker',
    template: '<div class="icon-picker-mock"><slot /></div>',
    props: ['modelValue'],
    emits: ['update:modelValue']
  }
}));

describe('LoginForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signUpMock.mockResolvedValue({ error: null });
    signInMock.mockResolvedValue({ error: null });
  });

  describe('初期表示', () => {
    it('デフォルトはログインモードで表示される', () => {
      const wrapper = mount(LoginForm);

      expect(wrapper.text()).toContain('ログイン');
      expect(wrapper.find('#email').exists()).toBe(true);
      expect(wrapper.find('#password').exists()).toBe(true);
      expect(wrapper.find('#displayName').exists()).toBe(false);
    });

    it('ログインモードではIconPickerが表示されない', () => {
      const wrapper = mount(LoginForm);

      expect(wrapper.findComponent({ name: 'IconPicker' }).exists()).toBe(false);
    });
  });

  describe('モード切り替え', () => {
    it('トグルボタンをクリックするとサインアップモードに切り替わる', async () => {
      const wrapper = mount(LoginForm);

      const toggleButton = wrapper.find('.toggle-button');
      await toggleButton.trigger('click');

      expect(wrapper.text()).toContain('アカウント作成');
      expect(wrapper.find('#displayName').exists()).toBe(true);
      expect(wrapper.findComponent({ name: 'IconPicker' }).exists()).toBe(true);
    });

    it('サインアップモードからログインモードに切り替わる', async () => {
      const wrapper = mount(LoginForm);

      // サインアップモードに切り替え
      await wrapper.find('.toggle-button').trigger('click');
      expect(wrapper.text()).toContain('アカウント作成');

      // ログインモードに戻す
      await wrapper.find('.toggle-button').trigger('click');
      expect(wrapper.text()).toContain('ログイン');
      expect(wrapper.find('#displayName').exists()).toBe(false);
    });

    it('モード切り替え時にフォームがリセットされる', async () => {
      const wrapper = mount(LoginForm);

      // フォームに入力
      await wrapper.find('#email').setValue('test@example.com');
      await wrapper.find('#password').setValue('password123');

      // サインアップモードに切り替え
      await wrapper.find('.toggle-button').trigger('click');

      // フィールドがリセットされているか確認
      expect(wrapper.find('#email').element.value).toBe('');
      expect(wrapper.find('#password').element.value).toBe('');
    });
  });

  describe('フォームバリデーション', () => {
    it('ログインモード: メールとパスワード（6文字以上）が入力されるとボタンが有効になる', async () => {
      const wrapper = mount(LoginForm);

      // 初期状態では無効
      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined();

      // メールとパスワードを入力
      await wrapper.find('#email').setValue('test@example.com');
      await wrapper.find('#password').setValue('pass123');
      await nextTick();

      // ボタンが有効になる
      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined();
    });

    it('ログインモード: パスワードが6文字未満だとボタンが無効', async () => {
      const wrapper = mount(LoginForm);

      await wrapper.find('#email').setValue('test@example.com');
      await wrapper.find('#password').setValue('12345'); // 5文字
      await nextTick();

      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined();
    });

    it('サインアップモード: 表示名が未入力だとボタンが無効', async () => {
      const wrapper = mount(LoginForm);

      // サインアップモードに切り替え
      await wrapper.find('.toggle-button').trigger('click');

      await wrapper.find('#email').setValue('test@example.com');
      await wrapper.find('#password').setValue('pass123');
      // displayName は空
      await nextTick();

      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined();
    });

    it('サインアップモード: すべて入力されるとボタンが有効になる', async () => {
      const wrapper = mount(LoginForm);

      // サインアップモードに切り替え
      await wrapper.find('.toggle-button').trigger('click');

      await wrapper.find('#displayName').setValue('テストユーザー');
      await wrapper.find('#email').setValue('test@example.com');
      await wrapper.find('#password').setValue('pass123');
      await nextTick();

      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeUndefined();
    });

    it('サインアップモード: 表示名が20文字を超えるとエラー表示', async () => {
      const wrapper = mount(LoginForm);

      // サインアップモードに切り替え
      await wrapper.find('.toggle-button').trigger('click');

      const longName = 'あ'.repeat(21); // 21文字
      await wrapper.find('#displayName').setValue(longName);
      await nextTick();

      expect(wrapper.text()).toContain('残り 0 文字');
      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined();
    });
  });

  describe('ログイン処理', () => {
    it('ログイン成功時に signIn が呼ばれ、ホームにリダイレクトする', async () => {
      signInMock.mockResolvedValueOnce({ error: null });

      const wrapper = mount(LoginForm);

      await wrapper.find('#email').setValue('test@example.com');
      await wrapper.find('#password').setValue('password123');
      await wrapper.find('form').trigger('submit.prevent');
      await nextTick();
      await vi.waitFor(() => expect(signInMock).toHaveBeenCalled());

      expect(signInMock).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(toastSuccessMock).toHaveBeenCalledWith('ログインしました。');
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('ログイン失敗時にエラートーストが表示される', async () => {
      const error = new Error('認証エラー');
      signInMock.mockResolvedValueOnce({ error });

      const wrapper = mount(LoginForm);

      await wrapper.find('#email').setValue('test@example.com');
      await wrapper.find('#password').setValue('wrongpass');
      await wrapper.find('form').trigger('submit.prevent');
      await nextTick();
      await vi.waitFor(() => expect(signInMock).toHaveBeenCalled());

      expect(toastErrorMock).toHaveBeenCalledWith(
        'メールアドレスまたはパスワードが正しくありません。'
      );
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('サインアップ処理', () => {
    it('サインアップ成功時に signUp が呼ばれ、ホームにリダイレクトする', async () => {
      signUpMock.mockResolvedValueOnce({ error: null });

      const wrapper = mount(LoginForm);

      // サインアップモードに切り替え
      await wrapper.find('.toggle-button').trigger('click');

      await wrapper.find('#displayName').setValue('新規ユーザー');
      await wrapper.find('#email').setValue('newuser@example.com');
      await wrapper.find('#password').setValue('newpass123');
      await wrapper.find('form').trigger('submit.prevent');
      await nextTick();
      await vi.waitFor(() => expect(signUpMock).toHaveBeenCalled());

      expect(signUpMock).toHaveBeenCalledWith(
        'newuser@example.com',
        'newpass123',
        '新規ユーザー',
        expect.any(String) // selectedIcon
      );
      expect(toastSuccessMock).toHaveBeenCalledWith('アカウントを作成しました。');
      expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('サインアップ失敗（メール重複）時にエラートーストが表示される', async () => {
      const error = new Error('already registered');
      signUpMock.mockResolvedValueOnce({ error });

      const wrapper = mount(LoginForm);

      // サインアップモードに切り替え
      await wrapper.find('.toggle-button').trigger('click');

      await wrapper.find('#displayName').setValue('テストユーザー');
      await wrapper.find('#email').setValue('duplicate@example.com');
      await wrapper.find('#password').setValue('password123');
      await wrapper.find('form').trigger('submit.prevent');
      await nextTick();
      await vi.waitFor(() => expect(signUpMock).toHaveBeenCalled());

      expect(toastErrorMock).toHaveBeenCalledWith(
        'このメールアドレスは既に登録されています。'
      );
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('サインアップ失敗（その他のエラー）時にエラートーストが表示される', async () => {
      const error = new Error('その他のエラー');
      signUpMock.mockResolvedValueOnce({ error });

      const wrapper = mount(LoginForm);

      // サインアップモードに切り替え
      await wrapper.find('.toggle-button').trigger('click');

      await wrapper.find('#displayName').setValue('テストユーザー');
      await wrapper.find('#email').setValue('test@example.com');
      await wrapper.find('#password').setValue('password123');
      await wrapper.find('form').trigger('submit.prevent');
      await nextTick();
      await vi.waitFor(() => expect(signUpMock).toHaveBeenCalled());

      expect(toastErrorMock).toHaveBeenCalledWith(
        'サインアップに失敗しました: その他のエラー'
      );
    });
  });

  describe('ローディング状態', () => {
    it('送信中は loading が true になりボタンが無効化される', async () => {
      // サインイン処理を遅延させる
      signInMock.mockImplementationOnce(
        () => new Promise((resolve) => setTimeout(() => resolve({ error: null }), 100))
      );

      const wrapper = mount(LoginForm);

      await wrapper.find('#email').setValue('test@example.com');
      await wrapper.find('#password').setValue('password123');

      wrapper.find('form').trigger('submit.prevent');
      await nextTick();

      // loading 状態を確認
      expect(wrapper.text()).toContain('処理中...');
      expect(wrapper.find('button[type="submit"]').attributes('disabled')).toBeDefined();

      // 処理完了を待つ
      await vi.waitFor(() => expect(signInMock).toHaveBeenCalled());
    });
  });

  describe('フォームバリデーション（無効なフォーム）', () => {
    it('無効なフォームで送信するとエラートーストが表示される', async () => {
      const wrapper = mount(LoginForm);

      // メールのみ入力（パスワードが不足）
      await wrapper.find('#email').setValue('test@example.com');
      // password は空

      // 強制的に送信を試みる（実際にはボタンが無効化されている）
      await wrapper.vm.handleSubmit();
      await nextTick();

      expect(toastErrorMock).toHaveBeenCalledWith('入力内容を確認してください。');
      expect(signInMock).not.toHaveBeenCalled();
    });
  });
});
