import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import PostCard from '@/components/posts/PostCard.vue';

// icons.js のモック
vi.mock('@/utils/icons', () => ({
  getIconEmoji: vi.fn((icon) => {
    if (icon === 'icon-cat') return '🐱';
    if (icon === 'icon-dog') return '🐶';
    return '😀';
  })
}));

// date.js のモック
vi.mock('@/utils/date', () => ({
  formatRelativeTime: vi.fn((date) => '5分前'),
  formatDateTime: vi.fn((date) => '2024-01-15 10:30:00')
}));

describe('PostCard', () => {
  let mockPost;

  beforeEach(() => {
    mockPost = {
      id: 'post-123',
      text: 'これはテスト投稿です。',
      likes_count: 10,
      reposts_count: 5,
      created_at: '2024-01-15T10:30:00Z',
      users: {
        id: 'user-456',
        display_name: 'テストユーザー',
        icon: 'icon-cat'
      }
    };
  });

  describe('投稿情報の表示', () => {
    it('投稿テキストが表示される', () => {
      const wrapper = mount(PostCard, {
        props: { post: mockPost }
      });

      expect(wrapper.text()).toContain('これはテスト投稿です。');
    });

    it('作成者の表示名が表示される', () => {
      const wrapper = mount(PostCard, {
        props: { post: mockPost }
      });

      expect(wrapper.text()).toContain('テストユーザー');
    });

    it('作成者のアイコンが表示される', () => {
      const wrapper = mount(PostCard, {
        props: { post: mockPost }
      });

      expect(wrapper.text()).toContain('🐱');
    });

    it('いいね数が表示される', () => {
      const wrapper = mount(PostCard, {
        props: { post: mockPost }
      });

      expect(wrapper.text()).toContain('いいね 10');
    });

    it('リポスト数が表示される', () => {
      const wrapper = mount(PostCard, {
        props: { post: mockPost }
      });

      expect(wrapper.text()).toContain('リポスト 5');
    });

    it('相対時刻が表示される', () => {
      const wrapper = mount(PostCard, {
        props: { post: mockPost }
      });

      expect(wrapper.text()).toContain('5分前');
    });

    it('usersがnullの場合は「名無し」と表示される', () => {
      const postWithoutUser = { ...mockPost, users: null };
      const wrapper = mount(PostCard, {
        props: { post: postWithoutUser }
      });

      expect(wrapper.text()).toContain('名無し');
    });

    it('likes_countがnullの場合は0と表示される', () => {
      const postWithoutLikes = { ...mockPost, likes_count: null };
      const wrapper = mount(PostCard, {
        props: { post: postWithoutLikes }
      });

      expect(wrapper.text()).toContain('いいね 0');
    });

    it('reposts_countがnullの場合は0と表示される', () => {
      const postWithoutReposts = { ...mockPost, reposts_count: null };
      const wrapper = mount(PostCard, {
        props: { post: postWithoutReposts }
      });

      expect(wrapper.text()).toContain('リポスト 0');
    });
  });

  describe('削除ボタン', () => {
    it('isOwnPost が true の場合、削除ボタンが表示される', () => {
      const wrapper = mount(PostCard, {
        props: {
          post: mockPost,
          isOwnPost: true
        }
      });

      const deleteButton = wrapper.find('button');
      expect(deleteButton.exists()).toBe(true);
      expect(deleteButton.text()).toContain('削除');
    });

    it('isOwnPost が false の場合、削除ボタンが表示されない', () => {
      const wrapper = mount(PostCard, {
        props: {
          post: mockPost,
          isOwnPost: false
        }
      });

      const deleteButton = wrapper.find('button');
      expect(deleteButton.exists()).toBe(false);
    });

    it('削除ボタンをクリックすると delete イベントが発火する', async () => {
      const wrapper = mount(PostCard, {
        props: {
          post: mockPost,
          isOwnPost: true
        }
      });

      const deleteButton = wrapper.find('button');
      await deleteButton.trigger('click');

      expect(wrapper.emitted('delete')).toBeTruthy();
      expect(wrapper.emitted('delete')[0]).toEqual(['post-123']);
    });
  });

  describe('スタイル', () => {
    it('投稿カードのクラスが正しく適用される', () => {
      const wrapper = mount(PostCard, {
        props: { post: mockPost }
      });

      const article = wrapper.find('article');
      expect(article.classes()).toContain('post-card');
    });

    it('アイコンラッパーのクラスが正しく適用される', () => {
      const wrapper = mount(PostCard, {
        props: { post: mockPost }
      });

      const iconWrapper = wrapper.find('.icon-wrapper');
      expect(iconWrapper.exists()).toBe(true);
    });
  });

  describe('time 要素の属性', () => {
    it('datetime 属性が正しく設定される', () => {
      const wrapper = mount(PostCard, {
        props: { post: mockPost }
      });

      const timeElement = wrapper.find('time');
      expect(timeElement.attributes('datetime')).toBe('2024-01-15T10:30:00Z');
    });

    it('title 属性が formatDateTime の結果と一致する', () => {
      const wrapper = mount(PostCard, {
        props: { post: mockPost }
      });

      const timeElement = wrapper.find('time');
      expect(timeElement.attributes('title')).toBe('2024-01-15 10:30:00');
    });
  });

  describe('投稿テキストの表示', () => {
    it('改行が保持される（whitespace-pre-wrap）', () => {
      const postWithNewlines = {
        ...mockPost,
        text: '1行目\n2行目\n3行目'
      };

      const wrapper = mount(PostCard, {
        props: { post: postWithNewlines }
      });

      const textElement = wrapper.find('p');
      expect(textElement.text()).toBe('1行目\n2行目\n3行目');
      expect(textElement.classes()).toContain('whitespace-pre-wrap');
    });

    it('長いテキストが折り返される（break-words）', () => {
      const postWithLongText = {
        ...mockPost,
        text: 'a'.repeat(200)
      };

      const wrapper = mount(PostCard, {
        props: { post: postWithLongText }
      });

      const textElement = wrapper.find('p');
      expect(textElement.classes()).toContain('break-words');
    });
  });

  describe('異なるアイコン', () => {
    it('icon-dog の場合、犬の絵文字が表示される', () => {
      const postWithDogIcon = {
        ...mockPost,
        users: {
          ...mockPost.users,
          icon: 'icon-dog'
        }
      };

      const wrapper = mount(PostCard, {
        props: { post: postWithDogIcon }
      });

      expect(wrapper.text()).toContain('🐶');
    });

    it('未知のアイコンの場合、デフォルト絵文字が表示される', () => {
      const postWithUnknownIcon = {
        ...mockPost,
        users: {
          ...mockPost.users,
          icon: 'unknown-icon'
        }
      };

      const wrapper = mount(PostCard, {
        props: { post: postWithUnknownIcon }
      });

      expect(wrapper.text()).toContain('😀');
    });
  });
});
