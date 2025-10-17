import { describe, it, expect, beforeEach } from 'vitest';
import { useToast } from '@/composables/useToast';

describe('useToast', () => {
  beforeEach(() => {
    const { clearAllToasts } = useToast();
    clearAllToasts();
  });

  it('showToast でトーストが追加される', () => {
    const { toasts, showToast } = useToast();
    const id = showToast('テストメッセージ', 'success', 0);

    expect(id).toBeGreaterThanOrEqual(0);
    expect(toasts.value).toHaveLength(1);
    expect(toasts.value[0]).toMatchObject({
      id,
      message: 'テストメッセージ',
      type: 'success'
    });
  });

  it('removeToast で対象トーストが削除される', () => {
    const { toasts, showToast, removeToast } = useToast();
    const id = showToast('削除テスト', 'info', 0);
    expect(toasts.value).toHaveLength(1);

    removeToast(id);
    expect(toasts.value).toHaveLength(0);
  });

  it('success / error ショートカットで type が設定される', () => {
    const { toasts, success, error } = useToast();
    success('成功メッセージ', 0);
    error('エラーメッセージ', 0);

    expect(toasts.value).toHaveLength(2);
    expect(toasts.value[0].type).toBe('success');
    expect(toasts.value[1].type).toBe('error');
  });
});
