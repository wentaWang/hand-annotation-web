<template>
  <div class="tab-container">
    <el-tabs @tab-click="handleTabClick">
      <!-- 待标注任务 Tab -->
      <el-tab-pane  :label="`待标注 (${unfinished.length})`"> 
        <el-table
          :data="unfinished"
           row-key="id"
            v-loading="loading"
            :virtualized="true"
          border
          style="width: 100%; font-size: 12px"
          :table-layout="'fixed'"
          height="500"
        >
          <el-table-column prop="name" label="器官" width="90" />
          <el-table-column prop="description" label="描述" width="100" />
          <el-table-column label="状态" width="70">
            <template #default="{ row }">
              <span :style="{ color: STATUS_MAP[row.status]?.color }">
                {{ STATUS_MAP[row.status]?.text }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" class-name="operation-column">
            <template #default="{ row,$index}">
              <el-button 
                class="action-btn annotate" 
                @click="initOrganAnnotation(row, $event)"
                :disabled="$index !== activeIndex"
              >器官</el-button>
              <el-button 
                class="action-btn complete" 
                @click="initFetureAnnotation(row, 'feature', $event)"
                :disabled="$index  !== activeIndex || row.status !== 2"
              >特征点</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 已完成任务 Tab -->
      <el-tab-pane :label="`已标注 (${finished.length})`">
        <el-table
          :data="finished"
           row-key="id"
          border
          style="width: 100%; font-size: var(--font-size)"
          :table-layout="'fixed'"
        >
          <el-table-column prop="name" label="任务名称" width="100" />
          <el-table-column label="状态" width="70">
            <template #default="{ row }">
              <span :style="{ color: STATUS_MAP[row.status]?.color }">
                {{ STATUS_MAP[row.status]?.text }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" class-name="operation-column">
            <template #default="{ row }">
              <el-button 
                class="action-btn annotate" 
                @click="initOrganAnnotation(row, $event)"
              >器官</el-button>
              <el-button 
                class="action-btn complete" 
                @click="initFetureAnnotation(row, 'feature', $event)"
                :disabled="row.contour.length == 0"
              >特征点</el-button>
            </template>
          </el-table-column>
        </el-table>
        
      </el-tab-pane>
      <!-- 跳过的任务 Tab -->
       <el-tab-pane  :label="`已跳过 (${passed.length})`"> 
        <el-table
          :data="passed"
           row-key="id"
            v-loading="loading"
            :virtualized="true"
          border
          style="width: 100%; font-size: 12px"
          :table-layout="'fixed'"
          height="500"
        >
          <el-table-column prop="name" label="器官" width="90" />
          <el-table-column prop="description" label="描述" width="100" />
          <el-table-column label="状态" width="70">
            <template #default="{ row }">
              <span :style="{ color: STATUS_MAP[row.status]?.color }">
                {{ STATUS_MAP[row.status]?.text }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" class-name="operation-column">
            <template #default="{ row,$index}">
              <el-button 
                class="action-btn annotate" 
                @click="initOrganAnnotation(row, $event)"
                :disabled="$index !== activeIndex"
              >器官</el-button>
              <el-button 
                class="action-btn complete" 
                @click="initFetureAnnotation(row, 'feature', $event)"
                :disabled="$index  !== activeIndex || row.status !== 2"
              >特征点</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
    <el-button
      circle
      type="primary"
      size="small"
      class="next-btn"
      @click="handleNextTask"
      v-if="unfinished.length == 0"
    >
      <el-icon><ArrowRight /></el-icon>
    </el-button>
  </div>
  <!-- 标注面板 -->
   <KeepAlive>
    <div v-if="showAnnotationPanel" class="annotation-form" 
        :style="panelStyle"
        @mousedown="startDrag"
        @touchstart="startDrag">
      <div class="form-header">
      <span>
        {{ curType === 'organ'
            ? `标注器官 - ${organTask?.name || '未知任务'}`
            : `标注特征点`
        }}
      </span>

        <button class="close-btn" @click="closePanel">×</button>
      </div>
      <div class="form-body">
        <!-- 器官标注 -->
        <div v-if="curType === 'organ'" class="organ-card">
          <h3>器官标注
           <span
            class="status-icon"
            :style="{ color: STATUS_MAP[organTask?.status]?.color }"
          >
            {{ STATUS_MAP[organTask?.status]?.text }}
          </span>
          </h3>
          <p class="organ-desc">
            <span class="desc-label">器官描述</span>
            <span class="desc-value">
              {{ organTask?.description || '暂无器官描述' }}
            </span>
          </p>
          <div v-if="organAnnotations && organAnnotations.length">
            <div v-for="(anno,index) in organAnnotations" :key="anno.id" 
                class="annotation-item"
                :class="{ 'selected': selectedAnnotationId === anno.id }"
                @click="selectAnnotation(anno, 'organ')">
                  <div class="anno-info">
                    <span class="anno-type">{{ index+1 }}</span>
                    <div class="shape-preview">
                      <svg width="28" height="28" viewBox="0 0 24 24">
                        <template v-if="anno.type === 'rect'">
                          <rect x="4" y="4" width="16" height="16" 
                                :fill="anno.fill ? (anno.color || '#409EFF') : 'transparent'"
                                :stroke="anno.borderColor || anno.color || '#409EFF'"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"/>
                        </template>
                        <template v-else-if="anno.type === 'circle'">
                          <circle cx="12" cy="12" r="8" 
                                  :fill="anno.fill ? (anno.color || '#409EFF') : 'transparent'"
                                  :stroke="anno.borderColor || anno.color || '#409EFF'"
                                  stroke-width="2"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"/>
                        </template>
                        <template v-else-if="anno.type === 'triangle'">
                          <polygon points="12,4 20,20 4,20" 
                                  :fill="anno.fill ? (anno.color || '#409EFF') : 'transparent'"
                                  :stroke="anno.borderColor || anno.color || '#409EFF'"
                                  stroke-width="2"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"/>
                        </template>
                        <template v-else-if="anno.type === 'diamond'">
                          <polygon points="12,4 20,12 12,20 4,12" 
                                  :fill="anno.fill ? (anno.color || '#409EFF') : 'transparent'"
                                  :stroke="anno.borderColor || anno.color || '#409EFF'"
                                  stroke-width="2"
                                  stroke-linecap="round"
                                  stroke-linejoin="round"/>
                        </template>
                        <template v-else-if="anno.type === 'custom'">
                          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" 
                                :fill="anno.fill ? (anno.color || '#409EFF') : 'transparent'"
                                :stroke="anno.borderColor || anno.color || '#409EFF'"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"/>
                        </template>
                        <template v-else>
                          <!-- 默认图形 -->
                          <rect x="4" y="4" width="16" height="16" 
                                :fill="anno.fill ? (anno.color || '#409EFF') : 'transparent'"
                                :stroke="anno.borderColor || anno.color || '#409EFF'"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"/>
                        </template>
                      </svg>
                  </div>
                    <span class="status-icon" :style="{ color: STATUS_MAP[anno?.status]?.color }">
                      {{ formatDate(anno.createTime) }}
                    </span>
                    <el-button size="small" class="action-btn view"
                        @click.stop="viewAnnotation(anno, 'organ',anno.id)"
                      >{{ selectedAnnotationId === anno.id ? '取消' : '查看' }}</el-button>
                      

                      <el-button size="small" class="action-btn delete"
                        @click.stop="deleteAnnotation(anno, 'organ',anno.id)"
                      >删除</el-button>
                  </div>
            </div>
          </div>
          <div
            v-else
            class="no-data"
          >
            {{ organTask?.status === 2 ? '位置不清晰' : '暂无器官标注数据' }}
          </div>

        </div>
          <div v-if="curType === 'feature'" class="feature-card">
            <el-tabs
              v-model="selectedAnnotationId"
              type="card"
              @tab-click="onOrganTabChange"
            >
              <el-tab-pane
                v-for="(anno,index) in organAnnotations"
                :key="anno.id"
                :label="`${organTask?.name}${index+1}`"
                :name="anno.id"
              > 
                <!-- ⭐ 关键：增加 key -->
                <el-radio-group
                  :key="selectedAnnotationId"
                  v-model="activeFeatureId"
                  class="feature-radio-list"
                  @change="(value) => onFeatureChange(value, anno)"
                >

                  <el-radio
                    v-for="feature in featureList || []"
                    :key="feature.id"
                    :label="feature.id"
                    class="feature-radio-item"
                  >
                    <div class="feature-item">
                      <div class="feature-title">
                        {{ feature.name }}
                      </div>

                      <div class="feature-desc">
                        {{ feature.description || '暂无特征点描述' }}
                      </div>
                    </div>
                  </el-radio>

                </el-radio-group>

              </el-tab-pane>
            </el-tabs>
          </div>
      </div>
      <div class="form-actions">
        <el-button @click="closePanel" size="small">取消</el-button>
        <el-button type="info" size="small"  @click="saveAnnotations('uncertain',organTask)" v-if="curType == 'organ'">不确定</el-button>
        <el-button type="danger" size="small"  @click="saveAnnotations('pass',organTask)" v-if="curType == 'organ'">跳过</el-button>
        <!-- <el-button type="info" size="small"  @click="saveFeature('uncertain',curOrganAnnotation)" v-else>不确定</el-button> -->
        <!-- <el-button type="primary" size="small" @click="saveAnnotations('save',organTask)">暂存</el-button> -->
        <el-button type="success" size="small" @click="saveAnnotations('submit',organTask)" v-if="curType == 'organ'">提交</el-button>
        <el-button type="success" size="small" @click="saveFeature('submit',curOrganAnnotation)" v-if="curType == 'feature'">提交</el-button>
        <el-button
        v-if="curType == 'organ'"
        style="background-color:#2f6fed; border-color:#2f6fed; color:#fff"
        size="small" 
        @click="handleAnnotateClick"
        
      >
        {{ isAnnotationing ? '标注中' : '开始标注' }}
      </el-button>
      </div>
    </div>
   </KeepAlive>
  
</template>

<script setup>
import { ref, computed, nextTick,watch } from 'vue'
import {formatDate} from '@/utils/date.ts'
import { ElMessage, ElMessageBox } from "element-plus";
import { ArrowRight } from '@element-plus/icons-vue'
import {annotationList,createAnnotation,updateTaskStatus,deleteOrganAnnotation} from '../data.api'
const props = defineProps({ 
   width: { type: Number, default: 290 },
   annotationData: { type: Object, default: ()=>{} },
   caseTask: { type: Object, default: ()=>{} },
   handType: { type: String, default: "" },
   })
const emit = defineEmits(['delete', 'view-annotation', 'save-annotations', 'complete', 'getAnnotationTask','getCocoData','setAnnotating','updatePage','clearAnnotation'])
const tasks = ref([]) //某只手对应的器官任务
const featureList = ref([]) //某个器官的特征点
const caseId = ref("") //当前选中的caseId
const organTask = ref({})
const unfinished = ref([])
const finished = ref([])
const passed = ref([])
const loading = ref(false)
function splitTasks(list) {
  const u = []
  const f = []
  const p = []

  for (const t of list) {
    if (t.status === 4) {
      p.push(t) 
    } else if (isTaskCompleted(t)) {
      f.push(t)
    } else {
      u.push(t)
    }
  }

  unfinished.value = u
  finished.value = f
  passed.value = p   // ✅ 新增
}
const activeIndex = ref(0)

function updateActiveIndex() {
  const idx = unfinished.value.findIndex(t => !isTaskCompleted(t))
  activeIndex.value = idx === -1 ? -1 : idx
}
const STATUS_MAP = {
  0: { text: '待标注', color: '#e6a23c' },
  1: { text: '标注中', color: '#409eff' },
  2: { text: '已完成', color: '#67c23a' },
  4: { text: '已跳过', color: '#909399' } 
}
const curType = ref('organ') //默认按钮类型
const organAnnotations = ref([]) //器官标注数据
const curOrganAnnotation = ref([]) //当前操作的标注数据
const featureTask  = ref([]) //当前特征点标注
const showAnnotationPanel = ref(false) //标注弹窗控制
const isAnnotationing = ref(false) //标注中的标志
const selectedAnnotationId = ref(null) //查看选中的标注
const activeFeatureId = ref(null) //选择特征点id
const panelPosition = ref({ x: 0, y: 0 })
const submitFlag = ref(false)
const handleNextTask = () => { 
  emit('updatePage')
}
// 面板位置样式
const panelStyle = computed(() => ({
  left: `${panelPosition.value.x}px`,
  top: `${panelPosition.value.y}px`,
  width: `${props.width}px`
}))
// 判断任务是否完成：器官+器官标注信息是否完成
function isTaskCompleted(task) {
  // 器官必须完成
  if (task.status !== 2) return false
  const hasContour = task.contour && task.contour.length > 0
  if (!hasContour) return true
  const features = task.contour || []
  const featuresDone = features.every(f => f.status === 2)
  return featuresDone
}

function handleTabClick(e){
  closePanel()
}
/**
 * 点击标注
 */
function handleAnnotateClick() {
  isAnnotationing.value = true
  // 没有标注 → 直接开始
  startNewAnnotation()
  
}
/**
 * 开始标注
 */
function startNewAnnotation() {
   emit('getAnnotationTask', organTask.value)
   updateTaskStatus(caseId.value,props.handType,organTask.value.id,1)
   submitFlag.value = false
}


function viewAnnotationInfo(annotation, type, featureId) {
  selectedAnnotationId.value = annotation.id
  emit('view-annotation', {
    task: organTask.value,
    annotation,
    type,
    featureId,
    cancel: false
  })
}

function cancelViewAnnotationInfo(annotation, type, featureId) {
   selectedAnnotationId.value = null
    emit('view-annotation', {
      task: organTask.value,
      annotation: annotation,
      type,
      featureId,
      cancel: true   
    })
}

function viewAnnotation(annotation, type, featureId) {
  // ① 当前已在查看 → 取消查看
  if (selectedAnnotationId.value === annotation.id) {
   cancelViewAnnotationInfo(annotation, type, featureId)
    return
  }
  viewAnnotationInfo(annotation, type, featureId)
}
/**
 * 获取当前case指定手的标注任务
 */
async function getTaskList(id, type, annotationId){
  loading.value = true

  try {
    const taskRes = await annotationList(id, type)

    if(taskRes.code == 0){
      tasks.value = taskRes.data.tasks;

      if(tasks.value.length < 1)  {
        await createAnnotations(id,type);
        return
      }

      splitTasks(tasks.value)
      updateActiveIndex()

      if(annotationId){
        const newTask = tasks.value.find(f => f.id === annotationId)
        organTask.value = newTask;
        featureList.value = newTask.children
        organAnnotations.value = newTask.contour
      }
    }
  } finally {
    loading.value = false
  }
}
/**
 * 获取器官标注数据
 */
function initOrganAnnotation(task, event) {
  // ===== 基础任务信息 =====
   submitFlag.value = false
   curType.value = 'organ'
  organTask.value = task
  // ===== 器官标注数据 =====
  organAnnotations.value = task.contour || []
  emit("getCocoData", organAnnotations.value, 'organ')

  openAnnotationPanel(task, event)
}

/**
 * 获取特征点标注数据
 */
function initFetureAnnotation(task, type, event) {
  curType.value = 'feature'
   organTask.value = task
  if (!task.contour || task.contour.length === 0) {
    ElMessage.warning('器官标注不明确，特征点无需标注')
    return
  }

  featureList.value = task.children || []

  organAnnotations.value = task.contour || []

  const firstAnno = organAnnotations.value[0]
  selectedAnnotationId.value = firstAnno.id
  if(firstAnno.featureId){
    activeFeatureId.value = firstAnno.featureId
  }else{
    const firstFeature = featureList.value[0]
    activeFeatureId.value = firstFeature.id
  }

  onFeatureChange(activeFeatureId.value, firstAnno)

  openAnnotationPanel(task, event)
}
/**
 * 器官标注区域选择
 */
function onOrganTabChange(tab) {
  const annotation = organAnnotations.value.find(
    a => a.id === tab.props.name
  )
  changeOrganAnnotation(annotation)
}


/**
 * 器官标注区域选择
 */
function changeOrganAnnotation(annotation) {
  if (!annotation) return
  const firstFeature = featureList.value[0]

  activeFeatureId.value = annotation.selectFetureId
    ? annotation.selectFetureId
    : firstFeature?.id

  onFeatureChange(activeFeatureId.value, annotation)
}

/**
 * 某个标注信息选择特征点
 */
function onFeatureChange(featureId, organAnnotation) {
   curOrganAnnotation.value = organAnnotation;
  featureTask.value = featureList.value.find(f => f.id === featureId)

  if (!featureTask.value) return

  featureTask.value.contour = [organAnnotation]

  emit('getCocoData', featureTask.value.contour || [], "feature")
   emit('setAnnotating', false)
}
/**
 * 关标注弹窗
 */
function closePanel() {
  showAnnotationPanel.value = false
  organTask.value = null
  isAnnotationing.value = false
  emit("setAnnotating",false)
  cancelViewAnnotationInfo(organTask.value,'organ',null)
  emit("clearAnnotation")
}
/**
 * 删除标注
 */
function deleteAnnotation(annotation, type, featureId) {
  if(annotation.contourId){
    deleteOrganAnnotation(annotation.contourId)
  }
  emit('delete-point', {
    annotation,
    type,
    featureId
  })
}

/**
 * 保存方法
 */
async function saveAnnotations(saveType, anno) {
  organTask.value.saveType = saveType
  const submitTask = { ...organTask.value }
    
  if (saveType === 'submit') {
    if (!organAnnotations.value || organAnnotations.value.length === 0) {
      ElMessage.warning('请先标注')
      return
    }
    submitFlag.value = true
  } else if (saveType === 'uncertain' || saveType === 'pass') {
    organTask.value.contour = []
    organAnnotations.value = []
    submitFlag.value = false
    emit("setAnnotating",false)
  }

  isAnnotationing.value = false
  showAnnotationPanel.value = false
  emit('save-annotations', saveType, submitTask, 'organ')
}

async function getNextFeature() {
  if (!organAnnotations.value || organAnnotations.value.length === 0) {
    let status = 2;
    if(organTask.value.saveType == 'pass') status = 4
    //organ标注完成
    await updateTaskStatus(caseId.value,props.handType,organTask.value.id,status)
    updateOrganData(status)
    return false
  }
  featureList.value = organTask.value.children || []

  // 假设 status: 0-未开始, 1-进行中, 2-已完成
  const firstUnfinished = organAnnotations.value.find(f => f.status !== 2)
  
  if (firstUnfinished) {
    curType.value = "feature"
    showAnnotationPanel.value = true;
    selectedAnnotationId.value = firstUnfinished.id
    if (featureList.value.length > 0) {
      activeFeatureId.value = featureList.value[0].id
      nextTick(() => {
        onFeatureChange(activeFeatureId.value, firstUnfinished)
      })
    }
  }else{
    //organ标注完成
    await updateTaskStatus(caseId.value,props.handType,organTask.value.id,2)
    organTask.value.staus = 2
    updateOrganData(2)
  }
  
}
function updateOrganData(status) {
  const index = tasks.value.findIndex(t => t.id === organTask.value.id)
  if (index !== -1) {
    const newTask = {
      ...tasks.value[index],
      status: status,
      contour:organAnnotations.value
    }

    tasks.value[index] = newTask
    organTask.value = newTask

    splitTasks(tasks.value)

    updateActiveIndex()
    closePanel()
  }
}

function saveFeature(saveType, anno) {
  featureTask.value.organAnnotatioId = curOrganAnnotation.value.id
  let data = {
    contour_id:anno.contourId,
    annotation_id:activeFeatureId.value,
    organ_id:organTask.value.id,
    id:activeFeatureId.value
  }
  emit('save-annotations', saveType, data, 'feature')
  isAnnotationing.value = false
  showAnnotationPanel.value = false
}

/**
 * 开标注弹窗
 */

function openAnnotationPanel(task, event) {
  if (!showAnnotationPanel.value) {
    showAnnotationPanel.value = true
    nextTick(() => {
      positionPanel(event)
      emit("setAnnotating",false)
    })

    return
  }

  if (organTask.value?.id === task.id) {
    return
  }

  nextTick(() => {
    positionPanel(event)
  })
}

/**
 * 模态框定位
 */
function positionPanel(event) {
  const panelWidth = props.width
  const panelHeight = 500
  const x = event?.clientX || window.innerWidth - panelWidth - 20
  const y = (event?.clientY || 100) + 20
  panelPosition.value = { x: Math.min(x, window.innerWidth - panelWidth), y: Math.min(y, window.innerHeight - panelHeight) }
}
/**
 * 创建标注任务
 */
async function createAnnotations(id, type) {
  const cRes = await createAnnotation(id, type)
  if (cRes.code === 0) {
    await getTaskList(id, type)
  }
}

// 只要 organ 有值就更新
watch(() => props.annotationData?.organ, (organData) => {
  if (organData) {
    organAnnotations.value = organData;
    }
}, { deep: true });


watch(organAnnotations, (ns) => {
  if (submitFlag.value && ns.length > 0) {
    getNextFeature()
  }
})
/**
 * 获取当前caseId
 */
watch(() => props.caseTask, (task) => {
  if(task){
    caseId.value = task.task_id;
  }
}, { 
  deep: true,
  immediate: true 
});
let lastKey = ''

watch(
  () => [caseId.value, props.handType],
  async ([id, type]) => {
    if (!id || !type) return

    const key = `${id}-${type}`

    if (key === lastKey) return
    lastKey = key

    await getTaskList(id, type)
  },
  { immediate: true }
)

// 暴露方法给父组件
defineExpose({
  closePanel,
  getTaskList,
  getNextFeature
});

</script>

<style scoped>
:root {
  font-size: clamp(12px, 1.8vw, 16px);
}

.el-table {
  --el-table-border-color: var(--el-border-color);
  --el-table-header-bg-color: var(--el-fill-color-light);
}

.el-table th, .el-table td {
  padding: 4px 8px;
}

/* 按钮样式 */
.action-btn {
  margin: 0 2px;
  padding: 2px 6px;
  font-size: 0.85em;
  white-space: nowrap;
  transition: all 0.15s;
}

.action-btn:active {
  transform: translateY(1px);
  opacity: 0.8;
}

.action-btn.annotate {
  background-color: #409eff;
  border-color: #409eff;
  color: #fff;
}

.action-btn.delete {
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: #fff;
}

.action-btn.complete {
  background-color: #67c23a;
  border-color: #67c23a;
  color: #fff;
}

/* 操作列统一宽度，保证两层表格按钮不换行 */
:deep(.operation-column .cell) {
  white-space: nowrap;
}

:deep(.el-table__body, .el-table__header) {
  table-layout: fixed;
}

:deep(.el-table__body-wrapper, .el-table__header-wrapper) {
  overflow-x: auto;
}

/* 标注管理面板样式 */
.annotation-form {
  position: fixed;
  z-index: 9999;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  max-width: 85vw;
  max-height: 70vh;
  font-size: 13px;
}

.form-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #f5f7fa;
  border-bottom: 1px solid #e0e0e0;
  font-weight: 600;
  font-size: 14px;
  cursor: grab;
  user-select: none;
}

.form-header:hover {
  background: #f0f2f5;
}

.close-btn {
  background: transparent;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #666;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
}

.close-btn:hover {
  background: #e4e6eb;
  color: #333;
}

.form-body {
  flex: 1;
  overflow-y: hidden;
  padding: 10px 12px;
  background: #fcfcfc;
  max-height: 400px;
  overflow-y: auto;
}

.organ-card {
  background: white;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 8px;
  transition: 0.2s;
}

.organ-card:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.organ-card h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.feature-card {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 8px 10px;
  margin-bottom: 8px;
}

.feature-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.feature-header h4 {
  margin: 0;
  color: #555;
  font-size: 13px;
  font-weight: 600;
}

.feature-status {
  font-size: 12px;
  font-weight: 500;
}

.feature-list {
  padding: 8px;
  background: #f9fafb;
  border-radius: 4px;
  border-left: 3px solid #409eff;
  margin-bottom: 6px;
}

.annotation-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.annotation-item:hover {
  background-color: #f5f5f5;
}

.annotation-item.selected {
  background-color: #ffe7c2 !important;
  border-left: 4px solid #ff6b35 !important;
  box-shadow: 0 2px 8px rgba(255, 107, 53, 0.2) !important;
}

.annotation-item:last-child {
  border-bottom: none;
}

.anno-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
  flex-wrap: wrap;
}

.anno-type {
  background: #f0f2f5;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 11px;
  color: #666;
}

.anno-date {
  color: #999;
  font-size: 11px;
}

.anno-points, .anno-size {
  background: #e6f7ff;
  color: #1890ff;
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 11px;
}

.anno-actions {
  display: flex;
  gap: 4px;
}

.anno-actions .el-button {
  padding: 4px 8px;
  font-size: 11px;
  height: 24px;
}

.no-data {
  text-align: center;
  padding: 12px;
  color: #999;
  font-size: 12px;
}

.coco-card {
  background: white;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 8px 10px;
  margin-top: 10px;
  background: #f9fafb;
}

.coco-card h3 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 14px;
  font-weight: 600;
}

.coco-info {
  font-size: 12px;
  color: #666;
  line-height: 1.6;
}

.coco-info p {
  margin: 4px 0;
}

.form-actions {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px;
  border-top: 1px solid #e0e0e0;
  background: white;
}

.form-actions .el-button {
  padding: 6px;
  font-size: 10px;
  height: 28px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .annotation-form {
    width: 95vw;
    max-height: 75vh;
  }
  
  .form-body {
    padding: 8px;
  }
  
  .annotation-item {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
  }
  
  .anno-info {
    gap: 6px;
  }
  
  .anno-actions {
    justify-content: flex-end;
  }
  
  .form-actions {
    flex-wrap: wrap;
  }
  
  .form-actions .el-button {
    flex: 1;
    min-width: 70px;
    padding: 4px 8px;
  }
}

/* 滚动条样式优化 */
.form-body::-webkit-scrollbar {
  width: 6px;
}

.form-body::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 3px;
}

.form-body::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.form-body::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
.annotation-item.selected {
  background-color: #ffe7c2 !important;
  border-left: 4px solid #ff6b35 !important;
  box-shadow: 0 2px 8px rgba(255, 107, 53, 0.3) !important;
}
.action-btn {
  margin: 0 2px;
  padding: 2px 6px;
  font-size: 0.85em;
  transition: all 0.15s;
}

/* ✅ 只给可用状态上色 */
.action-btn:not(.is-disabled):not([disabled]) {
  color: #fff;
}

.action-btn.annotate:not(.is-disabled):not([disabled]) {
  background-color: #409eff;
  border-color: #409eff;
}

.action-btn.complete:not(.is-disabled):not([disabled]) {
  background-color: #67c23a;
  border-color: #67c23a;
}

.action-btn.delete:not(.is-disabled):not([disabled]) {
  background-color: #f56c6c;
  border-color: #f56c6c;
}

/* ✅ 强制 disabled 样式（Chrome/Edge/Firefox 一致） */
.action-btn.is-disabled,
.action-btn[disabled] {
  background-color: #e4e7ed !important;
  border-color: #e4e7ed !important;
  color: #a8abb2 !important;
  cursor: not-allowed;
  opacity: 1;
}
.view{
  background: #67c23a;
}
/* Element Plus 表格：所有单元格自动换行 */
:deep(.el-table .cell) {
  white-space: normal !important;   /* 允许换行 */
  word-break: break-word;           /* 长英文 / 数字也能断 */
  line-height: 1.4;
}

.organ-desc {
  display: flex;
  gap: 6px;
  margin: 6px 0 10px;
  font-size: 12px;
  line-height: 1.6;
  white-space: normal;
}

.desc-label {
  flex-shrink: 0;
  padding: 0 6px;
  height: 18px;
  line-height: 18px;
  font-size: 11px;
  color: #409eff;               /* Element Plus 主色 */
  background: rgba(64, 158, 255, 0.12);
  border-radius: 3px;
}

.desc-value {
  color: #333;
  word-break: break-word;
}
.tab-containe{
  font-size: 12px;
}
.feature-radio-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top:3px;
}

.feature-radio-item {
  margin: 0;
  padding: 25px 12px;
  border-radius: 6px;
  border: 1px solid #ebeef5;
  transition: all 0.2s;
  width: 100%;
  
}

.feature-radio-item:hover {
  background: #f5f7fa;
}

.feature-item {
  display: flex;
  flex-direction: column;
  padding: 4px 6px;
}

.feature-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.feature-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}
.tab-container{
  position: relative;
}
.next-btn{
  position: absolute;
  z-index: 100000;
  top:8px;
  right: 50px;
}
</style>