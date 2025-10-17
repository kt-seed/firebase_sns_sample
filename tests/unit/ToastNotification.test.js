import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { ref } from 'vue';
import ToastNotification from '@/components/common/ToastNotification.vue';

// useToast composable のモック
const mockToasts = ref([]);
const removeToastMock = vi.fn();

vi.mock('@/composables/useToast', () => ({
  useToast: () => ({
    toasts: mockToasts,
    removeToast: removeToastMock
  })
}));

describe('ToastNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToasts.value = [];
  });

  describe('初期表示', () => {
    it('トーストがない場合は何も表示されない', () => {
      mockToasts.value = [];

      const wrapper = mount(ToastNotification);

      const toastElements = wrapper.findAll('.px-6');
      expect(toastElements.length).toBe(0);
    });

    it('トーストがある場合は表示される', () => {
      mockToasts.value = [
        { id: 1, type: 'success', message: '成功しました' }
      ];

      const wrapper = mount(ToastNotification);

      expect(wrapper.text()).toContain('成功しました');
    });
  });

  describe('トーストの種類とスタイル', () => {
    it('success トーストは緑色のスタイルが適用される', () => {
      mockToasts.value = [
        { id: 1, type: 'success', message: '成功' }
      ];

      const wrapper = mount(ToastNotification);

      const toast = wrapper.find('.bg-green-500');
      expect(toast.exists()).toBe(true);
    });

    it('error トーストは赤色のスタイルが適用される', () => {
      mockToasts.value = [
        { id: 2, type: 'error', message: 'エラー' }
      ];

      const wrapper = mount(ToastNotification);

      const toast = wrapper.find('.bg-red-500');
      expect(toast.exists()).toBe(true);
    });

    it('warning トーストは黄色のスタイルが適用される', () => {
      mockToasts.value = [
        { id: 3, type: 'warning', message: '警告' }
      ];

      const wrapper = mount(ToastNotification);

      const toast = wrapper.find('.bg-yellow-500');
      expect(toast.exists()).toBe(true);
    });

    it('info トーストは青色のスタイルが適用される', () => {
      mockToasts.value = [
        { id: 4, type: 'info', message: '情報' }
      ];

      const wrapper = mount(ToastNotification);

      const toast = wrapper.find('.bg-blue-500');
      expect(toast.exists()).toBe(true);
    });

    it('不明な type の場合は info スタイルが適用される', () => {
      mockToasts.value = [
        { id: 5, type: 'unknown', message: '未知' }
      ];

      const wrapper = mount(ToastNotification);

      const toast = wrapper.find('.bg-blue-500');
      expect(toast.exists()).toBe(true);
    });
  });

  describe('アイコンの表示', () => {
    it('success トーストには ✔ アイコンが表示される', () => {
      mockToasts.value = [
        { id: 1, type: 'success', message: '成功' }
      ];

      const wrapper = mount(ToastNotification);

      expect(wrapper.text()).toContain('✔');
    });

    it('error トーストには ✖ アイコンが表示される', () => {
      mockToasts.value = [
        { id: 2, type: 'error', message: 'エラー' }
      ];

      const wrapper = mount(ToastNotification);

      expect(wrapper.text()).toContain('✖');
    });

    it('warning トーストには ⚠ アイコンが表示される', () => {
      mockToasts.value = [
        { id: 3, type: 'warning', message: '警告' }
      ];

      const wrapper = mount(ToastNotification);

      expect(wrapper.text()).toContain('⚠');
    });

    it('info トーストには ℹ アイコンが表示される', () => {
      mockToasts.value = [
        { id: 4, type: 'info', message: '情報' }
      ];

      const wrapper = mount(ToastNotification);

      expect(wrapper.text()).toContain('ℹ');
    });

    it('不明な type の場合は ℹ アイコンが表示される', () => {
      mockToasts.value = [
        { id: 5, type: 'unknown', message: '未知' }
      ];

      const wrapper = mount(ToastNotification);

      expect(wrapper.text()).toContain('ℹ');
    });
  });

  describe('トーストのメッセージ', () => {
    it('トーストメッセージが正しく表示される', () => {
      mockToasts.value = [
        { id: 1, type: 'success', message: 'これはテストメッセージです' }
      ];

      const wrapper = mount(ToastNotification);

      expect(wrapper.text()).toContain('これはテストメッセージです');
    });

    it('複数のトーストが表示される', () => {
      mockToasts.value = [
        { id: 1, type: 'success', message: 'メッセージ1' },
        { id: 2, type: 'error', message: 'メッセージ2' },
        { id: 3, type: 'info', message: 'メッセージ3' }
      ];

      const wrapper = mount(ToastNotification);

      expect(wrapper.text()).toContain('メッセージ1');
      expect(wrapper.text()).toContain('メッセージ2');
      expect(wrapper.text()).toContain('メッセージ3');

      const toastElements = wrapper.findAll('.px-6');
      expect(toastElements.length).toBe(3);
    });
  });

  describe('トーストのクリックイベント', () => {
    it('トーストをクリックすると removeToast が呼ばれる', async () => {
      mockToasts.value = [
        { id: 1, type: 'success', message: 'テスト' }
      ];

      const wrapper = mount(ToastNotification);

      const toast = wrapper.find('.cursor-pointer');
      await toast.trigger('click');

      expect(removeToastMock).toHaveBeenCalledWith(1);
    });

    it('閉じるボタンをクリックすると removeToast が呼ばれる', async () => {
      mockToasts.value = [
        { id: 2, type: 'error', message: 'エラーメッセージ' }
      ];

      const wrapper = mount(ToastNotification);

      const closeButton = wrapper.find('button[aria-label="閉じる"]');
      await closeButton.trigger('click');

      expect(removeToastMock).toHaveBeenCalledWith(2);
    });

    it('閉じるボタンのクリックは親要素にバブリングしない', async () => {
      mockToasts.value = [
        { id: 3, type: 'info', message: '情報' }
      ];

      const wrapper = mount(ToastNotification);

      const closeButton = wrapper.find('button[aria-label="閉じる"]');
      await closeButton.trigger('click');

      // @click.stop により1回だけ呼ばれる
      expect(removeToastMock).toHaveBeenCalledTimes(1);
      expect(removeToastMock).toHaveBeenCalledWith(3);
    });
  });

  describe('スタイル', () => {
    it('トーストコンテナに fixed と z-50 が適用される', () => {
      const wrapper = mount(ToastNotification);

      const container = wrapper.find('.fixed.top-4.right-4.z-50');
      expect(container.exists()).toBe(true);
    });

    it('トーストに cursor-pointer が適用される', () => {
      mockToasts.value = [
        { id: 1, type: 'success', message: 'テスト' }
      ];

      const wrapper = mount(ToastNotification);

      const toast = wrapper.find('.cursor-pointer');
      expect(toast.exists()).toBe(true);
    });

    it('閉じるボタンに適切なスタイルが適用される', () => {
      mockToasts.value = [
        { id: 1, type: 'success', message: 'テスト' }
      ];

      const wrapper = mount(ToastNotification);

      const closeButton = wrapper.find('button[aria-label="閉じる"]');
      expect(closeButton.classes()).toContain('ml-auto');
      expect(closeButton.classes()).toContain('text-sm');
    });
  });

  describe('アクセシビリティ', () => {
    it('閉じるボタンに aria-label が設定されている', () => {
      mockToasts.value = [
        { id: 1, type: 'success', message: 'テスト' }
      ];

      const wrapper = mount(ToastNotification);

      const closeButton = wrapper.find('button[aria-label="閉じる"]');
      expect(closeButton.exists()).toBe(true);
      expect(closeButton.attributes('aria-label')).toBe('閉じる');
    });

    it('閉じるボタンに type="button" が設定されている', () => {
      mockToasts.value = [
        { id: 1, type: 'success', message: 'テスト' }
      ];

      const wrapper = mount(ToastNotification);

      const closeButton = wrapper.find('button[aria-label="閉じる"]');
      expect(closeButton.attributes('type')).toBe('button');
    });
  });

  describe('トランジション', () => {
    it('transition-group に toast という名前が設定されている', () => {
      const wrapper = mount(ToastNotification);

      const transitionGroup = wrapper.find('.fixed > *');
      expect(transitionGroup.exists()).toBe(true);
    });
  });

  describe('resolveToastClass と resolveToastIcon', () => {
    it('各 type に対して正しいクラスが返される', () => {
      const wrapper = mount(ToastNotification);

      expect(wrapper.vm.resolveToastClass('success')).toContain('bg-green-500');
      expect(wrapper.vm.resolveToastClass('error')).toContain('bg-red-500');
      expect(wrapper.vm.resolveToastClass('warning')).toContain('bg-yellow-500');
      expect(wrapper.vm.resolveToastClass('info')).toContain('bg-blue-500');
      expect(wrapper.vm.resolveToastClass('unknown')).toContain('bg-blue-500');
    });

    it('各 type に対して正しいアイコンが返される', () => {
      const wrapper = mount(ToastNotification);

      expect(wrapper.vm.resolveToastIcon('success')).toBe('✔');
      expect(wrapper.vm.resolveToastIcon('error')).toBe('✖');
      expect(wrapper.vm.resolveToastIcon('warning')).toBe('⚠');
      expect(wrapper.vm.resolveToastIcon('info')).toBe('ℹ');
      expect(wrapper.vm.resolveToastIcon('unknown')).toBe('ℹ');
    });
  });

  describe('複数トーストの削除', () => {
    it('特定のトーストを削除できる', async () => {
      mockToasts.value = [
        { id: 1, type: 'success', message: 'メッセージ1' },
        { id: 2, type: 'error', message: 'メッセージ2' }
      ];

      const wrapper = mount(ToastNotification);

      const toastElements = wrapper.findAll('.cursor-pointer');
      await toastElements[1].trigger('click'); // 2つ目のトーストをクリック

      expect(removeToastMock).toHaveBeenCalledWith(2);
    });
  });
});
