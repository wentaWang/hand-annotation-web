<template>
  <div class="content">
    <el-form :model="dataForm" :rules="rules" ref="dataFormRef" @keyup.enter="dataFormSubmitHandle()" label-width="120px">
      <el-form-item label="系统名称" prop="name">
        <el-input v-model="dataForm.name" placeholder="系统名称" clearable></el-input>
      </el-form-item>
      <el-form-item label="Logo" prop="logoUrl">
        <el-upload
          class="upload-demo"
          :action="app.uploadUrl"
          :on-preview="handlePreview"
          :on-remove="handleRemove"
          :on-change="(file, fileList) => logoChange(file, fileList)"
          :data="logoData"
          :file-list="logoFileList"
          limit="1"
          list-type="picture">
          <el-button size="small" type="primary">点击上传</el-button>
        </el-upload>
      </el-form-item>
      <el-form-item label="代理商设备免费广告数量（个/台）" prop="allowFreeProduct" label-width="250px">
        <el-input v-model="dataForm.allowFreeProduct" style="width:45%" placeholder="对于购买设备的商家，可免费上架产品的数量"></el-input>
      </el-form-item>
      <el-form-item label="产品广告上架费（元/产品）" prop="listFee" label-width="250px">
        <el-input v-model="dataForm.listFee" style="width:45%" placeholder="上架产品需支付的费用"></el-input>
      </el-form-item>
      <el-form-item label="广告修改是否扣费" prop="isEditProductFee" label-width="250px">
        <el-select v-model="dataForm.isEditProductFee" style="width:45%"  placeholder="审核通过后再修改广告，是否收费">
          <el-option label="是" value="Yes" />
          <el-option label="否" value="No" />
        </el-select>
      </el-form-item>
      <el-form-item label="修改产品收费（元/产品）" prop="editProductFee" label-width="250px">
        <el-input v-model="dataForm.editProductFee" style="width:45%" placeholder="审核通过后再修改广告需支付的费用"></el-input>
      </el-form-item>
      <div class="footer"> 
        <el-button @click="resetData()">清除</el-button>
        <el-button type="primary" @click="dataFormSubmitHandle()">{{ $t("confirm") }}</el-button>
      </div>
    </el-form>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, reactive, ref, computed } from "vue";
import type { UploadFile, UploadFiles } from 'element-plus';
import baseService from "@/service/baseService";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { createUploadHandler, handlePreview, handleRemove } from "@/utils/common";
const { t } = useI18n();
const emit = defineEmits(["refreshDataList"]);
import app from "@/constants/app";

const dataFormRef = ref();
const dataForm = reactive({
  id: "",
  name: "",
  coverImage: "",
  allowFreeProduct:0,
  listFee:50
});

const configForm = reactive({
  id:"",
  paramCode:"",
  paramType:"",
  paramValue:"",
  remark:""
});

const wPayFileList = ref<UploadFiles>([]);
const uploadWPayData = (file: UploadFile) => {
  return {
    businessId: dataForm.id,
    businessType: "system",
    businessProperty: 'wCode',
    filename: file.name,
    file,
  };
}

const zPayFileList = ref<UploadFiles>([]);
const uploadZPayData = (file: UploadFile) => {
  return {
    businessId: dataForm.id,
    businessType: "system",
    businessProperty: 'zCode',
    filename: file.name,
    file,
  };
}

const logoFileList = ref<UploadFiles>([]);
const logoData = (file: UploadFile) => {
  return {
    businessId: dataForm.id,
    businessType: "system",
    businessProperty: 'logo',
    filename: file.name,
    file,
  };
}

const rules = ref({
  name: [{ required: true, message: t("validate.required"), trigger: "blur" }],
});

const photos = computed(() => {
  return {
    wCode: wPayFileList.value.map(file => ({
      uid: file.uid,
      url: file.url || ''
    })),
    zCode: zPayFileList.value.map(file => ({
      uid: file.uid,
      url: file.url || ''
    })),
    logo: logoFileList.value.map(file => ({
      uid: file.uid,
      url: file.url || ''
    }))
  };
});

// 上传处理函数
const weChange = (file: UploadFile, fileList: UploadFiles) => {
  if (file.response) {
    createUploadHandler(file.response, file, fileList, wPayFileList, 1);
  }
};

const zhiChange = (file: UploadFile, fileList: UploadFiles) => {
  if (file.response) {
    createUploadHandler(file.response, file, fileList, zPayFileList, 1);
  }
};

const logoChange = (file: UploadFile, fileList: UploadFiles) => {
  if (file.response) {
    createUploadHandler(file.response, file, fileList, logoFileList, 1);
  }
};

onMounted(() => {
  getInfo();
});

const init = (id?: number) => {
  dataForm.id = "";

  if (dataFormRef.value) {
    dataFormRef.value.resetFields();
  }

  if (id) {
    getInfo(id);
  }
};

const getInfo = (id?: number) => {
  baseService.get("/sys/params/paramsCode/SYSTEM-CONFIG").then((res) => {
    if (res.data) {
       Object.assign(configForm, res.data);
      const parsedData = JSON.parse(configForm.paramValue);
      Object.assign(dataForm, parsedData);
      if (dataForm.coverImage) {
        const images = JSON.parse(dataForm.coverImage);
        wPayFileList.value = images.wCode || [];
        zPayFileList.value = images.zCode || [];
        logoFileList.value = images.logo || [];
      }
    }
  });
};

const dataFormSubmitHandle = () => {
  dataForm.coverImage = JSON.stringify(photos.value);
  const dto = {
    paramCode: "SYSTEM-CONFIG",
    paramValue: JSON.stringify(dataForm)
  };
  
  dataFormRef.value.validate((valid: boolean) => {
    if (!valid) {
      return false;
    }
    baseService.post("/sys/params/paramsCode", dto)
      .then(() => {
        ElMessage.success({
          message: "提交成功",
        });
      })
      .catch(error => {
        ElMessage.error(error.message || "操作失败");
      });
  });
};

const resetData = () => {
  Object.assign(dataForm, {
    id: "",
    name: "",
    coverImage: ""
  });

  wPayFileList.value = [];
  zPayFileList.value = [];
  logoFileList.value = [];

  if (dataFormRef.value) {
    dataFormRef.value.resetFields();
  }
};

defineExpose({
  init
});
</script>

<style scoped>
.content {
  margin: 10px auto;
  border: 1px #ddd solid;
  border-radius: 10px;
  padding: 10px;
  width: 50vw;
}
.footer {
  width: 100%;
  text-align: right;
}
</style>