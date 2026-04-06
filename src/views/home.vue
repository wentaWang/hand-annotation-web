<template>
  <div class="dashboard">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <h2>👩‍⚕️ 医生标注工作台</h2>
      </div>
    </div>

    <!-- Overview -->
    <div class="overview">
      <!-- Progress -->
      <div class="progress-card">
        <div class="progress-title">任务完成率</div>

        <div class="circle">
          <svg viewBox="0 0 36 36">
            <path
              class="bg"
              d="M18 2.0845
                 a 15.9155 15.9155 0 0 1 0 31.831
                 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              class="progress"
              :stroke-dasharray="completionRate + ', 100'"
              d="M18 2.0845
                 a 15.9155 15.9155 0 0 1 0 31.831
                 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div class="percent">{{ completionRate }}%</div>
        </div>

        <div class="progress-tip">
          已完成 {{ stats.completed }} / {{ stats.total }}
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-card">
        <div class="stat" v-for="item in statList" :key="item.label">
          <div class="label">{{ item.label }}</div>
          <div class="value" :class="item.type">{{ item.value }}</div>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="actions">
      <div class="action-card primary" @click="goInPage('annotation')">
        <div class="icon">✍️</div>
        <div class="title">开始标注</div>
        <div class="desc">进行中 {{ stats.processing }}</div>
      </div>

      <div class="action-card" @click="go('uncompleted')">
        <div class="icon">📝</div>
        <div class="title">未标注任务</div>
        <div class="desc">剩余 {{ stats.uncompleted }}</div>
      </div>

      <div class="action-card" @click="goInPage('record')">
        <div class="icon">📚</div>
        <div class="title">历史记录</div>
        <div class="desc">已完成 {{ stats.completed }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPhysicianStat } from './business/data.api'

const router = useRouter()

/* ===============================
   仪表盘数据
================================ */
const stats = reactive({
  total: 0,
  completed: 0,
  processing: 0,
  todayCompleted: 0,
  uncompleted: 0
})

/* ===============================
   计算属性
================================ */
const completionRate = computed(() =>
  stats.total ? Math.round((stats.completed / stats.total) * 100) : 0
)

const statList = computed(() => [
  { label: '总任务', value: stats.total, type: 'total' },
  { label: '已标注', value: stats.completed, type: 'done' },
  { label: '进行中', value: stats.processing, type: 'processing' },
  { label: '未标注', value: stats.uncompleted, type: 'pending' }
])

/* ===============================
   接口数据
================================ */
async function getStat() {
  try {
    const res = await getPhysicianStat()
    if (res.code === 0 && res.data?.physician_stat) {
      const s = res.data.physician_stat

      stats.total = s.predict_task_total ?? 0
      stats.completed = s.task_completed ?? 0
      stats.processing = s.task_in_processing ?? 0
      stats.uncompleted = stats.total - stats.completed
    }
  } catch (e) {
    console.error('getPhysicianStat error', e)
  }
}

/* ===============================
   跳转
================================ */
function go(type) {
  console.log('navigate to', type)
}

function goInPage(name) {
   router.push({ name })
}

onMounted(() => {
  getStat()
})
</script>

<style scoped>
.dashboard {
  padding: 24px;
  background: linear-gradient(180deg, #f5f7fb 0%, #f0f3fa 100%);
}


.header-left h2 {
  margin: 0;
  font-size: 24px;
}

.sub {
  margin-top: 6px;
  opacity: 0.85;
  font-size: 14px;
}

.primary-btn {
  background: #fff;
  color: #3e8ef7;
  border: none;
  padding: 12px 22px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

/* Overview */
.overview {
  margin-top: 24px;
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 20px;
}

.progress-card,
.stats-card {
  background: #fff;
  border-radius: 20px;
  padding: 24px;
}

/* Progress */
.progress-title {
  font-weight: 600;
  margin-bottom: 12px;
}

.circle {
  position: relative;
  width: 160px;
  margin: 0 auto;
}

.bg {
  fill: none;
  stroke: #eee;
  stroke-width: 3.5;
}

.progress {
  fill: none;
  stroke: #4facfe;
  stroke-width: 3.5;
  stroke-linecap: round;
}

.percent {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 30px;
  font-weight: 700;
}

.progress-tip {
  margin-top: 14px;
  text-align: center;
  color: #888;
}

/* Stats */
.stats-card {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.stat {
  background: #f8f9fc;
  border-radius: 16px;
  padding: 18px;
  transition: all 0.2s;
}

.stat:hover {
  transform: translateY(-3px);
}

.label {
  color: #888;
  font-size: 14px;
}

.value {
  margin-top: 6px;
  font-size: 30px;
  font-weight: bold;
}

.done {
  color: #2ecc71;
}

.processing {
  color: #3e8ef7;
}

.pending {
  color: #f39c12;
}

/* Actions */
.actions {
  margin-top: 24px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.action-card {
  background: #fff;
  border-radius: 20px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.25s;
}

.action-card.primary {
  background: linear-gradient(135deg, #3e8ef7, #6ba8ff);
  color: #fff;
}

.action-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 14px 30px rgba(0, 0, 0, 0.12);
}

.icon {
  font-size: 32px;
}

.title {
  margin-top: 12px;
  font-size: 18px;
  font-weight: 600;
}

.desc {
  margin-top: 6px;
  font-size: 14px;
  opacity: 0.85;
}
</style>
