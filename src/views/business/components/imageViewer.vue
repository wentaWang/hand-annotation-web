<template>
  <div class="image-box" ref="containerRef">
    <canvas ref="canvasRef"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
      @pointerleave="onPointerUp"
      @wheel.prevent="onWheel"
    ></canvas>

    <img ref="imgRef" :src="src" @load="onImageLoad" style="display:none" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, onBeforeUnmount, nextTick } from 'vue';

export interface Shape {
  id: string;
  type: 'rect'|'circle'|'ellipse'|'triangle'|'diamond'|'polygon'|'custom'|'none';
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  points?: {x:number;y:number}[];
  label?: string;
  annotationType?: string;
  notes?: string;
  confidence?: number;
  color?: string;
  fillColor?: string;
  borderColor: string;
  borderWidth:string;
  fill?: boolean;
  fillPattern?: string;
  visible?: boolean;
  originalCoords?: any;
  imageId:string
}

// ---------- props & emits ----------
const props = defineProps<{
  src: string | null;
  selectedShape: Shape['type'];
  isAnnotating: boolean;
  brushColor: string;
  shapes: Shape[];
  fillShape: boolean;
  annotationTask:Object;
    imageId:string
}>()

const emit = defineEmits<{
  (e: 'update:shapes', shapes: Shape[]): void;
  (e: 'loaded'): void;
  (e: 'update:annotate'): void;
  (e: 'scale-change', scale:number): void;
  (e: 'shape-menu-hide'): void;
  (e: 'annotation-complete', shape: Shape): void;
  (e: 'update:coco', annotations:any[]): void;
}>()

// ---------- refs ----------
const containerRef = ref<HTMLDivElement|null>(null);
const canvasRef = ref<HTMLCanvasElement|null>(null);
const imgRef = ref<HTMLImageElement|null>(null);
let ctx: CanvasRenderingContext2D|null = null;
const shapesLocal = ref<Shape[]>([]);

// ---------- state ----------
const state = reactive({
  scale: 1,
  rotation: 0,
  offsetX: 0,
  offsetY: 0,
  isPanning: false,
  isDrawing: false,
  startX: 0,
  startY: 0,
  lastPointerId: -1,
  pointers: new Map<number, PointerEvent>(),
  hasCompletedAnnotation: false,
  isFormOpen: false,
  currentShape: null as Shape | null,
  gestureStart: null as any,
});

// ---------- watch ----------
watch(() => props.shapes, (ns) => {
  shapesLocal.value = ns ? ns.map(s => ({ ...s })) : [];
  drawAll();
}, { deep: true });

watch(() => props.src, async () => {
  await nextTick();
  reset();
});

// ---------- canvas resize ----------
function resizeCanvas(){
  if(!canvasRef.value) return;
  const c = canvasRef.value;
  const rect = containerRef.value?.getBoundingClientRect() ?? c.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  c.width = Math.max(1, Math.floor(rect.width * dpr));
  c.height = Math.max(1, Math.floor(rect.height * dpr));
  c.style.width = `${rect.width}px`;
  c.style.height = `${rect.height}px`;
  ctx = c.getContext('2d');
  if(ctx) ctx.setTransform(dpr,0,0,dpr,0,0);
  drawAll();
}

// ---------- coords conversion ----------
function screenToImage(pageX:number, pageY:number){
  if(!canvasRef.value || !imgRef.value) return {x:0,y:0};
  const rect = canvasRef.value.getBoundingClientRect();
  const cx = (pageX - rect.left - rect.width/2 - state.offsetX)/state.scale;
  const cy = (pageY - rect.top - rect.height/2 - state.offsetY)/state.scale;
  const rad = -state.rotation * Math.PI / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const rx = cx * cos - cy * sin;
  const ry = cx * sin + cy * cos;
  return { x: rx + imgRef.value!.naturalWidth/2, y: ry + imgRef.value!.naturalHeight/2 };
}

function imageToScreen(ix:number, iy:number){
  if(!canvasRef.value || !imgRef.value) return {x:0,y:0};
  const c = canvasRef.value;
  const px = ix - imgRef.value.naturalWidth/2;
  const py = iy - imgRef.value.naturalHeight/2;
  const rad = state.rotation * Math.PI / 180;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  const rx = px * cos - py * sin;
  const ry = px * sin + py * cos;
  const sx = rx * state.scale + c.getBoundingClientRect().width/2 + state.offsetX;
  const sy = ry * state.scale + c.getBoundingClientRect().height/2 + state.offsetY;
  return { x: sx, y: sy };
}

// ---------- drawing helpers ----------
function makeAlpha(hex:string, alpha:number){
  if(!hex) return `rgba(64,158,255,${alpha})`;
  if(hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  let c = hex.replace('#','');
  if(c.length===3) c = c.split('').map(ch=>ch+ch).join('');
  const r = parseInt(c.substring(0,2),16);
  const g = parseInt(c.substring(2,4),16);
  const b = parseInt(c.substring(4,6),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function applyFillAndStroke(s:Shape, drawFn:()=>void){
  if(!ctx) return;
  ctx.save();
  ctx.lineWidth = s.borderWidth ?? Math.max(1, 2 / Math.max(0.0001, state.scale));
  ctx.strokeStyle = s.borderColor ?? (s.color || props.brushColor || '#409EFF');
  
  const doFill = s.fill !== undefined ? s.fill : false;
  
  const fillColor = s.fillColor ?? (doFill ? makeAlpha(s.color || props.brushColor || '#409EFF', 0.14) : 'transparent');
  
  ctx.fillStyle = fillColor;
  drawFn();
  if(doFill) ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawShapeOnCtx(s: Shape) {
  if (!ctx || !imgRef.value) return;
  const ox = -imgRef.value.naturalWidth / 2;
  const oy = -imgRef.value.naturalHeight / 2;

  if (s.type === 'rect') {
    applyFillAndStroke(s, () => {
      ctx!.beginPath();
      ctx!.rect((s.x ?? 0) + ox, (s.y ?? 0) + oy, s.w ?? 0, s.h ?? 0);
    });
  } else if (s.type === 'circle' || s.type === 'ellipse') {
    const x = (s.x ?? 0) + ox,
      y = (s.y ?? 0) + oy;
    const w = s.w ?? 0,
      h = s.h ?? 0;
    const cx = x + w / 2,
      cy = y + h / 2;
    const rx = Math.abs(w) / 2,
      ry = Math.abs(h) / 2 || rx;
    applyFillAndStroke(s, () => {
      ctx!.beginPath();
      if (ctx!.ellipse) ctx!.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      else {
        ctx!.save();
        ctx!.translate(cx, cy);
        ctx!.scale(1, ry / rx);
        ctx!.arc(0, 0, rx, 0, Math.PI * 2);
        ctx!.restore();
      }
    });
  } else if (s.type === 'triangle' || s.type === 'diamond') {
    const x = (s.x ?? 0) + ox,
      y = (s.y ?? 0) + oy;
    const w = s.w ?? 0,
      h = s.h ?? 0;
    if (s.type === 'triangle') {
      applyFillAndStroke(s, () => {
        ctx!.beginPath();
        ctx!.moveTo(x + w / 2, y);
        ctx!.lineTo(x + w, y + h);
        ctx!.lineTo(x, y + h);
        ctx!.closePath();
      });
    } else if (s.type === 'diamond') {
      const cx = x + w / 2,
        cy = y + h / 2;
      applyFillAndStroke(s, () => {
        ctx!.beginPath();
        ctx!.moveTo(cx, cy - h / 2);
        ctx!.lineTo(cx + w / 2, cy);
        ctx!.lineTo(cx, cy + h / 2);
        ctx!.lineTo(cx - w / 2, cy);
        ctx!.closePath();
      });
    }
  } else if (s.type === 'polygon') {
    // polygon 保持封闭图形
    if (!s.points || s.points.length === 0) return;
    applyFillAndStroke(s, () => {
      ctx!.beginPath();
      ctx!.moveTo(s.points![0].x + ox, s.points![0].y + oy);
      for (let i = 1; i < s.points!.length; i++)
        ctx!.lineTo(s.points![i].x + ox, s.points![i].y + oy);
      ctx!.closePath();
    });
  } else if (s.type === 'custom') {
    // custom 作为自由绘制，绘制连续的线条
    if (!s.points || s.points.length < 2) return;

    ctx.save();
    ctx.lineWidth = s.borderWidth ?? Math.max(1, 2 / Math.max(0.0001, state.scale));
    ctx.strokeStyle = s.borderColor ?? (s.color || props.brushColor || '#409EFF');
    ctx.lineCap = 'round'; // 添加圆角线条端点
    ctx.lineJoin = 'round'; // 添加圆角线条连接点

    // 绘制连续的线条
    ctx.beginPath();
    ctx.moveTo(s.points[0].x + ox, s.points[0].y + oy);
    
    // 逐点连接，形成连续线条
    for (let i = 1; i < s.points.length; i++) {
      ctx.lineTo(s.points[i].x + ox, s.points[i].y + oy);
    }
    
    ctx.stroke();
    ctx.restore();
  }
}


function drawAll(){
  if(!ctx || !canvasRef.value || !imgRef.value) return;
  ctx.clearRect(0,0,canvasRef.value.width, canvasRef.value.height);
  ctx.save();
  const rect = canvasRef.value.getBoundingClientRect();
  ctx.translate(rect.width/2 + state.offsetX, rect.height/2 + state.offsetY);
  ctx.rotate(state.rotation * Math.PI/180);
  ctx.scale(state.scale, state.scale);
  ctx.drawImage(imgRef.value, -imgRef.value.naturalWidth/2, -imgRef.value.naturalHeight/2);
  shapesLocal.value.forEach(s=>{ if(s.visible!==false) drawShapeOnCtx(s); });
  if(state.currentShape && state.isDrawing) drawShapeOnCtx(state.currentShape);
  ctx.restore();
}

// ---------- pointer & wheel ----------
function distance(a:PointerEvent, b:PointerEvent){ return Math.hypot(a.clientX-b.clientX, a.clientY-b.clientY); }
function angleDeg(a:PointerEvent, b:PointerEvent){ return Math.atan2(b.clientY-a.clientY, b.clientX-a.clientX)*180/Math.PI; }

function onPointerDown(e: PointerEvent) {
  emit('shape-menu-hide');
  (e.target as Element).setPointerCapture?.(e.pointerId);
  state.pointers.set(e.pointerId, e);

  if (state.pointers.size >= 2) {
    const pts = Array.from(state.pointers.values());
    state.gestureStart = {
      dist: distance(pts[0], pts[1]),
      angle: angleDeg(pts[0], pts[1]),
      scale: state.scale,
      rotation: state.rotation,
    };
    return;
  }

  if (state.isFormOpen) return;
  state.lastPointerId = e.pointerId;
  state.startX = e.clientX;
  state.startY = e.clientY;

  if (!props.isAnnotating || props.selectedShape === 'none') {
    state.isPanning = true;
    return;
  }

  if (state.hasCompletedAnnotation) return;

  const pos = screenToImage(e.clientX, e.clientY);
  
  // 根据类型初始化不同的形状
  let initialShape: Shape;
  
  if (props.selectedShape === 'custom') {
    // 对于custom类型，初始化点数组
    initialShape = {
      id: 's_' + Math.random().toString(36).slice(2, 10),
      type: props.selectedShape,
      x: pos.x,
      y: pos.y,
      color: props.brushColor,
      borderColor: props.brushColor,
      borderWidth: Math.max(2, 3 / Math.max(0.0001, state.scale)), // 稍微粗一点，更像画笔
      fill: false,
      visible: true,
      createTime: new Date().getTime(),
      points: [pos], // 初始点
      originalCoords: { points: [{ ...pos }] }
    };
  } else if (props.selectedShape === 'polygon') {
    initialShape = {
      id: 's_' + Math.random().toString(36).slice(2, 10),
      type: props.selectedShape,
      x: pos.x,
      y: pos.y,
      color: props.brushColor,
      borderColor: props.brushColor,
      borderWidth: Math.max(1, 2 / Math.max(0.0001, state.scale)),
      fill: props.fillShape,
      fillColor: props.fillShape ? props.brushColor : 'transparent',
      visible: true,
      createTime: new Date().getTime(),
      points: [pos],
      originalCoords: { points: [{ ...pos }] }
    };
  } else {
    // 矩形等形状
    initialShape = {
      id: 's_' + Math.random().toString(36).slice(2, 10),
      type: props.selectedShape,
      x: pos.x,
      y: pos.y,
      w: 0,
      h: 0,
      color: props.brushColor,
      borderColor: props.brushColor,
      borderWidth: Math.max(1, 2 / Math.max(0.0001, state.scale)),
      fill: props.fillShape,
      fillColor: props.fillShape ? props.brushColor : 'transparent',
      visible: true,
      createTime: new Date().getTime(),
      originalCoords: { x: pos.x, y: pos.y, width: 0, height: 0 }
    };
  }
  
  state.currentShape = initialShape;
  shapesLocal.value.push(initialShape);
  state.isDrawing = true;
  drawAll();
}
function isValidShape(shape: Shape): boolean {
  if (!shape) return false;

  // 面型（矩形 / 圆 / 椭圆 / 三角 / 菱形）
  if (
    shape.type === 'rect' ||
    shape.type === 'circle' ||
    shape.type === 'ellipse' ||
    shape.type === 'triangle' ||
    shape.type === 'diamond'
  ) {
    const w = Math.abs(shape.w ?? 0);
    const h = Math.abs(shape.h ?? 0);
    return w >= 5 && h >= 5;
  }

  // 多边形（需要至少3个点形成封闭图形）
  if (shape.type === 'polygon') {
    return Array.isArray(shape.points) && shape.points.length >= 3;
  }

  // 自定义自由绘制（只要至少有2个点形成线条即可）
  if (shape.type === 'custom') {
    return Array.isArray(shape.points) && shape.points.length >= 2;
  }

  return false;
}

function onPointerMove(e: PointerEvent) {
  if (state.pointers.has(e.pointerId)) state.pointers.set(e.pointerId, e);

  if (state.pointers.size >= 2 && state.gestureStart) {
    const pts = Array.from(state.pointers.values());
    const gs = state.gestureStart;
    state.scale = Math.max(0.05, (gs.scale * distance(pts[0], pts[1])) / gs.dist);
    state.rotation = gs.rotation + angleDeg(pts[0], pts[1]) - gs.angle;
    drawAll();
    emit('scale-change', state.scale);
    return;
  }

  if (state.isPanning && state.lastPointerId === e.pointerId) {
    state.offsetX += e.clientX - state.startX;
    state.offsetY += e.clientY - state.startY;
    state.startX = e.clientX;
    state.startY = e.clientY;
    drawAll();
    return;
  }

  if (state.isDrawing && state.currentShape) {
    const pos = screenToImage(e.clientX, e.clientY);
    
    if (state.currentShape.type === 'custom') {
      // 对于custom类型，持续添加点，形成连续线条
      if (state.currentShape.points) {
        const lastPoint = state.currentShape.points[state.currentShape.points.length - 1];
        
        // 计算与上一个点的距离
        const dist = lastPoint ? 
          Math.hypot(pos.x - lastPoint.x, pos.y - lastPoint.y) : 0;
        
        // 添加更密集的点，让线条更平滑（移除采样限制或设置更小的阈值）
        if (!lastPoint || dist > 2 / state.scale) { // 很小的阈值，几乎每个像素都记录
          state.currentShape.points.push({...pos}); // 使用浅拷贝避免引用问题
        }
      }
    } else if (
      state.currentShape.type === 'rect' ||
      state.currentShape.type === 'triangle' ||
      state.currentShape.type === 'diamond' ||
      state.currentShape.type === 'circle' ||
      state.currentShape.type === 'ellipse'
    ) {
      state.currentShape.w = pos.x - (state.currentShape.x ?? 0);
      state.currentShape.h = pos.y - (state.currentShape.y ?? 0);
    } else if (state.currentShape.points && state.currentShape.type === 'polygon') {
      // 对于polygon，仍然只更新最后一个点
      if (state.currentShape.points.length > 0) {
        state.currentShape.points[state.currentShape.points.length - 1] = pos;
      }
    }
    drawAll();
  }
}



function onPointerUp(e: PointerEvent) {
  try {
    (e.target as Element).releasePointerCapture?.(e.pointerId);
  } catch {}

  state.pointers.delete(e.pointerId);
  if (state.pointers.size < 2) state.gestureStart = null;

  if (state.isPanning && state.lastPointerId === e.pointerId) {
    state.isPanning = false;
    state.lastPointerId = -1;
    return;
  }

  if (state.isDrawing && state.currentShape) {
    const shape = state.currentShape;
    state.isDrawing = false;

    if (!isValidShape(shape)) {
      shapesLocal.value = shapesLocal.value.filter(s => s.id !== shape.id);
      state.currentShape = null;
      drawAll();
      return;
    }

    // 有效标注
    emit('update:shapes', [...shapesLocal.value]);
    emit('annotation-complete', shape);
    emitCocoData(props.imageId ?? 1);

    state.currentShape = null;
  }
}

function onWheel(e: WheelEvent){
  const before = screenToImage(e.clientX,e.clientY);
  state.scale *= e.deltaY<0?1.08:0.92;
  const after = screenToImage(e.clientX,e.clientY);
  state.offsetX += (after.x-before.x)*state.scale;
  state.offsetY += (after.y-before.y)*state.scale;
  drawAll(); emit('scale-change', state.scale);
}

// ---------- COCO conversion ----------
let annotationIdCounter = 1;

function shapeToCoco(shape: Shape, imageId: number, categoryId: number = 1){
  let bbox: [number, number, number, number];
  let segmentation: number[][] = [];

  if(shape.type === 'rect' || shape.type === 'diamond' || shape.type === 'triangle' || shape.type === 'ellipse' || shape.type === 'circle') {
    const x = shape.x ?? 0;
    const y = shape.y ?? 0;
    const w = shape.w ?? 0;
    const h = shape.h ?? 0;

    bbox = [x, y, w, h];

    if(shape.type === 'rect') segmentation = [[x, y, x+w, y, x+w, y+h, x, y+h]];
    else if(shape.type === 'diamond'){
      const cx = x+w/2, cy = y+h/2;
      segmentation = [[cx, cy-h/2, cx+w/2, cy, cx, cy+h/2, cx-w/2, cy]];
    } else if(shape.type === 'triangle'){
      segmentation = [[x+w/2, y, x+w, y+h, x, y+h]];
    } else if(shape.type === 'circle' || shape.type === 'ellipse'){
      const cx = x + w/2, cy = y + h/2;
      const rx = w/2, ry = h/2;
      segmentation = [[
        cx+rx, cy,
        cx+rx*Math.SQRT1_2, cy+ry*Math.SQRT1_2,
        cx, cy+ry,
        cx-rx*Math.SQRT1_2, cy+ry*Math.SQRT1_2,
        cx-rx, cy,
        cx-rx*Math.SQRT1_2, cy-ry*Math.SQRT1_2,
        cx, cy-ry,
        cx+rx*Math.SQRT1_2, cy-ry*Math.SQRT1_2
      ]];
    }
  } else if(shape.type === 'polygon' || shape.type === 'custom'){
    if(shape.points && shape.points.length>0){
      const flat = shape.points.flatMap(p => [p.x, p.y]);
      segmentation = [flat];
      const xs = shape.points.map(p=>p.x);
      const ys = shape.points.map(p=>p.y);
      const minX = Math.min(...xs), minY = Math.min(...ys);
      const maxX = Math.max(...xs), maxY = Math.max(...ys);
      bbox = [minX, minY, maxX-minX, maxY-minY];
    } else bbox = [0,0,0,0];
  } else bbox = [0,0,0,0];

  const area = bbox[2] * bbox[3];
  return {
    id: shape.id,
    image_id: imageId,
    shapeType:shape.type,
    category_id: props.annotationTask.id,
    bbox,
    featureName:"",
    status:1,
    featureId:"",
    contourId:"",
    area,
    segmentation,
    iscrowd: 0,
    attributes: {
      type: shape.type,
      color: shape.color,
      fill: shape.fill,
      shapeId: shape.id,
    }
  };
}

function emitCocoData(imageId: number){
  const annotations = shapesLocal.value.map(s => shapeToCoco(s, imageId));
  emit('update:coco', annotations);
}

// ---------- external methods ----------
function zoomToFit(){ if(!canvasRef.value||!imgRef.value) return; const rect=canvasRef.value.getBoundingClientRect(); state.scale=Math.min(rect.width/imgRef.value.naturalWidth,rect.height/imgRef.value.naturalHeight)*0.98; state.offsetX=0; state.offsetY=0; drawAll(); emit('scale-change', state.scale);}
function center(){ state.offsetX=0; state.offsetY=0; drawAll(); }
function reset(){ state.offsetX=0; state.offsetY=0; state.scale=1; state.rotation=0; state.isDrawing=false; state.isPanning=false; state.currentShape=null; state.hasCompletedAnnotation=false; state.isFormOpen=false; resizeCanvas(); emit('scale-change', state.scale);}
function rotate(deg:number){ state.rotation=deg; drawAll(); emit('scale-change', state.scale);}
function addShape(shape: Shape){ shapesLocal.value.push({...shape}); emit('update:shapes',[...shapesLocal.value]); drawAll();}
function clearShapes(){ shapesLocal.value=[]; state.hasCompletedAnnotation=false; emit('update:shapes',[...shapesLocal.value]); drawAll();}
function deleteShape(id:string){ shapesLocal.value=shapesLocal.value.filter(x=>x.id!==id); emit('update:shapes',[...shapesLocal.value]); drawAll();}
function highlightShape(id: string) {
  if (!shapesLocal.value || shapesLocal.value.length === 0) return;
  
  // 标记是否有任何形状被高亮
  let hasHighlighted = false;
  
  // 处理所有形状
  shapesLocal.value.forEach(shape => {
    // 检查是否是目标高亮形状
    const shouldHighlight = shape.id === id || shape.id === id;
    
    if (shouldHighlight) {
      // 如果需要高亮且尚未高亮
      if (!shape.highlighted) {
        // 保存原始样式
        shape._originalBorderWidth = shape.borderWidth;
        shape._originalBorderColor = shape.borderColor;
        
        // 应用高亮样式
        shape.borderColor = '#FFFF00'; // 亮黄色
        shape.borderWidth = Math.max(4, 5 / Math.max(0.0001, state.scale));
        shape.highlighted = true;
      }
      hasHighlighted = true;
    } else {
      // 如果不是目标形状，恢复原状
      if (shape.highlighted) {
        // 恢复原始样式
        if (shape._originalBorderWidth !== undefined) {
          shape.borderWidth = shape._originalBorderWidth;
        } else {
          // 如果没有保存原始值，使用默认值
          shape.borderWidth = Math.max(1, 2 / Math.max(0.0001, state.scale));
        }
        
        if (shape._originalBorderColor !== undefined) {
          shape.borderColor = shape._originalBorderColor;
        } else {
          // 如果没有保存原始值，使用默认颜色
          shape.borderColor = shape.color || props.brushColor || '#409EFF';
        }
        
        // 清理保存的原始值和高亮标记
        delete shape._originalBorderWidth;
        delete shape._originalBorderColor;
        delete shape.highlighted;
      }
    }
  });
  
  // 如果传入了id但没有找到匹配的形状，确保所有形状都恢复原状
  if (id && !hasHighlighted) {
    clearAllHighlights();
  }
  
  // 重绘画布
  drawAll();
  
  // 如果需要，更新外部状态
  emit('update:shapes', [...shapesLocal.value]);
}

// 新增辅助函数：清除所有高亮
function clearAllHighlights() {
  shapesLocal.value.forEach(shape => {
    // 恢复原始样式
    if (shape._originalBorderWidth !== undefined) {
      shape.borderWidth = shape._originalBorderWidth;
      delete shape._originalBorderWidth;
    }
    
    if (shape._originalBorderColor !== undefined) {
      shape.borderColor = shape._originalBorderColor;
      delete shape._originalBorderColor;
    }
    
    // 移除高亮标记
    delete shape.highlighted;
  });
}

// 在defineExpose中添加clearHighlights方法
defineExpose({ zoomToFit, center, reset, rotate, clearShapes, addShape, deleteShape, highlightShape, clearHighlights: clearAllHighlights });
// ---------- image load ----------
function onImageLoad(){ resizeCanvas(); drawAll(); emit('loaded'); }

// ---------- lifecycle ----------
onMounted(()=>{ window.addEventListener('resize', resizeCanvas); nextTick(resizeCanvas); if(props.shapes) shapesLocal.value = props.shapes.map(s=>({...s})); });
onBeforeUnmount(()=>{ window.removeEventListener('resize', resizeCanvas); });
</script>

<style scoped>
.image-box { width:100%; height:100%; position:relative; background:#fff; border-radius:8px; touch-action:none; }
canvas { width:100%; height:100%; display:block; }
</style>
