<template>
  <div class="annotation-form">
    <!-- 头部 -->
    <div class="form-header">
      <span>{{ title }}</span>
      <button class="close-btn" @click="$emit('close')">×</button>
    </div>

    <!-- 内容 -->
    <div class="form-body">
      <Annotation mode="single" :taskId="taskId"/>
    </div>
    <!-- 操作 -->
    <div class="form-actions">
      <el-button size="small" @click="handleCancel">
        取消
      </el-button>
   

      <el-button size="small" type="success" @click="handleSubmit">
        提交
      </el-button>

    </div>

  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import Annotation from '../annotation.vue'
import { ElMessage } from 'element-plus'
/**
 * Props
 */
const props = defineProps({
  title: {
    type: String,
    default: '标注'
  },
  taskId: {
    type: String,
    default: ""
  },
})

/**
 * Emits
 */
const emit = defineEmits([
  'close',
  'save',
  'submit'
])

/**
 * 本地副本（避免直接改 props）
 */
const localAnnotations = ref([])

watch(
  () => props.annotations,
  (val) => {
    localAnnotations.value = JSON.parse(JSON.stringify(val || []))
  },
  { immediate: true }
)

/**
 * 子组件事件
 */
const viewAnnotation = (item) => {
  console.log('查看标注:', item)
}

const changeFeature = (val) => {
  // feature 修改
  localAnnotations.value = val
}

/**
 * 按钮事件
 */
const handleCancel = () => {
  emit('close')
}

const handleSave = () => {
  emit('save', {
    task: props.task,
    annotations: localAnnotations.value
  })
}

const handleSubmit = () => {
  // 简单校验（可扩展）
  if (!localAnnotations.value || localAnnotations.value.length === 0) {
    ElMessage.warning('请先完成标注')
    return
  }

  emit('submit', {
    task: props.task,
    annotations: localAnnotations.value
  })
}
</script>

<style scoped>
.annotation-form {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: bold;
  padding: 8px;
  border-bottom: 1px solid #eee;
}

.close-btn {
  border: none;
  background: none;
  font-size: 18px;
  cursor: pointer;
}

.form-body {
  flex: 1;
  overflow: auto;
  padding: 10px;
}

.form-actions {
  border-top: 1px solid #eee;
  padding: 10px;
  text-align: right;
}
</style>