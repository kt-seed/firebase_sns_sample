import { vi } from 'vitest';

// IntersectionObserver の簡易モック
class MockIntersectionObserver {
  callback;
  constructor(callback) {
    this.callback = callback;
  }
  observe(element) {
    this.callback([{ isIntersecting: false, target: element }]);
  }
  unobserve() {}
  disconnect() {}
}

if (typeof window !== 'undefined' && !('IntersectionObserver' in window)) {
  // @ts-ignore
  window.IntersectionObserver = MockIntersectionObserver;
}

// Supabase の Realtime Channel 用スタブで使用される removeEventListener などに備える
vi.stubGlobal('matchMedia', vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
})));
