import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import IconPicker from '@/components/users/IconPicker.vue';

// icons.js のモック
vi.mock('@/utils/icons', () => {
  const mockUserIcons = [
    { id: 'icon-cat', emoji: '🐱', name: '猫' },
    { id: 'icon-dog', emoji: '🐶', name: '犬' },
    { id: 'icon-bear', emoji: '🐻', name: '熊' },
    { id: 'icon-fox', emoji: '🦊', name: '狐' },
    { id: 'icon-panda', emoji: '🐼', name: 'パンダ' }
  ];

  return {
    USER_ICONS: mockUserIcons,
    DEFAULT_ICON: 'icon-cat',
    getIconEmoji: vi.fn((iconId) => {
      const icon = mockUserIcons.find((item) => item.id === iconId);
      return icon ? icon.emoji : '👤';
    })
  };
});

describe('IconPicker', () => {
  describe('初期表示', () => {
    it('デフォルトアイコンが表示される', () => {
      const wrapper = mount(IconPicker);

      expect(wrapper.text()).toContain('🐱');
      expect(wrapper.text()).toContain('現在のアイコン');
    });

    it('modelValue として指定したアイコンが表示される', () => {
      const wrapper = mount(IconPicker, {
        props: {
          modelValue: 'icon-dog'
        }
      });

      expect(wrapper.text()).toContain('🐶');
    });

    it('アイコンリストが表示される', () => {
      const wrapper = mount(IconPicker);

      const buttons = wrapper.findAll('button[type="button"]');
      expect(buttons.length).toBe(5); // モックで定義した5つのアイコン
    });

    it('各アイコンボタンに絵文字が表示される', () => {
      const wrapper = mount(IconPicker);

      expect(wrapper.text()).toContain('🐱');
      expect(wrapper.text()).toContain('🐶');
      expect(wrapper.text()).toContain('🐻');
      expect(wrapper.text()).toContain('🦊');
      expect(wrapper.text()).toContain('🐼');
    });

    it('各アイコンボタンに title 属性が設定される', () => {
      const wrapper = mount(IconPicker);

      const buttons = wrapper.findAll('button[type="button"]');
      expect(buttons[0].attributes('title')).toBe('猫');
      expect(buttons[1].attributes('title')).toBe('犬');
    });
  });

  describe('アイコン選択', () => {
    it('アイコンをクリックすると選択状態になる', async () => {
      const wrapper = mount(IconPicker);

      const buttons = wrapper.findAll('button[type="button"]');
      const dogButton = buttons[1]; // icon-dog

      await dogButton.trigger('click');

      // 選択されたアイコンのスタイルが適用される
      expect(dogButton.classes()).toContain('bg-blue-100');
      expect(dogButton.classes()).toContain('border-blue-500');
    });

    it('アイコンをクリックすると update:modelValue イベントが発火する', async () => {
      const wrapper = mount(IconPicker);

      const buttons = wrapper.findAll('button[type="button"]');
      const bearButton = buttons[2]; // icon-bear

      await bearButton.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0]).toEqual(['icon-bear']);
    });

    it('アイコンを選択すると現在のアイコンが更新される', async () => {
      const wrapper = mount(IconPicker, {
        props: {
          modelValue: 'icon-cat'
        }
      });

      expect(wrapper.text()).toContain('🐱');

      const buttons = wrapper.findAll('button[type="button"]');
      await buttons[3].trigger('click'); // icon-fox

      await nextTick();

      expect(wrapper.text()).toContain('🦊');
    });
  });

  describe('選択状態の表示', () => {
    it('デフォルトアイコンが選択状態として表示される', () => {
      const wrapper = mount(IconPicker, {
        props: {
          modelValue: 'icon-cat'
        }
      });

      const buttons = wrapper.findAll('button[type="button"]');
      const catButton = buttons[0];

      expect(catButton.classes()).toContain('bg-blue-100');
      expect(catButton.classes()).toContain('border-blue-500');
      expect(catButton.classes()).toContain('scale-105');
    });

    it('選択されていないアイコンは通常のスタイルが適用される', () => {
      const wrapper = mount(IconPicker, {
        props: {
          modelValue: 'icon-cat'
        }
      });

      const buttons = wrapper.findAll('button[type="button"]');
      const dogButton = buttons[1]; // 選択されていない

      expect(dogButton.classes()).toContain('bg-gray-100');
      expect(dogButton.classes()).toContain('border-transparent');
      expect(dogButton.classes()).not.toContain('border-blue-500');
    });
  });

  describe('v-model 双方向バインディング', () => {
    it('親から modelValue が変更されると表示が更新される', async () => {
      const wrapper = mount(IconPicker, {
        props: {
          modelValue: 'icon-cat'
        }
      });

      expect(wrapper.text()).toContain('🐱');

      // props を更新
      await wrapper.setProps({ modelValue: 'icon-panda' });

      expect(wrapper.text()).toContain('🐼');
    });

    it('子から update:modelValue イベントを発火すると親に通知される', async () => {
      const wrapper = mount(IconPicker, {
        props: {
          modelValue: 'icon-cat'
        }
      });

      const buttons = wrapper.findAll('button[type="button"]');
      await buttons[4].trigger('click'); // icon-panda

      expect(wrapper.emitted('update:modelValue')[0]).toEqual(['icon-panda']);
    });
  });

  describe('ヘルプテキスト', () => {
    it('アイコン数の説明が表示される', () => {
      const wrapper = mount(IconPicker);

      expect(wrapper.text()).toContain('お好みのアイコンをクリックして選択できます。');
    });

    it('アイコンの総数が表示される', () => {
      const wrapper = mount(IconPicker);

      // 実際のアイコン数に応じたテキストが含まれているか
      const text = wrapper.text();
      expect(text).toMatch(/\d+種類のアイコンから選べます。/);
    });
  });

  describe('スタイル', () => {
    it('アイコンピッカーのルート要素に icon-picker クラスが適用される', () => {
      const wrapper = mount(IconPicker);

      const root = wrapper.find('.icon-picker');
      expect(root.exists()).toBe(true);
    });

    it('現在のアイコン表示領域が存在する', () => {
      const wrapper = mount(IconPicker);

      const currentIcon = wrapper.find('.w-16.h-16.rounded-full');
      expect(currentIcon.exists()).toBe(true);
    });

    it('アイコングリッドが grid-cols-5 レイアウトになっている', () => {
      const wrapper = mount(IconPicker);

      const grid = wrapper.find('.grid.grid-cols-5');
      expect(grid.exists()).toBe(true);
    });
  });

  describe('不正なアイコンID', () => {
    it('存在しないアイコンIDの場合デフォルトアイコンが表示される', () => {
      const wrapper = mount(IconPicker, {
        props: {
          modelValue: 'invalid-icon-id'
        }
      });

      // getIconEmoji が 👤 を返すことをテスト
      expect(wrapper.text()).toContain('👤');
    });
  });

  describe('ホバーエフェクト', () => {
    it('アイコンボタンに hover クラスが設定されている', () => {
      const wrapper = mount(IconPicker);

      const buttons = wrapper.findAll('button[type="button"]');
      const firstButton = buttons[0];

      expect(firstButton.classes()).toContain('hover:scale-110');
      expect(firstButton.classes()).toContain('hover:shadow-md');
    });

    it('未選択のアイコンボタンに hover:border-gray-300 が設定されている', () => {
      const wrapper = mount(IconPicker, {
        props: {
          modelValue: 'icon-cat'
        }
      });

      const buttons = wrapper.findAll('button[type="button"]');
      const dogButton = buttons[1]; // 選択されていない

      expect(dogButton.classes()).toContain('hover:border-gray-300');
    });
  });
});
