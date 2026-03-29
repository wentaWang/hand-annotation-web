import { CacheToken } from "@/constants/cacheKey";
import { IObject } from "@/types/interface";
import { getSysRouteMap } from "@/router";
import baseService from "@/service/baseService";
import { removeCache } from "@/utils/cache";
import { mergeServerRoute } from "@/utils/router";
import { defineStore } from "pinia";

export const useAppStore = defineStore("useAppStore", {
  state: () => ({
    state: {
      appIsLogin: false, //是否登录
      appIsReady: false, //app数据是否就绪
      appIsRender: false, //app是否开始渲染内容
      permissions: [], //权限集合
      user: {
        createDate: "",
        deptId: "",
        deptName: "",
        email: "",
        gender: 0,
        avatar: "",
        id: "",
        mobile: "",
        postIdList: "",
        realName: "",
        roleIdList: "",
        status: 0,
        superAdmin: 0,
        tenantCode: "",
        username: "",
        userType:""
      }, //用户信息
      dicts: [], //字典
      routes: [], //最终的路由集合
      menus: [], //菜单集合
      routeToMeta: {}, //url对应标题meta信息
      tabs: [], //tab标签页集合
      activeTabName: "", //tab当前焦点页
      closedTabs: [] //存储已经关闭过的tab
    } as IObject
  }),
  actions: {
    updateState(data: IObject) {
      Object.keys(data).forEach((x: string) => {
        this.state[x] = data[x];
      });
    },
    async initApp() {
      try {
        // 逐步加载各项数据
        //const menus = await baseService.get("/sys/menu/nav"); // 菜单
       const menus = [];

        const permissions = await baseService.get("/sys/menu/permissions"); // 权限
        const user = await baseService.get("/sys/user/info"); // 用户信息
        const dicts = await baseService.get("/sys/dict/type/all"); // 字典

        // 检查用户信息是否加载成功
        if (user.code !== 0) {
          console.error("初始化用户数据错误", user.msg);
        }

        // 合并菜单路由
        const [routes, routeToMeta] = mergeServerRoute(menus || [], getSysRouteMap());
        // 更新状态
        this.updateState({
          permissions: permissions.data || [],
          user: user.data || {},
          dicts: dicts.data || [],
          routeToMeta: routeToMeta || {},
          menus: []
        });

        return routes;

      } catch (err) {
        console.error("初始化应用失败：", err);
        throw err;
      }
    },

    //退出
    logout() {
      removeCache(CacheToken, true);
      this.updateState({
        appIsLogin: false,
        permissions: [],
        user: {},
        dicts: [],
        menus: [],
        routes: [],
        tabs: [],
        activeTabName: ""
      });
    }
  }
});
