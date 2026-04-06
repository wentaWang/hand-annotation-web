<template>
  <div class="organ-tree-container">
    <div class="tree-header">
      <h3>器官与特征点管理</h3>
      <div class="header-actions">
        <el-button type="primary" @click="addOrgan" :icon="Plus">
          添加器官
        </el-button>
        <el-button @click="refreshTree" :icon="Refresh">
          刷新数据
        </el-button>
      </div>
    </div>
    
    <div class="tree-content">
      <el-tree
        ref="organTreeRef"
        :data="organTreeData"
        :props="defaultProps"
        node-key="id"
        :default-expand-all="true"
        :expand-on-click-node="false"
        highlight-current
        @node-click="handleNodeClick"
      >
        <template #default="{ node, data }">
          <div class="custom-tree-node">
            <div class="node-label">
              <el-icon v-if="!data.organ_id" class="organ-icon">
                <FolderOpened />
              </el-icon>
              <el-icon v-else class="feature-icon">
                <Location />
              </el-icon>
              <span class="name">{{ data.name }}</span>
              <span class="description" v-if="data.description">({{ data.description }})</span>
            </div>
            
            <div class="node-actions">
              <el-button
                v-if="!data.organ_id"
                type="primary"
                link
                size="small"
                @click.stop="addFeaturePoint(data)"
                :icon="Plus"
                title="添加特征点"
              >
              </el-button>
              <el-button
                type="primary"
                v-if="currentUserId == data.physician_id"
                link
                size="small"
                @click.stop="editItem(data)"
                :icon="Edit"
                title="编辑"
              >
              </el-button>
              
              <el-button
                type="danger"
                link
                size="small"
                 v-if="currentUserId == data.physician_id"
                @click.stop="deleteItem(data)"
                :icon="Delete"
                title="删除"
              >
              </el-button>
            </div>
          </div>
        </template>
      </el-tree>
    </div>
    
    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="resetForm"
    >
      <el-form
        ref="itemFormRef"
        :model="itemForm"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item :label="itemForm.organ_id ? '特征点名称' : '器官名称'" prop="name">
          <el-input 
            v-model="itemForm.name" 
            :placeholder="`请输入${itemForm.organ_id ? '特征点' : '器官'}名称`" 
          />
        </el-form-item>
        
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="itemForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入描述信息"
          />
        </el-form-item>
        
        <el-form-item v-if="itemForm.organ_id" label="所属器官" prop="organId">
          <el-select
            v-model="itemForm.organ_id"
            placeholder="请选择所属器官"
            style="width: 100%"
            :disabled="isEditMode"
          >
            <el-option
              v-for="organ in organList"
              :key="organ.id"
              :label="organ.name"
              :value="organ.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitForm">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useAppStore } from "@/store";
import {getOrganList,createOrgan,deleteOrgan,createFeature,deleteFeature} from './data.api'
const store = useAppStore();
import {
  Plus,
  Refresh,
  Edit,
  Delete,
  FolderOpened,
  Location
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
 const currentUserId= store.state.user.id; 
// 树组件引用
const organTreeRef = ref()
const itemFormRef = ref()

// 树形数据结构
const organTreeData = ref([])

// 表单相关数据
const dialogVisible = ref(false)
const dialogTitle = ref('')
const isEditMode = ref(false)

// 表单数据
const itemForm = reactive({
  id: '',
  name: '',
  description: '',
  organ_id: '' // 为空表示器官，有值表示特征点
})

// 表单验证规则
const formRules = reactive({
  name: [
    { required: true, message: '请输入名称', trigger: 'blur' },
    { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
  ],
})

// 树配置
const defaultProps = {
  children: 'children',
  label: 'name'
}

// 计算属性：获取所有器官列表（用于特征点选择所属器官）
const organList = computed(() => {
  return organTreeData.value.map(item => ({
    id: item.id,
    name: item.name,
    physicianId:item.physician_id
  }))
})

// 模拟API获取数据
const fetchOrganTreeData = async () => {
  try {
     const response = await getOrganList();
     organTreeData.value = response.data.feature_root;
    ElMessage.success('数据加载成功')
  } catch (error) {
    console.error('获取数据失败:', error)
    ElMessage.error('数据加载失败')
  }
}

// 节点点击事件
const handleNodeClick = (data) => {
  console.log('点击节点:', data)
}

// 添加器官
const addOrgan = () => {
  resetForm()
  dialogTitle.value = '添加器官'
  isEditMode.value = false
  itemForm.organ_id = ''
  dialogVisible.value = true
}

// 添加特征点
const addFeaturePoint = (organData) => {
  resetForm()
  dialogTitle.value = '添加特征点'
  isEditMode.value = false
  itemForm.organ_id = organData.id
  dialogVisible.value = true
}

// 编辑项
const editItem = (data) => {
  resetForm()
  dialogTitle.value = data.organ_id ? '编辑特征点' : '编辑器官'
  isEditMode.value = true
  
  // 填充表单数据
  Object.assign(itemForm, {
    id: data.id,
    name: data.name,
    description: data.description || '',
    organ_id: data.organ_id || ''
  })
  
  dialogVisible.value = true
}

// 删除项
const deleteItem = (data) => {
  const isOrgan = !data.organ_id
  const itemType = isOrgan ? '器官' : '特征点'
  
  ElMessageBox.confirm(
    `确定要删除【${data.name}】${itemType}吗？${
      isOrgan && data.children && data.children.length > 0
        ? '删除器官将同时删除其下所有特征点！'
        : ''
    }`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      if (isOrgan) {
        // 删除器官
         await deleteOrgan(data.id)
        const index = organTreeData.value.findIndex(item => item.id === data.id)
        if (index !== -1) {
          organTreeData.value.splice(index, 1)
        }
      } else {
          await deleteFeature(data.id)
        // 删除特征点
        organTreeData.value.forEach(organ => {
          if (organ.children) {
            const childIndex = organ.children.findIndex(child => child.id === data.id)
            if (childIndex !== -1) {
              organ.children.splice(childIndex, 1)
            }
          }
        })
      }
      
      ElMessage.success('删除成功')
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  }).catch(() => {
    // 取消删除
  })
}

// 提交表单
const submitForm = async () => {
  if (!itemFormRef.value) return
  
  await itemFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (isEditMode.value) {
          if (!itemForm.organ_id) {
            await createOrgan(itemForm);
            const index = organTreeData.value.findIndex(item => item.id === itemForm.id)
            if (index !== -1) {
              organTreeData.value[index] = {
                ...organTreeData.value[index],
                name: itemForm.name,
                description: itemForm.description
              }
            }
          } else {
              console.log("itemForm",itemForm)
           // await createFeature(itemForm)
            organTreeData.value.forEach(organ => {
              if (organ.children) {
                const childIndex = organ.children.findIndex(child => child.id === itemForm.id)
                if (childIndex !== -1) {
                  organ.children[childIndex] = {
                    ...organ.children[childIndex],
                    name: itemForm.name,
                    description: itemForm.description
                  }
                }
              }
            })
          }
          
          ElMessage.success('更新成功')
        } else {
          const newItem = {
            id: "",
            name: itemForm.name,
            description: itemForm.description,
            physician_id:currentUserId
          }
          
          if (!itemForm.organ_id) {
            const {code,data} = await createOrgan(itemForm);
            // 新增器官
            organTreeData.value.push({
              ...newItem,
              id:data.organ_id,
              children: []
            })
            
          } else {
            // 新增特征点
            const {code,data} = await createFeature(itemForm)
            
            organTreeData.value.forEach(organ => {
              if (organ.id === itemForm.organ_id) {
                if (!organ.children) {
                  organ.children = []
                }
                newItem.organ_id = data.organ_id
                newItem.id = data.feature_id
                organ.children.push(newItem)
              }
            })
          }
          
          ElMessage.success('添加成功')
        }
        
        dialogVisible.value = false
      } catch (error) {
        console.error('保存失败:', error)
        ElMessage.error('保存失败')
      }
    }
  })
}

// 重置表单
const resetForm = () => {
  if (itemFormRef.value) {
    itemFormRef.value.resetFields()
  }
  
  Object.assign(itemForm, {
    id: '',
    name: '',
    description: '',
    organ_id: ''
  })
}

// 刷新树数据
const refreshTree = () => {
  fetchOrganTreeData()
}

// 组件挂载时加载数据
onMounted(() => {
  fetchOrganTreeData()
})
</script>

<style scoped>
.organ-tree-container {
  padding: 20px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

.tree-header h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.tree-content {
  min-height: 400px;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 14px;
  padding-right: 8px;
}

.node-label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.organ-icon {
  color: #409eff;
}

.feature-icon {
  color: #67c23a;
}

.name {
  font-weight: 500;
  color: #303133;
}

.description {
  color: #909399;
  font-size: 12px;
  margin-left: 4px;
}

.node-actions {
  display: flex;
  gap: 4px;
}

:deep(.el-tree-node__content) {
  height: 42px;
  margin: 2px 0;
}

:deep(.el-tree) {
  background-color: #f8f9fa;
  padding: 10px;
  border-radius: 6px;
}

:deep(.el-tree--highlight-current .el-tree-node.is-current > .el-tree-node__content) {
  background-color: #ecf5ff;
  border-radius: 4px;
}
</style>