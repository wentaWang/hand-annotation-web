<template>
  <el-date-picker
    v-model="internalValue"
    type="daterange"
    :shortcuts="shortcuts"
    :placeholder="placeholder"
    @change="handleChange"
    clearable
  />
</template>

<script lang="ts" setup>
import { ref, defineProps, defineEmits, computed, watch } from 'vue';

const props = defineProps({
  value: {
    type: Array as () => [Date, Date],
    default: () => []
  },
  placeholder: {
    type: String,
    default: '选择日期'
  },
  needShortcuts: {
    type: Array as () => string[],
    default: () => ['curDay', 'curWeek']
  }
});

const emit = defineEmits<{
  (e: 'update:value', value: [Date, Date]): void;
  (e: 'change', value: [Date, Date]): void;
}>();

const internalValue = ref<[Date, Date]>(props.value);

// 简化日期范围的计算逻辑
const createShortcut = (text: string, startDate: Date, endDate: Date) => ({
  text,
  onClick(picker: any) {
    picker.$emit('pick', [startDate, endDate]);
  }
});

const shortcuts = computed(() => {
  const availableShortcuts = [];
  const today = new Date();
  
  // 提前创建各种日期范围
  const startOfWeek = getStartOfWeek(today);
  const endOfWeek = getEndOfWeek(today);
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  const endOfYear = new Date(today.getFullYear(), 12, 0);
  

  if (props.needShortcuts.includes('curDay')) {
    availableShortcuts.push(createShortcut('今天', today, today));
  }
  if (props.needShortcuts.includes('curWeek')) {
    availableShortcuts.push(createShortcut('本周', startOfWeek, endOfWeek));
  }
  if (props.needShortcuts.includes('curMonth')) {
    availableShortcuts.push(createShortcut('本月', startOfMonth, endOfMonth));
  }
  if (props.needShortcuts.includes('curYear')) {
    availableShortcuts.push(createShortcut('本年', startOfYear, endOfYear));
  }
  
  return availableShortcuts;
});

const handleChange = (value: [Date, Date]) => {
  internalValue.value = value;
  emit('update:value', value);
  emit('change', value);
};

// 获取本周开始日期（周一）
function getStartOfWeek(date: Date) {
  const dayOfWeek = date.getDay();
  date.setDate(date.getDate() - dayOfWeek + 1); // 周一
  date.setHours(0, 0, 0, 0);
  return new Date(date);
}

// 获取本周结束日期（周日）
function getEndOfWeek(date: Date) {
  const dayOfWeek = date.getDay();
  date.setDate(date.getDate() + (7 - dayOfWeek)); // 周日
  date.setHours(23, 59, 59, 999);
  return new Date(date);
}

watch(() => props.value, (newVal) => {
  internalValue.value = newVal;
}, { immediate: true });
</script>
