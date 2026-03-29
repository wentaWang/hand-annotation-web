<template>
  <el-select
    v-if="mode === 'multiple' || mode === 'tags' || mode === 'combobox'"
    ref="select"
    v-bind="getAttrs"
    v-model="selectedValue" 
    :size="size"
    filterable
    :disabled="disabled"
    class="entity_select"
    :multiple="mode === 'multiple'"
    :collapse-tags-tooltip="true"
    :placeholder="placeholder"
    :collapse-tags="mode === 'multiple'"
    @change="changeOptions"
    clearable
  >
    <el-option
      v-for="item in entityData"
      :key="item[fieldConfig.idFieldChild]"
      :label="getTagName(item)"
      :value="item[fieldConfig.idFieldChild]"
      @click.native="handleFetch(item)"
    />
  </el-select>

  <el-select
    v-else
    ref="select"
    v-bind="getAttrs"
     v-model="selectedValue" 
    :size="size"
    filterable
    :disabled="disabled"
    class="entity_select"
    :placeholder="placeholder"
    @change="changeOption"
    clearable
  >
    <el-option
      v-for="item in entityData"
      :key="`${item[fieldConfig.idField]}`"
      :label="getTagName(item)"
      :value="item[fieldConfig.idFieldChild]"
    />
  </el-select>
</template>

<script lang="ts">
import { defineComponent, PropType, ref,unref, reactive,computed, onMounted, watch,useAttrs } from 'vue';
import baseService from "@/service/baseService";
type FieldItem = { 
  idField: string; 
  nameField: string | number | boolean; 
  idFieldChild: string; 
  nameFieldChild: string | number | boolean; 
  otherField: string; 
  showName: string | number | boolean; 
  showNameSpace: string | number | boolean;  
  disabled?: boolean 
};

export default defineComponent({
  name: 'EntitySelect',
  inheritAttrs: false,
  props: {
    value: {
      type: [String, Number, Boolean, Array] as PropType<string | number | boolean | any[]>,
    },
    queryUrl: String,
    queryParams: {
      type: Object,
      default: () => ({}),
    },
    field: String,
    config: {
      type: Object as PropType<FieldItem>,
      default: () => ({}),
    },
    size: {
      type: String,
      default: 'default',
    },
    disabled: Boolean,
    mode: String,
    placeholder:String,
  },

  emits: ['on-change', 'on-delete', 'on-options', 'getValue'],


  setup(props, { emit })  {
    const entityData = ref<any>([]);
    const otherFieldName = ref<string[]>([]);
    const select = ref(null);
    const currentOption = ref({});
    const selectedValue = ref(props.value); // 初始化选中值
    watch(
      () => props.value,
      (newVal) => {
        selectedValue.value = newVal; // 同步父组件传递的 value
      }
    );
    const attrs = useAttrs();
    const getAttrs = computed(() => {
			return {
				...unref(attrs),
				...(props),
			};
		});
    
    let fieldConfig = reactive<FieldItem>({
      idField: '',
      nameField: '',
      idFieldChild: '',
      nameFieldChild: '',
      otherField: '',
      showName: '',
      showNameSpace: '',
    });


    onMounted(() => {
      // console.log(select.value)
    });

    watch(
      () => props.queryParams,
      async () => {
        refresh();
      },
      {
        immediate: true,
        deep: true,
      }
    );

    function init() {
      fieldConfig.idField = props.config?.idField;
      fieldConfig.nameField = props.config?.nameField;
      fieldConfig.idFieldChild = props.config?.idFieldChild;
      fieldConfig.nameFieldChild = props.config?.nameFieldChild;
      fieldConfig.otherField = props.config?.otherField;
      fieldConfig.showName = props.config?.showName;
      fieldConfig.showNameSpace = props.config?.showNameSpace;
      if (props.config?.otherField) {
        otherFieldName.value = props.config.otherField.split(',');
      }
      if (fieldConfig.showName === undefined) {
        fieldConfig.showName = fieldConfig.nameFieldChild;
      }
    }
    init();

    function refresh() {
      baseService.get(props.queryUrl, props.queryParams).then((res) => {
        entityData.value = res.data;
        emit('on-options', res.data);
      });
    }

    const changeOption = (value) => {
      if (Array.isArray(entityData.value) && entityData.value.length > 0) {
        if (value && typeof value != 'undefined') {
          currentOption.value = entityData.value.filter((item) => {
            return item[fieldConfig.idFieldChild] === value;
          })[0];
        } else {
          currentOption.value = {};
        }
        
        let submitData = {};
        if (otherFieldName.value.length > 0) {
          for (let i = 0; i < otherFieldName.value.length; i++) {
            if (otherFieldName.value[i].indexOf('@') !== -1) {
              const index = otherFieldName.value[i].indexOf('@');
              let key1 = otherFieldName.value[i].substring(0, index);
              let key2 = otherFieldName.value[i].substring(index + 1);
              submitData[key1] = currentOption.value[key2];
            } else {
              submitData[otherFieldName.value[i]] = currentOption.value[otherFieldName.value[i]];
            }
          }
        }
        submitData[fieldConfig.idField] = currentOption.value[fieldConfig.idFieldChild];
        submitData[fieldConfig.nameField] = currentOption.value[fieldConfig.nameFieldChild];
        emit('on-change', submitData);
        selectedValue.value = value; // 更新本地值
        emit('update:value', value); // 同步父组件
      }
    };

    function getTagName(item) {
      let tagName = '';
      if (fieldConfig.showName) {
        let showName = fieldConfig.showName.split(',');
        for (let i = 0; i < showName.length; i++) {
          if (tagName) {
            tagName += fieldConfig.showNameSpace ? fieldConfig.showNameSpace : ' ';
          }
          tagName += item[showName[i]];
        }
      }
      return tagName;
    }

    function handleFetch(item) {
      let submitData = {};
      if (otherFieldName.value.length > 0) {
        for (let i = 0; i < otherFieldName.value.length; i++) {
          if (otherFieldName.value[i].indexOf('@') !== -1) {
            const index = otherFieldName.value[i].indexOf('@');
            let key1 = otherFieldName.value[i].substring(0, index);
            let key2 = otherFieldName.value[i].substring(index + 1);
            submitData[key1] = item[key2];
          } else {
            submitData[otherFieldName.value[i]] = item[otherFieldName.value[i]];
          }
        }
      }
      submitData[fieldConfig.idField] = item[fieldConfig.idFieldChild];
      submitData[fieldConfig.nameField] = item[fieldConfig.nameFieldChild];
      emit('on-change', submitData);
    }

    function changeOptions(val) {
      let names = [];
      let valToNames = [];
      if (Array.isArray(entityData.value) && entityData.value.length > 0) {
        if (Array.isArray(val) && val.length > 0) {
          entityData.value.forEach(item => {
            if (val.includes(item[fieldConfig.idFieldChild])) {
              let valToName = {};
              valToName[fieldConfig.idFieldChild] = item[fieldConfig.idFieldChild];
              valToName[fieldConfig.nameFieldChild] = item[fieldConfig.nameFieldChild];
              names.push(item[fieldConfig.nameFieldChild]);
              valToNames.push(valToName);
            }
          });
        }
      }
      emit('getValue', val, names, valToNames);
      selectedValue.value = val; 
      emit('update:value', val); 
    }

    const filterMethod = (query) => {
      return entityData.value.filter(item => {
        const tagName = getTagName(item).toLowerCase();
        return tagName.includes(query.toLowerCase());
      });
    };

    return { 
      select, 
      entityData, 
      getTagName, 
      fieldConfig, 
      handleFetch, 
      refresh, 
      selectedValue,
      filterMethod, 
      changeOption, 
      changeOptions 
    };
  },
});
</script>

<style lang="less" scoped>
.entity_select {
  min-width: 100px;
}
</style>