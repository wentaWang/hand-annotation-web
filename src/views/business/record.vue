<template>
  <div class="record-page">
    <!-- 头部 -->
    <div class="page-header">
      <h2>📋 标注记录</h2>
    </div>

    <!-- 查询条件 -->
    <div class="filter-card">
      <div class="filter-item" v-if="currentUserType != 'physician'">
        <label>标注医生</label>
        <select v-model="query.physician_id" @change="handleSearch">
          <option value="">全部</option>
          <option
            v-for="item in physicianOptions"
            :key="item.id"
            :value="item.id"
          >
            {{ item.username }}
          </option>
        </select>
      </div>

      <div class="filter-item">
        <label>开始时间</label>
        <input type="date" v-model="query.start_date" @change="handleSearch"/>
      </div>

      <div class="filter-item">
        <label>结束时间</label>
        <input type="date" v-model="query.end_date" @change="handleSearch"/>
      </div>

      <div class="filter-actions">
        <button class="btn primary" @click="handleSearch">查询</button>
        <button class="btn" @click="handleReset">重置</button>
      </div>
    </div>

    <!-- 表格 -->
    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>病例编号</th>
            <th>标注医生</th>
            <th>标注状态</th>
            <th>完成时间</th>
            <th>左手任务</th>
            <th>右手任务</th>
            <th>操作</th>
          </tr>
        </thead>

        <tbody>
          <template v-for="item in recordList" :key="item.id">
            <!-- 主行 -->
            <tr>
              <td>
                <span class="expand-icon" @click="item.expanded = !item.expanded">
                  {{ item.expanded ? '▼' : '▶' }}
                </span>
                {{ item.caseId }}
              </td>
              <td>{{ item.doctor }}</td>
              <td>
                <span :style="{ color: statusColor(item.status) }">
                  {{ statusText(item.status) }}
                </span>
              </td>
              <td>{{ item.finishTime }}</td>
              <td>{{ item.leftHand.count }}</td>
              <td>{{ item.rightHand.count }}</td>
              <td>
                <button class="btn-link" @click="handleGoIn(item)">
                  标注
                </button>
              </td>
            </tr>

            <!-- 子表 -->
            <tr v-if="item.expanded" class="child-row">
              <td colspan="7">
                <!-- 左手 -->
                <div class="hand-block">
                  <h4>🖐 左手（{{ item.leftHand.count }}）</h4>
                  <table class="child-table">
                    <thead>
                      <tr>
                        <th>任务名称</th>
                        <th>标注类型</th>
                        <th>完成时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="task in item.leftHand.annotations"
                        :key="task.id"
                      >
                        <td>{{ task.name }}</td>
                        <td>{{ task.organType }}</td>
                        <td>{{ task.finishTime }}</td>
                      </tr>
                      <tr v-if="item.leftHand.annotations.length === 0">
                        <td colspan="3" class="empty">暂无任务</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- 右手 -->
                <div class="hand-block">
                  <h4>🖐 右手（{{ item.rightHand.count }}）</h4>
                  <table class="child-table">
                    <thead>
                      <tr>
                        <th>任务名称</th>
                        <th>标注类型</th>
                        <th>完成时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="task in item.rightHand.annotations"
                        :key="task.id"
                      >
                        <td>{{ task.name }}</td>
                        <td>{{ task.organType }}</td>
                        <td>{{ task.finishTime }}</td>
                      </tr>
                      <tr v-if="item.rightHand.annotations.length === 0">
                        <td colspan="3" class="empty">暂无任务</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </template>

          <tr v-if="recordList.length === 0">
            <td colspan="7" class="empty">暂无数据</td>
          </tr>
        </tbody>
      </table>

      <!-- 分页 -->
      <div class="pagination">
        <div class="pagination-info">
          共 {{ total }} 条 ｜ 第 {{ query.page }} / {{ totalPages }} 页
        </div>

        <div class="pagination-actions">
          <button
            class="page-btn"
            :disabled="query.page === 1"
            @click="changePage(query.page - 1)"
          >
            上一页
          </button>

          <button
            v-for="p in pageNumbers"
            :key="p"
            class="page-btn"
            :class="{ active: p === query.page }"
            @click="changePage(p)"
          >
            {{ p }}
          </button>

          <button
            class="page-btn"
            :disabled="query.page === totalPages"
            @click="changePage(query.page + 1)"
          >
            下一页
          </button>
        </div>
      </div>
    </div>

    <!-- 抽屉（原逻辑不动） -->
    <Teleport to="body">
      <div v-if="showAnnotation" class="drawer-mask">
        <div class="drawer">
          <AnnotationPanel
            :taskId="currentTaskId"
            @close="showAnnotation = false"
          />
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getPhysicianStatRecord, getPhysicianList } from './data.api'
import AnnotationPanel from './components/annotationPanel.vue'
import { useAppStore } from '@/store'

const store = useAppStore()
const currentUserType = store.state.user.userType

/** 查询参数 */
const query = ref({
  physician_id: '',
  start_date: '',
  end_date: '',
  page: 1,
  limit: 10
})

/** 数据 */
const recordList = ref([])
const physicianOptions = ref([])
const total = ref(0)

const showAnnotation = ref(false)
const currentTaskId = ref('')

/** 映射 */
const handMap = { 0: '左手', 1: '右手' }
const nodeTypeMap = { 1: '特征点', 0: '器官' }

/** 状态 */
function statusColor(status) {
  return { 0: '#e6a23c', 1: '#409eff', 2: '#67c23a' }[status] || '#999'
}
function statusText(status) {
  return { 0: '待标注', 1: '标注中', 2: '已完成' }[status] || '未知'
}

/** 医生下拉 */
async function getPhysicianOptions() {
  const res = await getPhysicianList()
  physicianOptions.value = res?.data || []
}

/** 构建手数据 */
function buildHand(handStatistic) {
  const annotations = Array.isArray(handStatistic?.annotations)
    ? handStatistic.annotations
    : []

  const finishedTimes = annotations
    .filter(a => a && a.finished_at)
    .map(a => a.finished_at)

  return {
    count: annotations.length,
    finishedTimes,
    annotations: annotations.map(a => ({
      id: a.annotation_id,
      name: `标注 ${a.annotation_id}`,
      organType: nodeTypeMap[a.node_type],
      finishTime: a.finished_at
        ? a.finished_at.replace('T', ' ')
        : '-'
    }))
  }
}


/** 查询记录 */
async function getRecord() {
  const res = await getPhysicianStatRecord(query.value)
  const records = res?.data?.records || []
  total.value = res?.data?.total || 0

  recordList.value = records.map(item => {
    const leftHand = buildHand(item.left_hand_statistic)
    const rightHand = buildHand(item.right_hand_statistic)

    const allFinished = [
      ...leftHand.finishedTimes,
      ...rightHand.finishedTimes
    ]

    const finishTime = allFinished.length
      ? allFinished.sort().slice(-1)[0].replace('T', ' ')
      : '-'

    return {
      id: item.diagnose_id,
      caseId: item.task_id,
      doctor: item.physicianName,
      status: item.status,
      finishTime,
      expanded: false,
      leftHand,
      rightHand
    }
  })
}

/** 分页 */
const totalPages = computed(() =>
  Math.ceil(total.value / query.value.limit)
)

const pageNumbers = computed(() => {
  const pages = []
  const start = Math.max(1, query.value.page - 2)
  const end = Math.min(totalPages.value, start + 4)
  for (let i = start; i <= end; i++) pages.push(i)
  return pages
})

function changePage(p) {
  if (p < 1 || p > totalPages.value) return
  query.value.page = p
  getRecord()
}

function handleSearch() {
  query.value.page = 1
  getRecord()
}

function handleReset() {
  query.value = {
    physician_id: '',
    start_date: '',
    end_date: '',
    page: 1,
    limit: 10
  }
  getRecord()
}

function handleGoIn(item) {
  currentTaskId.value = item.caseId
  showAnnotation.value = true
}

onMounted(() => {
  getPhysicianOptions()
  getRecord()
})
</script>

<style scoped>
.record-page {
  padding: 24px;
  background: #f5f7fa;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
}

.filter-card {
  display: flex;
  gap: 16px;
  align-items: flex-end;
  background: #fff;
  padding: 16px;
  border-radius: 10px;
  margin-bottom: 16px;
}

.filter-item {
  display: flex;
  flex-direction: column;
}

.filter-item label {
  font-size: 14px;
  margin-bottom: 4px;
}

.filter-item input,
.filter-item select {
  height: 32px;
  padding: 0 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
}

.filter-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.btn {
  height: 32px;
  padding: 0 14px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #fff;
}

.btn.primary {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.table-card {
  background: #fff;
  padding: 16px;
  border-radius: 10px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

th,
td {
  padding: 10px 8px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
}

.expand-icon {
  cursor: pointer;
  margin-right: 6px;
  user-select: none;
}

.child-row td {
  background: #f9fafb;
  padding: 16px;
}

.child-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.child-table th,
.child-table td {
  padding: 6px 8px;
  border: 1px solid #e5e7eb;
}

.child-table th {
  background: #f3f4f6;
}

.hand-block {
  margin-bottom: 16px;
}

.hand-block h4 {
  margin: 8px 0;
  font-size: 13px;
  color: #374151;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.pagination-actions {
  display: flex;
  gap: 6px;
}

.page-btn {
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid #d1d5db;
  background: #fff;
  cursor: pointer;
}

.page-btn.active {
  background: #2563eb;
  color: #fff;
  border-color: #2563eb;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.empty {
  text-align: center;
  padding: 20px;
  color: #9ca3af;
}

.btn-link {
  background: none;
  border: none;
  padding: 0;
  color: #2563eb;
  cursor: pointer;
  font-size: 13px;
}

.btn-link:hover {
  text-decoration: underline;
}

.drawer-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.drawer {
  position: absolute;
  right: 0;
  top: 0;
  width: 90%;
  height: 100%;
  background: #fff;
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.1);
}
</style>
