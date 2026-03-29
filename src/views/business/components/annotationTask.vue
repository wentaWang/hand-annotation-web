<template>
  <div class="tab-container">
    <el-tabs @tab-click="handleTabClick">
      <!-- 待标注任务 Tab -->
      <el-tab-pane  :label="`待标注任务 (${unfinishedTasks.length})`"> 
        <el-table
          :data="unfinishedTasks"
          border
          style="width: 100%; font-size: 12px"
          :table-layout="'fixed'"
          height="500"
        >
          <el-table-column prop="name" label="器官" width="90" />
          <el-table-column prop="description" label="描述" width="100" />
          <el-table-column label="状态" width="70">
            <template #default="{ row }">
              <span :style="{ color: statusColor(row.status) }">
                {{ statusText(row.status) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" class-name="operation-column">
            <template #default="{ row, $index }">
              <el-button 
                class="action-btn annotate" 
                @click="getAnnotationList(row, 'organ', $event)"
                :disabled="isTaskDisabled($index)"
              >器官</el-button>
              <el-button 
                class="action-btn complete" 
                @click="getAnnotationList(row, 'feature', $event)"
                :disabled="isTaskDisabled($index) || row.status !== 2"
              >特征点</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>
  </div>

  <!-- 标注面板 -->
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
          <span class="status-icon" :style="{ color: statusColor(currentTask.status) }">
            {{ statusText(currentTask.status) }}
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
                  <span class="status-icon" :style="{ color: statusColor(anno.status) }">
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
          {{ currentTask?.status === 2 ? '位置不清晰' : '暂无器官标注数据' }}
        </div>

      </div>
      

      <!-- ========== 特征点（Tab） ========== -->
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
      <el-button @click="cancelAnnotation" size="small">取消</el-button>
      <el-button type="info" size="small"  @click="saveAnnotations('uncertain',currentTask)" v-if="curType == 'organ'">不确定</el-button>
      <el-button type="primary" size="small" @click="saveAnnotations('save',currentTask)">暂存</el-button>
      <el-button type="success" size="small" @click="saveAnnotations('submit',currentTask)">提交</el-button>
      <el-button
       v-if="curType == 'organ'"
      style="background-color:#2f6fed; border-color:#2f6fed; color:#fff"
       size="small" 
      @click="handleAnnotateClick"
      
    >
      {{ isAnnotation ? '标注中' : '开始标注' }}
    </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick,watch } from 'vue'
import {formatDate} from '@/utils/date.ts'
import { ElMessage, ElMessageBox } from "element-plus";
import {annotationList,createAnnotation,updateTaskStatus} from '../data.api'
const props = defineProps({ 
  width: { type: Number, default: 290 },
  annotationData: { type: Object, default: ()=>{} },
  caseTask: { type: Object, default: ()=>{} },
   handType: { type: String, default: "" },
   })
const emit = defineEmits(['delete', 'view-annotation', 'save-annotations', 'complete', 'getAnnotationTask','getCocoData'])
const taskId = ref("")
function isFeatureDisabled(index) {
  // 第一个特征点永远可点
  if (index === 0) return false

  const prev = featureList.value[index - 1]
  // 前一个未完成 → 禁用
  return prev?.status !== 2
}

const tasks = ref([])
function onOrganTabChange(tab) {
  const annotation = organAnnotations.value.find(
    a => a.id === tab.props.name
  )
  changeOrganAnnotation(annotation)
}

function changeOrganAnnotation(annotation) {

  if (!annotation) return

  const firstFeature = featureList.value[0]

  activeFeatureId.value = annotation.selectFetureId
    ? annotation.selectFetureId
    : firstFeature?.id

  onFeatureChange(activeFeatureId.value, annotation)
}

const curType = ref('organ')
const showAnnotationPanel = ref(false)
const currentTask = ref(null)
const organTask = ref({})
const featureList = ref([])
const selectedAnnotationId = ref(null)
const panelPosition = ref({ x: 0, y: 0 })
const isAnnotation = ref(false)
const hasAnnotations = computed(() => {
  if (curType.value === 'organ') {
    return !!(organAnnotations.value && organAnnotations.value.length)
  }
  if (curType.value === 'feature') {
    return !!(featureAnnotations.value && featureAnnotations.value.length)
  }
  return false
})
const organAnnotations = ref([])
const featureAnnotations = ref([])
const activeFeatureId = ref(null)
const unfinishedTasks = computed(() => tasks.value.filter(t => !isTaskCompleted(t)))
const finishedTasks = computed(() => tasks.value.filter(t => isTaskCompleted(t)))
const handleTabClick = () => {
  cancelAnnotation() // 切换Tab时关闭标注面板
}
// 面板位置样式
const panelStyle = computed(() => ({
  left: `${panelPosition.value.x}px`,
  top: `${panelPosition.value.y}px`,
  width: `${props.width}px`
}))

// 判断任务是否完成：器官+所有特征点完成
function isTaskCompleted(task) {
  const organDone = task.status === 2
  const featuresDone = task.contour?.every(f => f.status === 2) ?? true
  return organDone && featuresDone
}
function onFeatureChange(featureId,organAnnotation) {
  const featureTask = featureList.value.find(f => f.id === featureId)
  if (!featureTask) return
   featureTask.contour = [organAnnotation]
   currentTask.value = featureTask
  emit('getAnnotationTask', featureTask)
  emit('getCocoData', featureTask.contour || [], "feature")
}

// 待标注列表按钮禁用逻辑
function isTaskDisabled(index) {
  if (index === 0) return false
  return !isTaskCompleted(unfinishedTasks.value[index - 1])
}

async function getTaskList(id,type,annotationId){
  const taskRes = await annotationList(id,type)
  if(taskRes.code == 0){
    tasks.value = taskRes.data.tasks;
    if(tasks.value.length  < 2)  createAnnotations(id,type);
    if(annotationId){
     const newTask = tasks.value.find(f => f.id === annotationId)
     featureList.value = newTask.children
    }
  }
}

function buildFeatureAnnotation(organAnnotation, feature) {

  if (!organAnnotation) return

  const featureAnno = {
    ...organAnnotation,             // 器官标注数据
    featureId: feature.id,          // 特征点ID
    featureName: feature.name,      // 特征点名称
    featureDesc: feature.description,
    parentAnnotationId: organAnnotation.id
  }

  featureAnnotations.value = [featureAnno]
}
async function createAnnotations(id,type){
  const cRes = await createAnnotation(id,type);
  if(cRes.code == 0){
    const data = JSON.parse(cRes.data)
    if(data.tasks)   tasks.value = data.tasks;
     console.log("createAnnotation",cRes)
  }
}


function getAnnotationList(task, type, event) {
  // ===== 基础任务信息 =====
  currentTask.value = task
  organTask.value = task
  curType.value = type



  // ===== 器官标注数据 =====
  organAnnotations.value = task.contour || []
    // ===== Feature 初始化 =====
  if (type === 'feature') {

    const children = task.children || []

    if (children.length) {
      featureList.value = children

      // 默认第一个 feature
      const firstFeature = children[0]

      currentTask.value = firstFeature
      activeFeatureId.value = firstFeature.id
       if (organAnnotations.value.length) {
        const firstOrganAnnotation = organAnnotations.value[0]
        selectedAnnotationId.value = firstOrganAnnotation.id
        activeFeatureId.value = firstOrganAnnotation.selectFetureId?firstOrganAnnotation.selectFetureId:firstFeature.id
        onFeatureChange(activeFeatureId.value, firstOrganAnnotation)
      } else {
        selectedAnnotationId.value = null
      }
    }
  // 默认选中第一个器官标注
 
  }
  if(type == 'organ') emit("getCocoData", organAnnotations.value, type)
  // ===== 控制标注面板 =====
  if (!showAnnotationPanel.value) {

    showAnnotationPanel.value = true

    nextTick(() => {
      positionPanel(event)
    })

    return
  }

  // ===== 如果点击的是同一个任务，只切换类型 =====
  if (currentTask.value?.id === task.id) {
    return
  }

  // ===== 重新定位面板 =====
  nextTick(() => {
    positionPanel(event)
  })
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

function viewAnnotation(annotation, type, featureId) {
  // ① 当前已在查看 → 取消查看
  if (selectedAnnotationId.value === annotation.id) {
    selectedAnnotationId.value = null

    emit('view-annotation', {
      task: currentTask.value,
      annotation: null,
      type,
      featureId,
      cancel: true   
    })

    return
  }

  // ② 当前未查看 → 进入查看
  selectedAnnotationId.value = annotation.id

  emit('view-annotation', {
    task: currentTask.value,
    annotation,
    type,
    featureId,
    cancel: false
  })
   console.log("annotation11",annotation)
  console.log("or11",currentTask.value)
}
function deleteAnnotation(annotation, type, featureId) {
  emit('delete-point', {
    annotation,
    type,
    featureId
  })
}

function correctAnnotation(annotation, type, featureId){
   emit('correct-point', {
    annotation,
    type,
    featureId,
    task:currentTask.value
  })
}


function positionPanel(event) {
  const panelWidth = props.width
  const panelHeight = 500
  const x = event?.clientX || window.innerWidth - panelWidth - 20
  const y = (event?.clientY || 100) + 20
  panelPosition.value = { x: Math.min(x, window.innerWidth - panelWidth), y: Math.min(y, window.innerHeight - panelHeight) }
}

function closePanel() {
  showAnnotationPanel.value = false
  currentTask.value = null
  selectedAnnotationId.value = null
}

function selectAnnotation(annotation, type, featureId) {
  selectedAnnotationId.value = annotation.id
  emit('view-annotation', { task: currentTask.value, annotation, type, featureId })
}

const canComplete = computed(() => currentTask.value?.status === 2 && currentTask.value?.children?.every(f => f.status === 2))

function saveAnnotations(saveType, anno) {
  const submitTask = { ...currentTask.value }
  const annotationMap = {
    organ: organAnnotations.value,
    feature: featureAnnotations.value,
  }

  const currentAnnotations = annotationMap[curType.value]

  if (saveType === 'submit') {
    if (!currentAnnotations || currentAnnotations.length === 0) {
      ElMessage.warning('请先标注')
      return
    }
  }

  let hasNextOrganAnno = false

  // feature 保存逻辑
  if (curType.value === 'feature') {
    hasNextOrganAnno = handleFeatureSave()
  }

  // organ 保存逻辑
  if ((saveType === 'submit' || saveType === 'uncertain') && curType.value === 'organ') {
    hasNextOrganAnno = handleOrganSave(submitTask)
  }

  // 是否关闭面板
  if (!(curType.value === 'feature' && hasNextOrganAnno)) {
    closePanel()
  }

  emit('save-annotations', saveType, submitTask, hasNextOrganAnno, organTask.value)
}

  function handleOrganSave(submitTask) {

  const children = submitTask?.children || []

  const nextFeature = organAnnotations.value.find(f => f.status !== 2)

  if (!nextFeature) return false

  nextTick(() => {
    curType.value = 'feature'
    featureList.value = children
    currentTask.value = nextFeature
    selectedAnnotationId.value = nextFeature.id
    showAnnotationPanel.value = true

    emit('getAnnotationTask', nextFeature)
    emit('getCocoData', nextFeature.contour || [], 'feature')
  })

  return true
}

function handleFeatureSave() {

  if (!organAnnotations.value.length) return false

  const idx = organAnnotations.value.findIndex(
    f => f.id === selectedAnnotationId.value
  )

  const nextOrganAnno = organAnnotations.value?.[idx + 1]

  if (!nextOrganAnno) return false

  nextTick(() => {
    selectedAnnotationId.value = nextOrganAnno.id
    changeOrganAnnotation(nextOrganAnno)
  })

  return true
}


  // ✅ 只有没有下一个特征点，才关闭
  if (!(curType.value === 'feature' && hasNextOrganAnno)) {
    closePanel()
  }

  // ===== 器官完成 → 自动跳到特征 =====
  if ((saveType === 'submit' || saveType === 'uncertain') && curType.value === 'organ') {
    const children = submitTask?.children || []
    // 如果organAnnotations.value的任何一个状态不是2，则跳到特征点标注

    const nextFeature = organAnnotations.value.find(f => f.status !== 2)
    if (nextFeature) {
        hasNextOrganAnno = true
      nextTick(() => {
        curType.value = 'feature'
        featureList.value = children
        currentTask.value = nextFeature
        selectedAnnotationId.value = nextFeature.id
        showAnnotationPanel.value = true

        emit('getAnnotationTask', nextFeature)
        emit('getCocoData', nextFeature.contour || [], 'feature')
      })
    }
  }
    emit('save-annotations', saveType, submitTask, hasNextOrganAnno,organTask.value)
}





  
// ✅ 完成任务并自动激活下一个
function completeTask() {
  if (!currentTask.value) return
  emit('complete', currentTask.value)

  // 标记器官+特征点完成
  currentTask.value.status = 2
  currentTask.value.children.forEach(f => f.status = 2)

  closePanel()

  // 自动激活下一个可操作任务
  const idx = unfinishedTasks.value.findIndex(t => t.id === currentTask.value.id)
  if (idx >= 0 && idx + 1 < unfinishedTasks.value.length) {
    const nextTask = unfinishedTasks.value[idx + 1]
    if (!isTaskDisabled(idx + 1)) {
      nextTick(() => getAnnotationList(nextTask, 'organ'))
    }
  }
}
function handleAnnotateClick() {
  isAnnotation.value = true
  // 没有标注 → 直接开始
  startNewAnnotation()
  
}
const tableHeight = ref(0)

function calcTableHeight() {
  tableHeight.value = window.innerHeight - 260
}
function cancelAnnotation() { closePanel() }
function startNewAnnotation() {

  if (curType.value === 'feature') {

    const organAnno = organAnnotations.value.find(
      a => a.id === selectedAnnotationId.value
    )

    const feature = featureList.value.find(
      f => f.id === activeFeatureId.value
    )

    buildFeatureAnnotation(organAnno, feature)
  }

  emit('getAnnotationTask', currentTask.value)

  updateTaskStatus(taskId.value,props.handType,currentTask.value.id,1)
}

function statusColor(status) { return {0:'#e6a23c',1:'#409eff',2:'#67c23a'}[status] || '#999' }
function statusText(status) { return {0:'待标注',1:'标注中',2:'已完成'}[status] || '未知' }

function getFeatureAnnotations(featureId) {
  return props.annotationData.feature?.[featureId] || []
}

watch(() => props.annotationData, (ns) => {
  console.log("ns",ns)
  //
  if(curType.value == 'organ') organAnnotations.value = ns[curType.value]
  else if(curType.value == 'feature')  featureAnnotations.value = ns[curType.value]
 console.log("featureAnnotations",featureAnnotations.value)
}, { deep: true });



watch(() => props.caseTask, (task) => {
  if(task){
    taskId.value = task.task_id;
    featureList.value = task.children
  }
}, { 
  deep: true,
  immediate: true 
});
watch(() => props.handType, (ns) => {
  getTaskList(taskId.value, ns);
}, { 
  deep: true,
  immediate: true // 添加这个选项，立即执行一次
});

// 暴露方法给父组件
defineExpose({
  closePanel,
  getTaskList
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
}

.feature-radio-item {
  margin: 0;
  padding: 10px 12px;
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
</style>