
import type { UploadFile, UploadFiles } from 'element-plus';
import { ElMessage } from 'element-plus'
import { ref, type Ref } from 'vue'
import baseService from "@/service/baseService";

/**
 * 通用文件上传成功处理
 * @param response 接口返回数据
 * @param file 当前上传成功的文件
 * @param fileList 当前上传组件全部文件列表
 * @param targetList 需要更新的响应式文件列表（Ref）
 * @param maxCount 最大允许文件数（默认不限制）
 */
export const createUploadHandler = (
  response: any,
  file: UploadFile,
  fileList: UploadFiles,
  targetList: Ref<UploadFiles>,
  maxCount?: number
) => {
  if (response.code == 0) {
    // 只使用服务器返回的URL
    file.url = response.data.url || response.data.fileUrl;
    file.status = 'success';
    if (maxCount && fileList.length > maxCount) {
      targetList.value = fileList.slice(-maxCount);
    } else {
      targetList.value = fileList;
    }
  }
};
/**
 * 文件预览处理
 * @param file 要预览的文件
 */
export const handlePreview = (file: UploadFile) => {
  if (file.url?.startsWith('blob:')) {
    // Blob URL直接在新窗口打开
    window.open(file.url)
  } else if (file.url) {
    // 网络图片使用浏览器默认预览
    const image = new Image()
    image.src = file.url
    const w = window.open('')
    w?.document.write(image.outerHTML)
  } else {
    ElMessage.warning('该文件不可预览')
  }
}

/**
 * 文件删除处理
 * @param file 要删除的文件
 * @param fileList 当前文件列表
 * @param targetList 目标响应式列表
 */
export const handleRemove = (
  file: UploadFile,
  fileList: UploadFiles,
  targetList: Ref<UploadFiles>
) => {
  // 释放Blob URL内存
  if (file.url?.startsWith('blob:')) {
    URL.revokeObjectURL(file.url)
  }
  
  // 同步到目标列表
  targetList.value = fileList
  
  // 实际业务中可在此调用删除接口
   baseService.delete(`/sys/file/${file.uid}`,{}).then(res => {
    if(res) {
      targetList.value = targetList.value.filter(item => item.uid != file.uid); 
    }
  })
}

