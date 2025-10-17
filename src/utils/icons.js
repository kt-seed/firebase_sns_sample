export const USER_ICONS = [
  { id: 'icon-cat', emoji: '🐱', name: '猫' },
  { id: 'icon-dog', emoji: '🐶', name: '犬' },
  { id: 'icon-bear', emoji: '🐻', name: '熊' },
  { id: 'icon-fox', emoji: '🦊', name: '狐' },
  { id: 'icon-panda', emoji: '🐼', name: 'パンダ' },
  { id: 'icon-koala', emoji: '🐨', name: 'コアラ' },
  { id: 'icon-tiger', emoji: '🐯', name: '虎' },
  { id: 'icon-lion', emoji: '🦁', name: 'ライオン' },
  { id: 'icon-monkey', emoji: '🐵', name: '猿' },
  { id: 'icon-rabbit', emoji: '🐰', name: 'うさぎ' },
  { id: 'icon-mouse', emoji: '🐭', name: 'ねずみ' },
  { id: 'icon-hamster', emoji: '🐹', name: 'ハムスター' },
  { id: 'icon-bird', emoji: '🐦', name: '鳥' },
  { id: 'icon-penguin', emoji: '🐧', name: 'ペンギン' },
  { id: 'icon-frog', emoji: '🐸', name: 'カエル' },
  { id: 'icon-pig', emoji: '🐷', name: '豚' },
  { id: 'icon-cow', emoji: '🐮', name: '牛' },
  { id: 'icon-dragon', emoji: '🐲', name: '龍' },
  { id: 'icon-unicorn', emoji: '🦄', name: 'ユニコーン' },
  { id: 'icon-alien', emoji: '👽', name: 'エイリアン' }
];

export const DEFAULT_ICON = 'icon-cat';

export function getIconEmoji(iconId) {
  const icon = USER_ICONS.find((item) => item.id === iconId);
  return icon ? icon.emoji : '👤';
}

export function getIconById(iconId) {
  return USER_ICONS.find((item) => item.id === iconId) || null;
}

export function getRandomIconId() {
  const randomIndex = Math.floor(Math.random() * USER_ICONS.length);
  return USER_ICONS[randomIndex].id;
}
