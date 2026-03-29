import baseService from "@/service/baseService";

export const getPhysicianStat = () => {
  return  baseService.get(`/physician/stat`);
}

export const getPhysicianStatRecord = (data) => {
  return  baseService.post(`/physician/statistic/records`,data);
}

 
export const getPhysicianList = (data) => {
  return  baseService.get(`/sys/user/physician/list`);
}

// 获取医生代办任务列表
export const getPhysicianTaskList = (limit) => {
  return  baseService.get(`/physician/annotate/list?limit=`+limit);
}

export const getPhysicianTask = (taskId) => {
  return  baseService.get(`/physician/annotate/info?taskId=`+taskId);
}

// 获取医生代办任务列表
export const createPhysicianTask = () => {
  return  baseService.post("/physician/annotate/create",{});
}

export const savePhysicianTask = (taskId) => {
  return  baseService.post("physician/task/save/"+taskId,{});
}

export const checkPhysicianTask = (taskId) => {
  return  baseService.get("physician/task/status/"+taskId);
}


// 获取器官列表
export const getOrganList = () => {
  return  baseService.get("/organ/tree?organId=");
}

// 创建器官
export const createOrgan = (data) => {
  return  baseService.post("/organ/create",data);
}
// 删除器官
export const deleteOrgan = (organId) => {
  return  baseService.post("/organ/delete/"+organId);
}

// 创建特征点
export const createFeature = (data) => {
  return  baseService.post("/feature/create",data);
}
// 删除特征点
export const deleteFeature = (organId) => {
  return  baseService.post("/feature/delete/"+organId);
}
// 创建图片的标注列表
export const createAnnotation= (taskId,handType) => {
  const type = handType=='right'?1:0
  return  baseService.post(`/task/create/${taskId}/${type}`);
}

// 获取图片的标注列表
export const annotationList = (taskId,handType) => {
  const type = handType=='right'?1:0
  return  baseService.get(`/task/${taskId}/${type}`);
}

export const updateTaskStatus = (taskId,handType,annotationId,status) => {
  let data = {
    task_id:taskId,
    annotation_id:annotationId,
    hand_type:handType=='right'?1:0,
    status:status
  }
  return  baseService.post(`/task/updateTaskStatus`,data);
}


export const submitAnnotationTask = (data) => {
  return baseService.post('/task/submit/annotation',data)
}

export const submitFeatureTask = (data) => {
  return baseService.post('/feature/update/contour/info',data)
}


export const deleteOrganAnnotation = (id) => {
  return baseService.get(`/feature/delete/contour/${id}`)
}