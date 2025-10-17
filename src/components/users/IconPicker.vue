<script setup>
import { computed, ref, watch } from 'vue';
import { USER_ICONS, DEFAULT_ICON, getIconEmoji } from '@/utils/icons';

const props = defineProps({
  modelValue: {
    type: String,
    default: DEFAULT_ICON
  }
});

const emit = defineEmits(['update:modelValue']);

// 現在選択されているアイコン ID を内部状態として保持する
const selectedIcon = ref(props.modelValue);

watch(
  () => props.modelValue,
  (value) => {
    selectedIcon.value = value;
  }
);

const isSelected = (iconId) => selectedIcon.value === iconId;

const selectIcon = (iconId) => {
  selectedIcon.value = iconId;
  emit('update:modelValue', iconId);
};

const currentIconEmoji = computed(() => getIconEmoji(selectedIcon.value));
</script>

<template>
  <div class="icon-picker">
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        プロフィールアイコン
      </label>
      <div class="flex items-center gap-3">
        <div
          class="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-4xl border-2 border-gray-300"
        >
          {{ currentIconEmoji }}
        </div>
        <div class="text-sm text-gray-600">
          <p>現在のアイコン</p>
          <p class="text-xs text-gray-500">クリックして変更できます</p>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-5 gap-3">
      <button
        v-for="icon in USER_ICONS"
        :key="icon.id"
        type="button"
        :class="[
          'w-14 h-14 rounded-full text-3xl transition-all duration-200',
          'hover:scale-110 hover:shadow-md',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
          isSelected(icon.id)
            ? 'bg-blue-100 border-2 border-blue-500 scale-105 shadow-md'
            : 'bg-gray-100 border-2 border-transparent hover:border-gray-300'
        ]"
        :title="icon.name"
        @click="selectIcon(icon.id)"
      >
        {{ icon.emoji }}
      </button>
    </div>

    <p class="mt-3 text-xs text-gray-500 text-center">
      20種類のアイコンから選べます
    </p>
  </div>
</template>

<style scoped>
.icon-picker {
  padding: 1rem;
  background-color: #ffffff;
  border-radius: 0.75rem;
}
</style>
