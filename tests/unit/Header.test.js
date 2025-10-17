import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import Header from '@/components/common/Header.vue';

// Vue Router のモック
const mockPush = vi.fn();
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}));

// useAuthStore のモック
const mockUser = { value: null };
const mockIsAuthenticated = false;
const signOutMock = vi.fn();

let isAuthenticatedValue = false;

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: mockUser,
    get isAuthenticated() {
      return isAuthenticatedValue;
    },
    signOut: signOutMock
  })
}));

// useToast のモック
const toastErrorMock = vi.fn();
const toastInfoMock = vi.fn();
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    error: toastErrorMock,
    info: toastInfoMock
  })
}));

// icons.js のモック
vi.mock('@/utils/icons', () => ({
  getIconEmoji: vi.fn((icon) => {
    if (icon === 'icon-cat') return '🐱';
    if (icon === 'icon-dog') return '🐶';
    return '👤';
  })
}));

// RouterLink のスタブ
const RouterLinkStub = {
  name: 'RouterLink',
  template: '<a><slot /></a>',
  props: ['to']
};

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser.value = null;
    isAuthenticatedValue = false;
    signOutMock.mockResolvedValue({ error: null });
  });

  describe('ログイン前の表示', () => {
    it('ブランド名が表示される', () => {
      const wrapper = mount(Header, {
        global: {
          stubs: {
            RouterLink: RouterLinkStub
          }
        }
      });

      expect(wrapper.text()).toContain('匿名SNS');
    });

    it('ホームリンクが表示される', () => {
      const wrapper = mount(Header, {
        global: {
          stubs: {
            RouterLink: RouterLinkStub
          }
        }
      });

      expect(wrapper.text()).toContain('ホーム');
    });

    it('ログインボタンが表示される', () => {
      isAuthenticatedValue = false;

      const wrapper = mount(Header, {
        global: {
          stubs: {
            RouterLink: RouterLinkStub
          }
        }
      });

      expect(wrapper.text()).toContain('ログイン');
    });

    it('ログアウトボタンは表示されない', () => {
      isAuthenticatedValue = false;

      const wrapper = mount(Header, {
        global: {
          stubs: {
            RouterLink: RouterLinkStub
          }
        }
      });

      expect(wrapper.text()).not.toContain('ログアウト');
    });
  });

  describe('ログイン後の表示', () => {
    beforeEach(() => {
      isAuthenticatedValue = true;
      mockUser.value = {
        email: 'test@example.com',
        user_metadata: {
          display_name: 'テストユーザー',
          icon: 'icon-cat'
        }
      };
    });

    it('ユーザー表示名が表示される', () => {
      const wrapper = mount(Header, {
        global: {
          stubs: {
            RouterLink: RouterLinkStub
          }
        }
      });

      expect(wrapper.text()).toContain('テストユーザー');
    });

    it('ユーザーアイコンが表示される', () => {
      const wrapper = mount(Header, {
        global: {
          stubs: {
            RouterLink: RouterLinkStub
          }
        }
      });

      expect(wrapper.text()).toContain('🐱');
    });

    it('ログアウトボタンが表示される', () => {
      const wrapper = mount(Header, {
        global: {
          stubs: {
            RouterLink: RouterLinkStub
          }
        }
      });

      expect(wrapper.text()).toContain('ログアウト');
    });

    it('ログインボタンは表示されない', () => {
      const wrapper = mount(Header, {
        global: {
          stubs: {
            RouterLink: RouterLinkStub
          }
        }
      });

      // ログインボタンは表示されない（ログアウトのみ）
      const buttons = wrapper.findAll('a');
      const loginButton = buttons.find((b) => b.text() === 'ログイン');
      expect(loginButton).toBeUndefined();
    });
  });

  describe('ユーザー情報の表示パターン', () => {
    it('display_name がない場合は email が表示される', () => {
      isAuthenticatedValue = true;
      mockUser.value = {
        email: 'noname@example.com',
        user_metadata: {}
      };

      const wrapper = mount(Header, {
        global: {
          stubs: {
            RouterLink: RouterLinkStub
          }
        }
      });

      expect(wrapper.text()).toContain('noname@example.com');
    });

    it('email もない場合は「ゲスト」が表示される', () => {
      isAuthenticatedValue = true;
      mockUser.value = {
        user_metadata: {}
      };

      const wrapper = mount(Header, {
        global: {
          stubs: {
            RouterLink: RouterLinkStub
          }
        }
      });

      expect(wrapper.text()).toContain('ゲスト');
    });

    it('user が null の場合は「ゲスト」が表示される', () => {
      isAuthenticatedValue = false;
      mockUser.value = null;

      const wrapper = mount(Header, {
        global: {
          stubs: {
            RouterLink: RouterLinkStub
          }
        }
      });

      // ログイン前なのでユーザー名は表示されないが、内部的に「ゲスト」が computed される
      expect(wrapper.vm.displayName).toBe('ゲスト');
    });

    it('icon がない場合はデフォルトアイコンが表示される', () => {
      isAuthenticatedValue = true;
      mockUser.value = {
        email: 'test@example.com',
        user_metadata: {
          display_name: 'テストユーザー'
          // icon なし
        }
      };

      const wrapper = mount(Header, {
        global: {
          stubs: {
            RouterLink: RouterLinkStub
          }
        }
      });

      expect(wrapper.text()).toContain('👤');
    });
  });

  describe('ログアウト機能', () => {
    beforeEach(() => {
      isAuthenticatedValue = true;
      mockUser.value = {
        email: 'test@example.com',
        user_metadata: {
          display_name: 'テストユーザー',
          icon: 'icon-cat'
        }
      };
    });

    it('ログアウトボタンをクリックすると signOut が呼ばれる', async () => {
      signOutMock.mockResolvedValueOnce({ error: null });

      const wrapper = mount(Header, {
        global: {
          stubs: {
            RouterLink: RouterLinkStub
          }
        }
      });

      const logoutButton = wrapper.find('button[type="button"]');
      await logoutButton.trigger('click');
      await nextTick();

      expect(signOutMock).toHaveBeenCalled();
    });

    it('ログアウト成功時に info トーストが表示され、ログインページにリダイレクトする', async () => {
      signOutMock.mockResolvedValueOnce({ error: null });

      const wrapper = mount(Header, {
        global: {
          stubs: {
            RouterLink: RouterLinkStub
          }
        }
      });

      const logoutButton = wrapper.find('button[type="button"]');
      await logoutButton.trigger('click');
      await nextTick();
      await vi.waitFor(() => expect(signOutMock).toHaveBeenCalled());

      expect(toastInfoMock).toHaveBeenCalledWith('ログアウトしました。');
      expect(mockPush).toHaveBeenCalledWith('/login');
    });

    it('ログアウト失敗時に error トーストが表示される', async () => {
      const error = new Error('ログアウトエラー');
      signOutMock.mockResolvedValueOnce({ error });

      const wrapper = mount(Header, {
        global: {
          stubs: {
            RouterLink: RouterLinkStub
          }
        }
      });

      const logoutButton = wrapper.find('button[type="button"]');
      await logoutButton.trigger('click');
      await nextTick();
      await vi.waitFor(() => expect(signOutMock).toHaveBeenCalled());

      expect(toastErrorMock).toHaveBeenCalledWith('ログアウトに失敗しました。');
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('スタイル', () => {
    it('ヘッダーに app-header クラスが適用される', () => {
      const wrapper = mount(Header, {
        global: {
          stubs: {
            RouterLink: RouterLinkStub
          }
        }
      });

      const header = wrapper.find('header');
      expect(header.classes()).toContain('app-header');
    });

    it('ブランドに brand クラスが適用される', () => {
      const wrapper = mount(Header, {
        global: {
          stubs: {
            RouterLink: RouterLinkStub
          }
        }
      });

      const brand = wrapper.find('.brand');
      expect(brand.exists()).toBe(true);
    });

    it('ログアウトボタンに secondary-button クラスが適用される', () => {
      isAuthenticatedValue = true;
      mockUser.value = {
        email: 'test@example.com',
        user_metadata: {
          display_name: 'テストユーザー'
        }
      };

      const wrapper = mount(Header, {
        global: {
          stubs: {
            RouterLink: RouterLinkStub
          }
        }
      });

      const logoutButton = wrapper.find('.secondary-button');
      expect(logoutButton.exists()).toBe(true);
    });
  });
});
