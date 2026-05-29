<template>
  <div class="center-panel">
    <ImageViewer
      ref="viewerRef"
      :src="currentImageUrl || ''"
      :imageId="task.diagnose_id+'_'+currentHand"
      :selected-shape="currentSettings.shape"
      :is-annotating="isAnnotating"
      :brush-color="currentSettings.brushColor"
      :fill-shape="currentSettings.fillShape"
      :shapes="shapesDisplay"
      :annotationTask="annotationTask"
      @update:shapes="onShapesUpdate"
      @update:annotate="toggleAnnotationMode"
      @loaded="onImageLoaded"
      @scale-change="scale = $event"
      @shape-menu-hide="shapeMenuVisible = false"
      @update:coco="onCocoUpdate"
      @annotation-complete="onAnnotationComplete"
    />

    <!-- 悬浮底部工具栏 -->
    <div class="floating-toolbar" role="toolbar" aria-label="工具栏">
      <div class="toolbar-group">
        <el-tooltip content="上一张" placement="top">
          <el-button
            class="icon-btn"
            :disabled="currentIndex===0 || currentHandImages.length===0"
            @click="prevImage"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
          </el-button>
        </el-tooltip>

        <el-tooltip content="下一张" placement="top">
          <el-button
            class="icon-btn"
            :disabled="currentIndex >= currentHandImages.length - 1 || currentHandImages.length===0"
            @click="nextImage"
          >
            <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>
          </el-button>
        </el-tooltip>
      </div>

      <div class="toolbar-divider" />

      <div class="toolbar-group">
        <el-tooltip content="适应屏幕" placement="top">
          <el-button class="icon-btn" @click="fitToScreen">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M3 5v4h2V7h4V5H3zm12 0v2h4v4h2V5h-6zM3 15v4h6v-2H5v-2H3zm18 0h-2v2h-4v2h6v-4z"/></svg>
          </el-button>
        </el-tooltip>

        <el-tooltip content="居中" placement="top">
          <el-button class="icon-btn" @click="centerImage">
            <svg class="nav-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M12 8a4 4 0 100 8 4 4 0 000-8zm0-6v2a8 8 0 010 16v2A10 10 0 1012 2z"/></svg>
          </el-button>
        </el-tooltip>
      </div>

      <div class="toolbar-divider" />

      <div class="toolbar-group">
        <el-tooltip content="标注颜色" placement="top">
          <el-button class="icon-btn icon-color">
            <el-color-picker 
              v-model="currentSettings.brushColor" 
              popper-class="color-popper" 
              size="small" 
              show-alpha 
              @change="onColorChange"
            />
          </el-button>
        </el-tooltip>

        <div class="shape-btn-wrapper">
         
          <el-tooltip :content="`当前形状: ${getShapeName(currentSettings.shape)}`" placement="bottom">
            <el-button
              class="icon-btn"
              :class="{ 'active-btn': shapeMenuVisible }"
              @click="toggleShapeMenu"
            >
              <!-- 图形显示 -->
              <svg v-if="currentSettings.shape === 'circle'" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="8"/>
              </svg>
              <svg v-else-if="currentSettings.shape === 'diamond'" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12,4 20,12 12,20 4,12"/>
              </svg>
              <svg v-else-if="currentSettings.shape === 'triangle'" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12,4 20,20 4,20"/>
              </svg>
              <svg v-else-if="currentSettings.shape === 'custom'" class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/>
                <path d="M20.71 7.04l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83a1 1 0 000-1.41z"/>
              </svg>
              <svg v-else class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="4" y="4" width="16" height="16"/>
              </svg>
            </el-button>
          </el-tooltip>

          <ul v-if="shapeMenuVisible" class="shape-menu">
            <li @click="chooseShape('rect')" :class="{ 'selected-shape': currentSettings.shape === 'rect' }" title="矩形">
              <svg class="li-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1">
                <rect x="2" y="2" width="12" height="12" fill="none" stroke="currentColor"/>
              </svg>
              <span class="shape-name">矩形</span>
            </li>
            <li @click="chooseShape('circle')" :class="{ 'selected-shape': currentSettings.shape === 'circle' }" title="圆形">
              <svg class="li-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1">
                <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor"/>
              </svg>
              <span class="shape-name">圆形</span>
            </li>
            <li @click="chooseShape('diamond')" :class="{ 'selected-shape': currentSettings.shape === 'diamond' }" title="菱形">
              <svg class="li-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1">
                <polygon points="8,2 14,8 8,14 2,8" fill="none" stroke="currentColor"/>
              </svg>
              <span class="shape-name">菱形</span>
            </li>
            <li @click="chooseShape('triangle')" :class="{ 'selected-shape': currentSettings.shape === 'triangle' }" title="三角形">
              <svg class="li-icon" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1">
                <polygon points="8,2 14,14 2,14" fill="none" stroke="currentColor"/>
              </svg>
              <span class="shape-name">三角形</span>
            </li>
            <li @click="chooseShape('custom')" :class="{ 'selected-shape': currentSettings.shape === 'custom' }" title="自由绘制">
              <svg class="li-icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
              </svg>
              <span class="shape-name">自由绘制</span>
            </li>
          </ul>
        </div>

        <el-tooltip :content="isAnnotating ? '退出标注模式':'进入标注模式'" placement="top">
          <el-button 
            class="icon-btn" 
            @click="toggleAnnotationMode" 
            :class="{ 'active-btn': isAnnotating }" 
            style="margin-left:2px"
          >
            <svg v-if="isAnnotating" class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM9 8V6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9z"/>
            </svg>
            <svg v-else class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
            </svg>
          </el-button>
        </el-tooltip>
      </div>

      <el-tooltip :content="currentSettings.fillShape ? '实心模式' : '空心模式'" placement="top">
        <el-button class="icon-btn" @click="toggleFill" >
          <svg v-if="currentSettings.fillShape" class="nav-icon" viewBox="0 0 24 24" fill="currentColor">
            <ellipse cx="12" cy="12" rx="8" ry="6"/>
          </svg>
          <svg v-else class="nav-icon" viewBox="0 0 24 24">
            <ellipse cx="12" cy="12" rx="8" ry="6" 
                    fill="transparent" stroke="#000000" 
                    stroke-width="2"/>
          </svg>
        </el-button>
      </el-tooltip>

      <div class="toolbar-divider" />
      <div class="toolbar-status" style="margin-left:10px">
        <el-tooltip :content="`旋转:${rotation}`" placement="top">
          <div class="zoom-text">
            <el-slider class="mini-rotate" v-model="rotation" :min="0" :max="360" :step="1" @change="onRotationChange" show-tooltip="false" />
          </div>
        </el-tooltip>
        <div class="zoom-text">{{ Math.round(scale*100) }}%</div>
      </div>
    </div>

    <!-- 标注状态提示 -->
    <div class="annotation-status">
      <div class="status-indicator" :class="{ 'annotating': isAnnotating, 'viewing': !isAnnotating }">
        {{ isAnnotating ? '标注模式' : '查看模式' }}
      </div>
      <div class="shape-info" v-if="isAnnotating">
        当前形状:
      <span class="color-preview">
       <svg
        v-if="currentSettings.shape === 'circle'"
        class="icon"
        viewBox="0 0 24 24"
        :fill="currentSettings.fillShape ? currentSettings.brushColor : 'none'"
        :stroke="currentSettings.brushColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="8"/>
      </svg>
        <svg v-else-if="currentSettings.shape === 'diamond'" class="icon" viewBox="0 0 24 24" 
         :fill="currentSettings.fillShape ? currentSettings.brushColor : 'none'"
        :stroke="currentSettings.brushColor" stroke-width="2">
          <polygon points="12,4 20,12 12,20 4,12"/>
        </svg>
        <svg v-else-if="currentSettings.shape === 'triangle'" class="icon" viewBox="0 0 24 24"  :fill="currentSettings.fillShape ? currentSettings.brushColor : 'none'"
        :stroke="currentSettings.brushColor" stroke-width="2">
          <polygon points="12,4 20,20 4,20"/>
        </svg>
        <svg v-else-if="currentSettings.shape === 'custom'" class="icon" viewBox="0 0 24 24"  :fill="currentSettings.fillShape ? currentSettings.brushColor : 'none'"
        :stroke="currentSettings.brushColor" stroke-width="2">
          <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/>
          <path d="M20.71 7.04l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83a1 1 0 000-1.41z"/>
        </svg>
        <svg v-else class="icon" viewBox="0 0 24 24"   :fill="currentSettings.fillShape ? currentSettings.brushColor : 'none'"
        :stroke="currentSettings.brushColor" stroke-width="2">
          <rect x="4" y="4" width="16" height="16"/>
        </svg>
      </span>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { ref, computed, watch, nextTick, reactive, onMounted } from 'vue';
import ImageViewer from './imageViewer.vue';

interface Shape {
  id: string;
  type: string;
  borderColor?: string;
  borderWidth?: number;
  visible?: boolean;
  [key: string]: any;
}

interface AnnotationSettings {
  shape: 'rect' | 'circle' | 'diamond' | 'triangle' | 'custom' | 'none';
  brushColor: string;
  fillShape: boolean;
}

interface AnnotationTypeSettings {
  [key: string]: AnnotationSettings;
}

interface ImageInfo {
  left?: string[];
  right?: string[];
}

interface Task {
  id: number;
  reportId: number;
  status: number;
  userName: string;
  gender: string;
  age: number;
  imageInfo: ImageInfo;
}

const emit = defineEmits(['annotation-complete', 'change-image', 'update:coco', 'getHandType']);

const props = defineProps({
  task: { 
    type: Object as () => Task,
    default: () => ({ 
      id: 0,
      reportId: 0,
      status: 0,
      userName: '',
      gender: '',
      age: 0,
      imageInfo: {}
    })
  },
  handType: {
    type: String,
    default: ''
  },
  annotationTask: { 
    type: Object, 
    default: () => ({}) 
  },
  cocoAnnotations:{
    type: Array, 
    default: () => ([]) 
  },
  annotationType: {
    type: String,
    default: 'organ'
  },
  userSettings: {
    type: Object,
    default: () => ({})
  }
});

// ---------- 基础状态 ----------
const currentIndex = ref(0);
const isAnnotating = ref(false);
const viewerRef = ref<any>(null);
const scale = ref(1);
const rotation = ref(0);
const shapesDisplay = ref<Shape[]>([]);
const shapeMenuVisible = ref(false);
const currentAnnotationType = ref('');
const currentHand = ref<'left' | 'right'>('left');
const selectedShapeId = ref<string | null>(null);

// 防抖标志防止无限循环
const isProcessingTask = ref(false);

// ---------- 默认的标注类型设置 ----------
const defaultAnnotationSettings: AnnotationTypeSettings = {
  organ: {
    shape: 'custom',
    brushColor: "rgba(0, 128, 255, 0.8)",
    fillShape: false
  },
  feature: {
    shape: 'custom',
    brushColor: "rgba(0, 128, 255, 0.8)",
    fillShape: false
  },
  default: {
    shape: 'custom',
    brushColor: "rgba(0, 128, 255, 0.8)",
    fillShape: false
  }
};

// 当前标注设置
const currentSettings = reactive<AnnotationSettings>({
  shape: 'custom',
  brushColor: 'rgba(0, 128, 255, 0.8)',
  fillShape: false
});

// ---------- 计算属性 ----------
const currentTask = computed(() => props.task);
const imageInfo = computed(() => currentTask.value?.image_info || {});
const currentHandImages = computed(() => {
  console.log("left",imageInfo.value.left_image_url)
   console.log("right",imageInfo.value.right_image_url)
  const images: string[] = [];
  if (imageInfo.value.left_image_url) {
    images.push(imageInfo.value.left_image_url);
  }
  if (imageInfo.value.right_image_url) {
    images.push(imageInfo.value.right_image_url);
  }
  return images;
});

const currentImageUrl = computed(() => {
  if (!currentHandImages.value.length) return '';
  return currentHandImages.value[currentIndex.value];
});
const hasLeftImages = computed(() => !!imageInfo.value.left_image_url);
const hasRightImages = computed(() => !!imageInfo.value.right_image_url);


const cocoAnnotations = ref<any[]>([]);

/**
 * 🔹 COCO 唯一来源
 */
function onCocoUpdate(annotations: any[]) {
  cocoAnnotations.value = annotations
  emit('update:coco', annotations)
}

// 单个标注完成时处理
function onAnnotationComplete(shape: any) {
  //console.log('标注完成:', shape);
}

// ---------- 初始化与响应式 ----------
const initSettings = (
  annotationType: string,
  reset = true
) => {

  const userTypeSettings =
    props.userSettings?.[annotationType];

  const defaultForType =
    defaultAnnotationSettings[annotationType] ||
    defaultAnnotationSettings.default;

  Object.assign(currentSettings, {
    ...defaultForType,
    ...userTypeSettings
  });

  isAnnotating.value = true;

  currentAnnotationType.value = annotationType;

  // ⭐ 只有真正重新初始化才清空
  if (reset) {

    shapesDisplay.value = [];

    if (viewerRef.value) {
      viewerRef.value.clearShapes();
    }

    selectedShapeId.value = null;
  }
};

// 外部调用的开始标注方法
const startAnnotation = (task: Task,isReset: boolean) => {
  if (!task) return;
  
  const annotationType = (task as any).nodeType || props.annotationType || 'default';
  initSettings(annotationType,isReset);
};


// 获取形状名称
const getShapeName = (shape: string): string => {
  const shapeNames: {[key: string]: string} = {
    'rect': '矩形',
    'circle': '圆形',
    'diamond': '菱形',
    'triangle': '三角形',
    'custom': '自由绘制',
    'none': '无'
  };
  return shapeNames[shape] || '矩形';
};

// 切换左右手
const switchHand = (hand: 'left' | 'right') => {
  if (hand === currentHand.value) return;
  if (hand === 'left' && !hasLeftImages.value) return;
  if (hand === 'right' && !hasRightImages.value) return;
  currentHand.value = hand;
  if(currentHandImages.value.length > 1){
    if(hand == 'right')currentIndex.value = 1;
    else currentIndex.value = 0; 
  }
  shapesDisplay.value = [];
  selectedShapeId.value = null;

  // 通知父组件手类型变化
  emit('getHandType', hand);

  // 重置缩放和旋转
  resetView();
};


// ---------- Viewer 操作 ----------
function syncScale() { 
  scale.value = viewerRef.value?.getScale?.() ?? scale.value; 
}

function toggleFill() { 
  currentSettings.fillShape = !currentSettings.fillShape; 
}

function toggleAnnotationMode() { 
  if (!currentAnnotationType.value) {
    ElMessage.warning("请先选择标注任务! ")
    return;
  }
  isAnnotating.value = !isAnnotating.value; 
  if (!isAnnotating.value) {
    viewerRef.value?.cancelDrawing();
  }
}

function keepAnnotationMode() { 
  isAnnotating.value = false; 
}

function fitToScreen() { 
  viewerRef.value?.zoomToFit(); 
  viewerRef.value?.center(); 
  syncScale(); 
}

function centerImage() { 
  viewerRef.value?.center(); 
}

function resetView() {
  nextTick(() => {
    if (viewerRef.value) {
      viewerRef.value.zoomToFit();
      viewerRef.value.center();
      syncScale();
      viewerRef.value.rotate(rotation.value);
    }
  });
}

function clearShapes() { 
  viewerRef.value?.clearShapes(); 
  shapesDisplay.value = []; 
  cocoAnnotations.value = [];
  cocoAnnotations.value = []
  selectedShapeId.value = null
  emit('update:coco', []);
}

function toggleShapeMenu() { 
  shapeMenuVisible.value = !shapeMenuVisible.value; 
}

function chooseShape(type: AnnotationSettings['shape']) { 
  currentSettings.shape = type; 
  shapeMenuVisible.value = false; 
}

function onRotationChange(val: number) { 
  rotation.value = val; 
  viewerRef.value?.rotate(val); 
}

// 形状更新处理
function onShapesUpdate(shapes: any[]) {
  shapesDisplay.value = shapes.map(s => ({ ...s }))
  // ===== organ 主体 =====
  let organShapes = shapesDisplay.value.filter(
    s => !s.featureId
  )

  // ===== feature =====
  const featureShapes = shapesDisplay.value.filter(
    s => s.featureId
  )
if (
    organShapes.length === 0 &&
    featureShapes.length > 0
  ) {
    organShapes = featureShapes
  }

  // ===== feature 挂载到 organ =====
  const result = organShapes.map(organ => {
    const features = featureShapes.filter(
      f =>
        f.contourId &&
        f.contourId === organ.contourId
    )

    return {
      ...organ,
      features
    }
  })
  emit('annotation-complete', result)
}
function onColorChange() {
  console.log('颜色已更改为:', currentSettings.brushColor);
}

function onImageLoaded() { 
  resetView();
}
function cocoToShapes(cocoList: any[]) {
  return cocoList.map(c => {
    const [x, y, w, h] = c.bbox;
    const attr = c.attributes || {};

    return {
      // ⭐ 用原始 shapeId，保证回显的是“同一个形状”
      id: attr.shapeId || 'coco_' + c.id,

      // ⭐ 形状类型
      type: attr.type || c.shapeType || 'custom',

      x,
      y,
      w,
      h,

      // ⭐ 多边形点
      points: c.segmentation?.[0]
        ? chunkPoints(c.segmentation[0])
        : undefined,

      color: attr.color || '#409EFF',
      borderColor: attr.color || '#409EFF',
      contourId: c.contourId,
      bbox:c.bbox,
      featureName:c.featureName,
      segmentation:c.segmentation,
      featureAnnotations:c.featureAnnotations,
      status:c.status,
      featureId:c.featureId,
       category_id:c.category_id,
        remark:c.remark,
      selectFetureIds:c.selectFetureIds,
      fill: attr.fill === true,
      visible: true,
      image_id: c.image_id
    };
  });
}

function chunkPoints(arr:number[]) {
  const pts = []
  for(let i=0;i<arr.length;i+=2){
    pts.push({x:arr[i], y:arr[i+1]})
  }
  return pts
}

function makeAlpha(color: string | undefined, alpha: number): string {
  if (!color) return `rgba(64,158,255,${alpha})`;

  // 已经是 rgba，直接替换 alpha
  if (color.startsWith('rgba')) {
    return color.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/, `rgba($1,$2,$3,${alpha})`);
  }

  // rgb -> rgba
  if (color.startsWith('rgb')) {
    const m = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (m) return `rgba(${m[1]},${m[2]},${m[3]},${alpha})`;
  }

  // hex
  let hex = color.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6) return color;

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);

  return `rgba(${r},${g},${b},${alpha})`;
}



// ---------- 形状操作 ----------
const highlightShape = (shapeId: string) => {
  selectedShapeId.value = shapeId;
  if (viewerRef.value) {
    viewerRef.value.highlightShape(shapeId);
  }
};

function deleteShape(id: string) {
  viewerRef.value?.deleteShape(id)
  shapesDisplay.value = shapesDisplay.value.filter(s => s.id !== id)
}

// ---------- 上一张 / 下一张 ----------
function nextImage() {
  if (currentIndex.value < currentHandImages.value.length - 1) {
    currentIndex.value++;
    shapesDisplay.value = [];
    selectedShapeId.value = null;
    resetView();

    // 切换到右手的图片
    if(currentIndex.value === 1) currentHand.value = 'right';
    emit('getHandType', currentHand.value);
    emit("change-image", currentHand.value);
  }
}

function prevImage() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
    shapesDisplay.value = [];
    selectedShapeId.value = null;
    resetView();

    // 切换到左手的图片
    if(currentIndex.value === 0) currentHand.value = 'left';
    emit('getHandType', currentHand.value);
     emit("change-image", currentHand.value);
  }
}


// 暴露方法给父组件
defineExpose({
  startAnnotation,
  highlightShape,
  deleteShape,
  clearShapes,
  switchHand,
  nextImage,
  prevImage,
  keepAnnotationMode
});

// ---------- Watchers ----------
// 监听 annotationTask 变化
watch(() => props.annotationTask, (newTask) => {
  //handleAnnotationTaskStart();
}, { deep: true, immediate: true });

// 监听用户设置变化
watch(() => props.userSettings, () => {
  if (currentAnnotationType.value) {
    initSettings(currentAnnotationType.value);
  }
}, { deep: true });

// 监听当前图片URL变化
watch(currentImageUrl, async (newUrl, oldUrl) => {
  if (newUrl !== oldUrl && newUrl) {
    shapesDisplay.value = [];
    selectedShapeId.value = null;
    
    await nextTick();
    
    if (viewerRef.value && newUrl) {
      setTimeout(() => {
        if (viewerRef.value) {
          viewerRef.value.zoomToFit();
          viewerRef.value.center();
          syncScale();
        }
      }, 50);
    }
  }
});
watch(
  () => props.cocoAnnotations,
  (newCoco) => {
    if (!newCoco || newCoco.length === 0) {
      shapesDisplay.value = []
      viewerRef.value?.clearShapes()
      return
    }
    const shapes = cocoToShapes(newCoco)

    shapesDisplay.value = shapes
    onShapesUpdate(shapes)

    nextTick(() => {
      //viewerRef.value?.setShapes?.(shapes) 
    })
  },
  { immediate: true, deep: true }
)

// 监听旋转
watch(rotation, val => { 
  if (viewerRef.value) {
    viewerRef.value.rotate(val); 
  }
});

// 监听标注类型变化
watch(() => props.annotationType, (newType) => {
  if (!currentAnnotationType.value && newType) {
    initSettings(newType);
  }
});

// 监听任务变化
watch(() => props.task, (newTask) => {
  if (isProcessingTask.value) return;
  
  if (newTask && newTask.id) {
    isProcessingTask.value = true;
    
    // 重置状态
    currentIndex.value = 0;
    shapesDisplay.value = [];
    selectedShapeId.value = null;
    nextTick(() => {
      if (viewerRef.value) {
        viewerRef.value.zoomToFit();
        viewerRef.value.center();
        syncScale();
      }
      isProcessingTask.value = false;
    });
  }
}, { 
  deep: true,
  immediate: true 
});
// 监听父组件 handType 变化
watch(() => props.handType, (newHand) => {
  if (newHand && newHand !== currentHand.value) {
    switchHand(newHand as 'left' | 'right')
  }
}, { immediate: true });

</script>

<style scoped>
/* 病人信息卡片样式 */
.patient-info-card {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(0, 0, 0, 0.08);
  z-index: 50;
  min-width: 180px;
}

.patient-info-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.patient-icon {
  width: 20px;
  height: 20px;
  color: #3b82f6;
}

.patient-info-header span {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.patient-info-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.info-label {
  color: #64748b;
  font-weight: 500;
}

.info-value {
  color: #1e293b;
  font-weight: 500;
}

/* 原有所有样式保持不变 */
.main-area {
  flex: 1;
  display: flex;
  height: calc(91vh - 16px);
  min-height: 0;
  gap: 8px;
}

.center-panel {
  flex: 1;
  position: relative;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 12px;
  border: 1px solid rgba(16,24,40,0.04);
  box-shadow: 0 8px 20px rgba(16,24,40,0.03);
  overflow: hidden;
  min-height: 0;
  height: 88vh;
}

.annotation-status {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 50;
  display: flex;
  gap: 8px;
}

.status-indicator {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid;
  backdrop-filter: blur(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.status-indicator.annotating {
  border-color: #f5222d;
}

.status-indicator.viewing {
  color: #1890ff;
  border-color: #1890ff;
  background: rgba(24, 144, 255, 0.1);
}

.shape-info {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
}



.floating-toolbar {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  bottom: 18px;
  display: flex;
  align-items: center;
  border-radius: 999px;
  background: rgba(255,255,255,0.6);
  border: 1px solid rgba(255,255,255,0.45);
  box-shadow: 0 6px 30px rgba(15,23,42,0.12);
  backdrop-filter: blur(10px) saturate(120%);
  -webkit-backdrop-filter: blur(10px) saturate(120%);
  align-items: center;
  z-index: 60;
  max-width: calc(100% - 36px);
}

.floating-toolbar .toolbar-group {
  display:flex;
  align-items:center;
}

.toolbar-divider {
  width: 1px;
  height: 36px;
  background: rgba(15,23,42,0.06);
  border-radius: 2px;
}

.toolbar-status {
  display:flex;
  align-items:center;
  gap: 12px;
  min-width: 180px;
}

.zoom-text { 
  font-size: 13px; 
  color: #334155; 
  min-width: 64px; 
  text-align: center;
  display: flex;
  align-items: center;
  gap: 4px;
}

.mini-rotate {
  width: 80px;
}
.mini-rotate ::v-deep .el-slider__button { display:none; }

.icon-btn {
  display:flex;
  align-items:center;
  justify-content:center;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all .18s ease;
  color: #475569;
  padding: 6px;
}

.icon-color:hover{
  background:transparent
}
.icon-btn.is-disabled { opacity: .46; cursor: not-allowed; transform: none; }
.icon-btn .nav-icon { width:20px; height:20px; fill: currentColor; stroke: currentColor; }

.active-btn {
  background: linear-gradient(135deg,#3b82f6,#1d4ed8);
  color: #fff !important;
  box-shadow: 0 10px 30px rgba(59,130,246,0.2);
  transform: translateY(-2px);
}
.active-btn .nav-icon,
.active-btn svg { fill: currentColor !important; stroke: currentColor !important; color: inherit !important; }

.color-popper .el-color-picker__trigger { height: 36px; width: 36px; border-radius: 8px; padding: 4px; }

.shape-btn-wrapper {
  position: relative;
}

.shape-menu {
  position: absolute;
  bottom: 50px;
  left: 0;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(8px);
  list-style: none;
  padding: 2px 0;
  margin: 0;
  border-radius: 10px;
  border: 1px solid rgba(0,0,0,0.08);
  box-shadow: 0 6px 20px rgba(0,0,0,0.12);
  min-width: 120px;
  z-index: 9999;
}

.shape-menu li {
  padding: 8px 12px;
  cursor: pointer;
  font-size: 14px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.shape-menu li:hover {
  background: #f0f7ff;
  color: #1d4ed8;
}

.shape-menu li.selected-shape {
  background: linear-gradient(135deg,#3b82f6,#1d4ed8);
  color: white;
}

.shape-menu li.selected-shape .li-icon {
  color: white;
}

.shape-menu li .li-icon {
  width: 20px;
  height: 20px;
  color: #475569;
}
.shape-menu li:hover .li-icon {
  color: #3b82f6;
}

.shape-name {
  font-size: 14px;
}

/* 针对平板设备的优化 - 增加工具栏底部间距 */
@media (max-width: 1024px) {
  .floating-toolbar {
    bottom: 24px; /* 从原来的12px增加到24px */
    padding: 6px 12px;
  }
  
  .icon-btn {
    width: 40px;
    height: 40px;
  }
  
  .toolbar-status {
    min-width: 160px;
  }
  
  .mini-rotate {
    width: 70px;
  }
  
  .patient-info-card {
    top: 12px;
    right: 12px;
    padding: 12px;
    min-width: 160px;
  }
}

@media (max-width: 900px) {
  .main-area {
    flex-direction: row;
    height: calc(91vh - 88px);
    gap: 6px;
  }
  
  /* 确保900px宽度时也有合适的底部间距 */
  .floating-toolbar {
    bottom: 24px;
  }
}

@media (max-width: 768px) {
  .main-area {
    flex-direction: column;
    height: calc(91vh - 78px);
    gap: 4px;
  }
  
  .floating-toolbar {
    bottom: 20px; /* 从原来的8px增加到20px */
    padding: 4px 8px;
    max-width: calc(100% - 16px);
  }
  
  .icon-btn {
    width: 36px;
    height: 36px;
  }
  
  .nav-icon {
    width: 18px;
    height: 18px;
  }
  
  .toolbar-status {
    min-width: 120px;
    gap: 6px;
  }
  
  .mini-rotate {
    width: 60px;
  }
  
  .zoom-text {
    font-size: 12px;
    min-width: 50px;
  }
  
  .shape-menu {
    bottom: 42px;
    min-width: 100px;
  }
  
  .shape-menu li {
    padding: 6px 10px;
  }
  
  .annotation-status {
    top: 12px;
    left: 12px;
  }
  
  .status-indicator,
  .shape-info {
    font-size: 12px;
    padding: 4px 8px;
  }
  
  .patient-info-card {
    top: 8px;
    right: 8px;
    padding: 8px;
    min-width: 140px;
  }
  
  .info-row {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .main-area {
    height: calc(91vh - 66px);
  }
  
  .floating-toolbar {
    bottom: 16px; /* 从原来的4px增加到16px */
    flex-wrap: wrap;
    justify-content: center;
    border-radius: 12px;
    padding: 6px;
  }
  
  .toolbar-group {
    margin: 2px 0;
  }
  
  .icon-btn {
    width: 32px;
    height: 32px;
    margin: 0 2px;
  }
  
  .nav-icon {
    width: 16px;
    height: 16px;
  }
  
  .annotation-status {
    top: 8px;
    left: 8px;
  }
  
  .status-indicator,
  .shape-info {
    font-size: 11px;
    padding: 3px 6px;
  }
  
  .patient-info-card {
    top: 4px;
    right: 4px;
    padding: 6px;
    min-width: 120px;
  }
  
  .patient-info-header {
    font-size: 12px;
  }
  
  .info-row {
    font-size: 11px;
  }
}

/* 针对iPad等平板设备的专项优化 */
@media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
  .floating-toolbar {
    bottom: 32px; /* 竖屏时增加底部间距 */
  }
}

@media (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {
  .floating-toolbar {
    bottom: 28px; /* 横屏时增加底部间距 */
  }
}

/* 针对Surface Pro等设备的优化 */
@media (min-width: 1025px) and (max-width: 1366px) {
  .floating-toolbar {
    bottom: 24px; /* 中等屏幕也适当增加间距 */
  }
}

.main-area,
.center-panel {
  overflow: hidden;
}

.task-list::-webkit-scrollbar-track,
.right-scroll::-webkit-scrollbar-track {
  background: transparent;
}

.task-list::-webkit-scrollbar-thumb,
.right-scroll::-webkit-scrollbar-thumb {
  background: rgba(0,0,0,0.1);
  border-radius: 2px;
}

.task-list::-webkit-scrollbar-thumb:hover,
.right-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(0,0,0,0.2);
}

.icon-btn .icon {
  width: 18px;
  height: 18px;
}

.color-preview {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 6px;
  background: rgba(0,0,0,0.04); /* 关键 */
}

</style>