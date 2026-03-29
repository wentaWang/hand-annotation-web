<template>
  <div class="annotation-layout">
    <!-- 左侧 -->
    <div class="left-pane" :style="{ width: leftWidth + 'px' }">
      <Case
      v-if="showLeft"
        :tasks="tasks"
        :active-id="activeId"
        :totalNum="totalNum"
          :mode="mode"
        :completeNum="completeNum"
        @complete-task="resetWholeLayout"
        @onSelectTask="onSelectTask"
      />
    </div>

    <!-- 左 Splitter -->
    <div class="splitter" @mousedown="startDragLeft"></div>

    <!-- 中间 -->
    <div class="center-pane">
      <AnnotationCenter 
        v-if="showCenter && selectCase && selectCase.task_id"
        :task="selectCase"
        :handType="handType" 
        @getHandType="getHandType" 
        :annotationTask="annotationTask"
        @annotation-complete="getAnnotationInfo"
        @update:coco="handleCocoUpdate"
        :cocoAnnotations="cocoAnnotations"
        :annotationType="currentAnnotationType"
        @change-image="changeImage"
        ref="centerRef"
      />
      <div v-else class="empty-center">
        <div class="empty-content">
          <svg class="empty-icon" viewBox="0 0 64 64" fill="currentColor">
            <path d="M32 10c-12.15 0-22 9.85-22 22s9.85 22 22 22 22-9.85 22-22S44.15 10 32 10zm0 40c-9.93 0-18-8.07-18-18s8.07-18 18-18 18 8.07 18 18-8.07 18-18 18z"/>
            <path d="M34 24h-4v12h4V24zm0 16h-4v4h4v-4z"/>
          </svg>
          <p class="empty-text">请从左侧选择一个病例开始标注</p>
        </div>
      </div>
    </div>

    <!-- 右 Splitter -->
    <div class="splitter" @mousedown="startDragRight"></div>

    <!-- 右侧 -->
    <div class="right-pane" :style="{ width: rightWidth + 'px' }">
      <Task 
        v-if="showRight && selectCase"
        :caseTask="selectCase" 
        :handType="handType" 
        @getAnnotationTask="getAnnotationTask" 
        @getCocoData="getCocoData" 
        :width="rightWidth" 
        @setAnnotating="setIsAnnotating"
        @clearAnnotation='clearAnnotation'
        @view-annotation="handleViewAnnotation"
        @delete-point="handleDeletePoint"
        @correct-point="handleCorrectPoint"
        @save-annotations="handleSaveAnnotations"
        @complete="handleComplete"
        :annotationData="annotationData"
        ref="taskRef"
      />
      <div v-else class="empty-right">
        <div class="empty-content">
          <svg class="empty-icon" viewBox="0 0 64 64" fill="currentColor">
            <path d="M32 10c-12.15 0-22 9.85-22 22s9.85 22 22 22 22-9.85 22-22S44.15 10 32 10zm0 40c-9.93 0-18-8.07-18-18s8.07-18 18-18 18 8.07 18 18-8.07 18-18 18z"/>
            <path d="M34 24h-4v12h4V24zm0 16h-4v4h4v-4z"/>
          </svg>
          <p class="empty-text">选择一个病例以查看标注任务</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, watch } from "vue";
import Case from "./components/leftCaseList.vue";
import AnnotationCenter from "./components/centerPanel.vue";
import Task from "./components/task.vue";
import { ElMessage } from "element-plus";
import { getPhysicianTaskList, createPhysicianTask, getPhysicianTask,submitFeatureTask, submitAnnotationTask, updateTaskStatus } from './data.api'
const showLeft = ref(true)
const showCenter = ref(true)
const showRight = ref(true)
const tasks = ref([]);
const totalNum = ref(0);
const completeNum = ref(0);
const selectCase = ref(null);
const annotationTask = ref({});
const annotationData = ref({});
const handType = ref('left');
const leftWidth = ref(150);
const rightWidth = ref(365);
const centerRef = ref(null);
const taskRef = ref(null);
const cocoAnnotations = ref([]);
const currentAnnotationType = ref("organ");
     const isReloading = ref(false)
const activeId = computed(() =>
  selectCase.value?.task_id || null
);


let startX = 0;
let startLeftWidth = 0;
let startRightWidth = 0;
const props = defineProps({
  taskId: {
    type: String,
    default: ''
  },
  mode: {
    type: String,
    default: 'batch' // batch | single
  }
});
// ---------------- 左右拖拽 ----------------
function startDragLeft(e) {
  startX = e.clientX;
  startLeftWidth = leftWidth.value;
  window.addEventListener("mousemove", moveLeft);
  window.addEventListener("mouseup", stopDrag);
}

function moveLeft(e) {
  let newWidth = startLeftWidth + (e.clientX - startX);
  if (newWidth < 160) newWidth = 160;
  if (newWidth > window.innerWidth - rightWidth.value - 200)
    newWidth = window.innerWidth - rightWidth.value - 200;
  leftWidth.value = newWidth;
}

function startDragRight(e) {
  startX = e.clientX;
  startRightWidth = rightWidth.value;
  window.addEventListener("mousemove", moveRight);
  window.addEventListener("mouseup", stopDrag);
}

function moveRight(e) {
  let newWidth = startRightWidth - (e.clientX - startX);
  if (newWidth < 200) newWidth = 200;
  if (newWidth > window.innerWidth - leftWidth.value - 200)
    newWidth = window.innerWidth - leftWidth.value - 200;
  rightWidth.value = newWidth;
}

function stopDrag() {
  window.removeEventListener("mousemove", moveLeft);
  window.removeEventListener("mousemove", moveRight);
  window.removeEventListener("mouseup", stopDrag);
}

// ---------------- 任务选择 ----------------
async function onSelectTask(item) {
  
  const currentHand = handType.value; // 保存手型
  selectCase.value = null;
  annotationTask.value = {};
  annotationData.value = {};
  cocoAnnotations.value = [];

  if (item?.image_info) {
    selectCase.value = item;
  } else {
    const res = await getPhysicianTask(item.task_id);
    if (res.code === 0) selectCase.value = res.data;
  }
    const leftCompleted =
      selectCase.value.left_hand_completion === 2 || selectCase.value.left_hand_completion === 3;
    const rightCompleted =
      selectCase.value.right_hand_completion === 2 || selectCase.value.right_hand_completion === 3;

    // 如果左手完成了，并且右手没完成，调用下一张图片
    if (leftCompleted && !rightCompleted) {
      centerRef.value?.nextImage?.();
       handType.value = "right"
    }else handType.value = currentHand; // 保留手型
}

// ---------------- 手型 ----------------
function getHandType(type){
  handType.value = type;
}

function changeImage() {
  taskRef.value?.closePanel()
}

function clearAnnotation(){
  annotationData.value = {};
  cocoAnnotations.value = [];
}

// ---------------- annotationTask ----------------
function getAnnotationTask(task){
  annotationTask.value = task;
  centerRef.value?.startAnnotation(task);
}

// ---------------- COCO ----------------
function getCocoData(data, organType){
  currentAnnotationType.value = organType;
  cocoAnnotations.value = [];
  nextTick(() => {
    cocoAnnotations.value = data || [];
  });
}

function handleCocoUpdate(annotations){
  cocoAnnotations.value = annotations;
}

// ---------------- 标注数据 ----------------
function getAnnotationInfo(data){
  annotationData.value = data;
}

function handleViewAnnotation(data){
  if (!centerRef.value) return;
  if (!data.annotation) {
    centerRef.value.highlightShape(null);
    return;
  }
  centerRef.value.highlightShape(data.annotation.id);
}

function setIsAnnotating(data){
  if (!centerRef.value) return;
  centerRef.value.keepAnnotationMode()
}


function handleDeletePoint(data){
  if (!centerRef.value || !data.featureId) return;
  centerRef.value.deleteShape(data.featureId);
  if (!annotationData.value[data.type]) return
  annotationData.value[data.type] = annotationData.value[data.type].filter(s => s.id !== data.featureId);
  cocoAnnotations.value = cocoAnnotations.value.filter(s => s.id !== data.featureId);
}

function handleCorrectPoint(data){
  handleDeletePoint(data);
  centerRef.value?.startAnnotation(data.task);
}

// ---------------- 保存标注 ----------------
async function handleSaveAnnotations(saveType, task, flag,btnType) {
  annotationTask.value = task;
  if (saveType === 'uncertain') {
    centerRef.value?.clearShapes();
  }
  if(btnType == 'organ'){
    saveOrganAnnotation(saveType, task)
  }else{
      saveFeatureAnnotation(saveType, task)
  }
  if (saveType === 'submit' || saveType === 'uncertain') {
    updateOrganTaskStatus(task)
  } 
  ElMessage.success('保存成功');
  if (props.mode === 'single') {
    return;
  }
  if (!flag) resetCurrentTask();
}

/**
 * 保存器官标注
 */
async function saveOrganAnnotation(saveType,task){
  annotationTask.value = task;
  const submitData = {
    save_type: saveType,
    task_id: selectCase.value.task_id,
    annotation_id: task.id,
    hand_type: handType.value === 'left' ? 0 : 1,
    contour: cocoAnnotations.value,
  };
  const res = await submitAnnotationTask(submitData);

  if (res.code == 0) {
    const data = res.data;
    cocoAnnotations.value = data
    annotationData.value.organ = cocoAnnotations.value
  }
}

async function saveFeatureAnnotation(saveType,task){
  task.hand_type = handType.value === 'left' ? 0 : 1
  cocoAnnotations.value.featureId = task.node_id
  task.contour = cocoAnnotations.value[0];
  task.task_id = selectCase.value.task_id;
  const res = await submitFeatureTask(task);
  if (res.code == 0) {
    annotationData.value.organ = res.data
  }
  taskRef.value?.getNextFeature()
}


async function updateOrganTaskStatus(task){
    const { code, data } = await updateTaskStatus(
      selectCase.value.task_id,
      handType.value === 'left' ? 0 : 1,
      task.id,
      2
    );
  if (code == 0) {
      const leftCompleted =  data.left_hand_completion === 2 || data.left_hand_completion === 3;
      const rightCompleted = data.right_hand_completion === 2 || data.right_hand_completion === 3;
      const isCompleted = data.is_completed;
      // 如果左手完成了，并且右手没完成，调用下一张图片
      if (leftCompleted && !rightCompleted) {
        centerRef.value?.nextImage?.();
      }
      // 如果两个手都完成了，刷新页面
     else if (isCompleted && !isReloading.value) {
        isReloading.value = true;
        await fetchTaskList(); // ⭐ 核心：刷新左侧列表数据

        // 重新选中一个任务（通常选第一个）
        if (tasks.value.length) {
          await onSelectTask(tasks.value[0]);
        } else {
          selectCase.value = null;
        }

        isReloading.value = false;
      }
    }
}


// ---------------- 完成标注 ----------------
function handleComplete(data){
  if(data.cocoAnnotations) submitCocoAnnotations(data.cocoAnnotations);
}

function submitCocoAnnotations(annotations){
  console.log('提交COCO数据集:', annotations);
}

// ---------------- reload ----------------
function resetCurrentTask(preserveHandType = true){
  const currentHand = preserveHandType ? handType.value : 'left';
  annotationTask.value = {};
  annotationData.value = {};
  cocoAnnotations.value = [];
  handType.value = currentHand;
  if(selectCase.value) onSelectTask(selectCase.value);
}


async function resetWholeLayout(preserveHandType = true) {
  const currentHand = preserveHandType ? handType.value : 'left'

  // 1️⃣ 卸载所有组件
  showLeft.value = false
  showCenter.value = false
  showRight.value = false

  // 2️⃣ 清空状态
  selectCase.value = null
  annotationTask.value = {}
  annotationData.value = {}
  cocoAnnotations.value = []

  await nextTick() // ⭐ 关键：让 Vue 真正销毁组件

  // 3️⃣ 重新加载数据
  if (props.mode !== 'single') {
    await fetchTaskList()
    if (tasks.value.length) {
      await onSelectTask(tasks.value[0])
    }
  }

  // 4️⃣ 重新挂载组件
  showLeft.value = true
  showCenter.value = true
  showRight.value = true

  handType.value = currentHand
}


// ---------------- 任务列表 ----------------
const limit = 8;
const fetchTaskList = async () => {
  const res = await getPhysicianTaskList(limit);
  if(res.code !== 0) throw new Error('获取任务列表失败');
  const data = res.data || {};
  tasks.value = data.task_list || [];
  totalNum.value = data.total || 0;
  completeNum.value = data.completed_count || 0;
  return tasks.value;
};

onMounted(async () => {
 initPage()
});

async function initPage(){
 if (props.mode === 'single') return;

  try {
    const list = await fetchTaskList();
    if (list.length < limit) {
      await createPhysicianTask();
      await fetchTaskList();
    }
    if (tasks.value.length) onSelectTask(tasks.value[0]);
  } catch (e) {
    console.error('加载任务列表失败:', e);
    tasks.value = [];
  }
}


// ---------------- watch tasks ----------------
watch(
  () => tasks.value,
  (newTasks) => {
    if (props.mode === 'single') return;
    if (newTasks.length && !selectCase.value) {
      selectCase.value = newTasks[0];
    }
  },
  { immediate: true }
);

watch(
  () => props.taskId,
  async (newTaskId) => {
    if (!newTaskId) return;

    // single 模式才响应外部 taskId
    if (props.mode == 'batch') return;

    try {
      // 重置当前状态
      selectCase.value = null;
      annotationTask.value = {};
      annotationData.value = {};
      cocoAnnotations.value = [];

      const res = await getPhysicianTask(newTaskId);
      if (res.code === 0) {
        tasks.value = [res.data];
        totalNum.value = 1;
        completeNum.value = 0;

        await nextTick();
        await onSelectTask(res.data);
      }
    } catch (e) {
      console.error('watch taskId 加载任务失败:', e);
    }
  },
  { immediate: true }
);

</script>

<style scoped>
.annotation-layout {
  display: flex;
  height: 90vh;
  overflow: hidden;
  user-select: none;
}

.left-pane {
  background: #fff;
  border-right: 1px solid #e5e7eb;
  min-width: 160px;
}

.center-pane {
  flex: 1;
  background: #f9fafb;
  min-width: 200px;
  position: relative;
}

.right-pane {
  background: #fff;
  border-left: 1px solid #e5e7eb;
  min-width: 200px;
}

.splitter {
  width: 6px;
  cursor: ew-resize;
  background: #f3f4f6;
}

.empty-center,
.empty-right {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: #cbd5e1;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  color: #94a3b8;
  text-align: center;
  max-width: 200px;
}
</style>
