import { setActivePinia, createPinia } from 'pinia';

export function createTestingPinia() {
  const pinia = createPinia();
  setActivePinia(pinia);
  return pinia;
}
