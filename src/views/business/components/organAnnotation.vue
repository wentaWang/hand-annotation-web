<template>
  <div class="organ-card">
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

</template>

<script>
export default {

}
</script>

<style>

</style>