<template>
  <aside class="left-panel" :class="{ 'compact-left': leftCollapsed }">
    <!-- 头部 -->
    <div class="left-header" v-if="mode === 'batch'">
      <div class="title">
        待标注任务 ({{ totalNum - completeNum }})
      </div>
    </div>

    <div class="left-header" v-else>
      <div class="title">标注任务</div>
    </div>

    <!-- 任务列表 -->
    <el-scrollbar class="task-list">
      <div v-if="!tasks || tasks.length === 0" class="empty-state">
        <p class="empty-text">暂无待标注任务</p>
      </div>

      <div
        v-for="(item, index) in tasks"
        :key="item.task_id"
        class="task-card"
        :class="{
          active: index === activeIndex,
          disabled: !isTaskClickable(item, index)
        }"
        @click="handleTaskClick(item, index)"
      >
        <div class="task-header">
          <span class="task-hand">{{ item.user_name }}</span>

          <!-- 已完成标识 -->
          <!-- <span
            v-if="item.status === 2"
            class="header-check-circle"
            title="已完成"
            @click.stop="handleCompleteClick(item.task_id)"
          >
            ✔
          </span> -->
        </div>

        <div class="task-body">
          <span>性别：{{ item.gender || '--' }}</span>
          <span>年龄：{{ item.age || '--' }}</span>
        </div>
      </div>
    </el-scrollbar>
  </aside>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { savePhysicianTask } from '../data.api'

interface Task {
  task_id: number | string
  user_name: string
  gender: string
  age: number | string
  status: number   // 0:待标注 1:标注中 2:已完成
  [key: string]: any
}

const props = defineProps<{
  tasks: Task[]
  totalNum: number
  completeNum: number
  leftCollapsed: boolean
  mode: string
}>()

const emit = defineEmits<{
  (e: 'onSelectTask', task: Task): void
  (e: 'toggle-collapse'): void
  (e: 'complete-task'): void
}>()

/** 当前激活索引 */
const activeIndex = ref(0)
/** 第一个未完成任务索引 */
const firstUnfinishedIndex = ref(0)

/* ================= 核心规则 ================= */

/** 找到第一个未完成任务 */
function getFirstUnfinishedIndex(tasks: Task[]) {
  return tasks.findIndex(t => t.status !== 2)
}

/** 是否允许点击任务 */
function isTaskClickable(task: Task, index: number) {
  if (task.status === 2) return true
  return index === firstUnfinishedIndex.value
}

/* ================= 行为 ================= */

function handleTaskClick(task: Task, index: number) {
  if (!isTaskClickable(task, index)) return
  activeIndex.value = index
  emit('onSelectTask', task)
}

/** 点击完成 */
async function handleCompleteClick(taskId: number | string) {
  const { code } = await savePhysicianTask(taskId)
  if (code !== 0) return

  emit('complete-task')
}

/* ================= 同步 tasks 状态 ================= */

watch(
  () => props.tasks,
  (newTasks) => {
    if (!newTasks || newTasks.length === 0) {
      activeIndex.value = 0
      firstUnfinishedIndex.value = 0
      return
    }

    const idx = getFirstUnfinishedIndex(newTasks)
    firstUnfinishedIndex.value =
      idx === -1 ? newTasks.length - 1 : idx

    // 当前 active 不合法 → 自动修正
    if (!isTaskClickable(newTasks[activeIndex.value], activeIndex.value)) {
      activeIndex.value = firstUnfinishedIndex.value
      emit('onSelectTask', newTasks[activeIndex.value])
    }
  },
  { immediate: true }
)
defineExpose({
  handleCompleteClick
});
</script>

<style scoped>
.left-panel {
  display: flex;
  flex-direction: column;
  height: calc(91vh - 16px);
  background: rgba(255, 255, 255, 0.85);
  border-radius: 12px;
  border: 1px solid rgba(20, 20, 20, 0.04);
  overflow: hidden;
}

.left-header {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  font-weight: 600;
}

.task-list {
  padding: 8px;
  flex: 1;
}

.task-card {
  background: #fff;
  border-radius: 8px;
  padding: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  border: 1px solid rgba(16, 24, 40, 0.05);
}

.task-card.active {
  border: 2px solid #3b82f6;
  background: #eaf6ff;
}

.task-card.disabled {
  opacity: 0.45;
  cursor: not-allowed;
  pointer-events: none;
}

.task-header {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  font-size: 13px;
}

.task-id {
  color: #3b82f6;
}

.task-body span {
  font-size: 12px;
  margin-right: 6px;
  color: #64748b;
}

.header-check-circle {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #67c23a;
  color: #fff;
  font-size: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
