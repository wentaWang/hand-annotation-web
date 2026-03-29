<script lang="ts">
import app from "@/constants/app";
import { EMitt, EThemeSetting } from "@/constants/enum";
import emits from "@/utils/emits";
import { getThemeConfigCacheByKey } from "@/utils/theme";
import { defineComponent, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useAppStore } from "@/store";
import Tabs from "./tabs.vue";

export default defineComponent({
  name: "View",
  components: { Tabs },
  setup() {
    const store = useAppStore();
    const route = useRoute();

    // 每个路由对应的唯一 key
    const routerKeys = ref<Record<string, number>>({});

    const state = reactive({
      openTabsPage: getThemeConfigCacheByKey(EThemeSetting.OpenTabsPage),
    });

    /** tab 设置开关变化 */
    emits.on(EMitt.OnSetThemeTabsPage, (vl) => {
      state.openTabsPage = vl;
    });

    /** 外部调用刷新当前页面 */
    emits.on(EMitt.OnReloadTabPage, () => {
      routerKeys.value[store.state.activeTabName] = Date.now();
    });

    /** 切换标签时，更新渲染 key */
    watch(
      () => store.state.activeTabName,
      (newVal) => {
        if (!newVal) return;
        routerKeys.value[newVal] = Date.now();
      },
      { immediate: true }
    );

    return {
      store,
      state,
      routerKeys,
    };
  },
});
</script>

<template>
  <!-- 顶部标签页 -->
  <!-- <tabs
    v-if="state.openTabsPage"
    :tabs="store.state.tabs"
    :activeTabName="store.state.activeTabName"
  /> -->

  <!-- 页面内容 -->
  <div class="rr-view-ctx">
          <router-view v-slot="{ Component }">
        <keep-alive>
          <component
            :is="Component"
            :key="routerKeys[store.state.activeTabName] || store.state.activeTabName"
          />
        </keep-alive>
      </router-view>
  </div>
</template>

<style scoped>
.rr-view-ctx {
  padding:2px !important;
  margin:0 !important;
}
.rr-view-ctx-card {
  min-height:100vh;
}
</style>
