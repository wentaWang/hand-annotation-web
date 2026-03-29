import Layout from "@/layout/layout.vue";
import Error from "@/views/error.vue";
import { RouteRecordRaw } from "vue-router";
import Login from "@/views/login.vue";
import Iframe from "@/views/iframe.vue";

/**
 * 框架基础路由
 */
const routes: Array<RouteRecordRaw> = [
  { path: "/", redirect: "/home" },
  {
    path: "/home",
    component: () => import("@/views/home.vue"),
    meta: { title: "ui.router.pageHome", icon: "icon-dashboard" }
  },
  {
    path: "/user",
    component: () => import("@/views/sys/user.vue"),
    meta: { 
      title: "医生管理",
      icon: "icon-user",
      hideForUserTypes: ["physician"] 
    }
  },
  {
    path: "/annotation",
    component: () => import("@/views/business/annotation.vue"),
    meta: { title: "标注", icon: "icon-edit", hideForUserTypes: ["admin","superAdmin"]  },
  },
  //   {
  //   path: "/comment",
  //   component: () => import("@/views/business/comment.vue"),
  //   meta: { title: "批注", icon: "icon-message" , hideForUserTypes: ["admin","superAdmin"] }
  // },
  {
    path: "/record",
    component: () => import("@/views/business/record.vue"),
    meta: { title: "任务记录", icon: "icon-time", hideForUserTypes: ["admin","superAdmin"] }
  },
  {
    path: "/organ",
    component: () => import("@/views/business/organ.vue"),
    meta: { title: "器官管理", icon: "icon-time" }
  },
  {
    path: "/login",
    component: Login,
    meta: { title: "ui.router.pageLogin", isNavigationMenu: false }
  },
  {
    path: "/user/password",
    component: () => import("@/views/sys/user-update-password.vue"),
    meta: { title: "ui.user.links.editPassword", requiresAuth: true, isNavigationMenu: false }
  },
  {
    path: "/iframe/:id?",
    component: Iframe,
    meta: { title: "iframe", isNavigationMenu: false }
  },
  {
    path: "/error",
    name: "error",
    component: Error,
    meta: { title: "ui.router.pageError", isNavigationMenu: false }
  }
];

export const errorRoute: Array<RouteRecordRaw> = [
  {
    path: "/:path(.*)*",
    redirect: { path: "/error", query: { to: 404 }, replace: true },
    meta: { isNavigationMenu: false }
  }
];

export default routes;
