// vite.config.ts
import vue from "file:///D:/code/aiKang/annotation/hand-annotation-web/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import { resolve } from "path";
import { defineConfig, loadEnv } from "file:///D:/code/aiKang/annotation/hand-annotation-web/node_modules/vite/dist/node/index.js";
import { createHtmlPlugin } from "file:///D:/code/aiKang/annotation/hand-annotation-web/node_modules/vite-plugin-html/dist/index.mjs";
import tsconfigPaths from "file:///D:/code/aiKang/annotation/hand-annotation-web/node_modules/vite-tsconfig-paths/dist/index.mjs";
import { createSvgIconsPlugin } from "file:///D:/code/aiKang/annotation/hand-annotation-web/node_modules/vite-plugin-svg-icons/dist/index.mjs";
var __vite_injected_original_dirname = "D:\\code\\aiKang\\annotation\\hand-annotation-web";
var prefix = `monaco-editor/esm/vs`;
var vite_config_default = (config) => {
  const mode = config.mode;
  return defineConfig({
    base: "/app/",
    optimizeDeps: {
      include: [
        `${prefix}/language/json/json.worker`,
        `${prefix}/language/css/css.worker`,
        `${prefix}/language/html/html.worker`,
        `${prefix}/language/typescript/ts.worker`,
        `${prefix}/editor/editor.worker`,
        "@/../lib/vform/designer.umd.js"
      ]
    },
    plugins: [
      vue(),
      createHtmlPlugin({
        minify: true,
        /**
         * 需要注入 index.html ejs 模版的数据
         */
        inject: {
          data: {
            apiURL: loadEnv(mode, process.cwd()).VITE_APP_API,
            socketURL: loadEnv(mode, process.cwd()).VITE_APP_SOCKET,
            title: ""
          },
          tags: [
            {
              injectTo: "body-prepend",
              tag: "div",
              attrs: {
                id: "tag"
              }
            }
          ]
        }
      }),
      tsconfigPaths(),
      createSvgIconsPlugin({
        iconDirs: [resolve(__vite_injected_original_dirname, "src/assets/icons/svg")],
        symbolId: "icon-[dir]-[name]"
      })
    ],
    css: {
      preprocessorOptions: {
        scss: {
          api: "modern-compiler"
        }
      }
    },
    build: {
      chunkSizeWarningLimit: 1024,
      commonjsOptions: {
        include: /node_modules|lib/
      },
      rollupOptions: {
        output: {
          manualChunks: {
            monacoeditor: ["monaco-editor"],
            quill: ["quill"],
            lodash: ["lodash"],
            lib: ["sortablejs", "vxe-table", "xe-utils"],
            vlib: ["vue", "vue-router", "vue-i18n", "element-plus"]
          }
        }
      }
    },
    resolve: {
      alias: {
        // 配置别名
        "@": resolve(__vite_injected_original_dirname, "./src"),
        "vue-i18n": "vue-i18n/dist/vue-i18n.cjs.js"
      }
    },
    server: {
      open: false,
      // 自动启动浏览器
      host: "0.0.0.0",
      // localhost
      port: 8001,
      // 端口号
      hmr: { overlay: false },
      proxy: {
        "/files": {
          target: "http://localhost:8080",
          // 后端地址
          rewrite: (path) => path.replace(/^\/files/, "")
        }
      }
    }
  });
};
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxjb2RlXFxcXGFpS2FuZ1xcXFxhbm5vdGF0aW9uXFxcXGhhbmQtYW5ub3RhdGlvbi13ZWJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXGNvZGVcXFxcYWlLYW5nXFxcXGFubm90YXRpb25cXFxcaGFuZC1hbm5vdGF0aW9uLXdlYlxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovY29kZS9haUthbmcvYW5ub3RhdGlvbi9oYW5kLWFubm90YXRpb24td2ViL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHZ1ZSBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tdnVlXCI7XHJcbmltcG9ydCB7IHJlc29sdmUgfSBmcm9tIFwicGF0aFwiO1xyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYsIFVzZXJDb25maWcsIFVzZXJDb25maWdFeHBvcnQgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgeyBjcmVhdGVIdG1sUGx1Z2luIH0gZnJvbSBcInZpdGUtcGx1Z2luLWh0bWxcIjtcclxuaW1wb3J0IHRzY29uZmlnUGF0aHMgZnJvbSBcInZpdGUtdHNjb25maWctcGF0aHNcIjtcclxuaW1wb3J0IHsgY3JlYXRlU3ZnSWNvbnNQbHVnaW4gfSBmcm9tIFwidml0ZS1wbHVnaW4tc3ZnLWljb25zXCI7XHJcbmNvbnN0IHByZWZpeCA9IGBtb25hY28tZWRpdG9yL2VzbS92c2A7XHJcblxyXG5leHBvcnQgZGVmYXVsdCAoY29uZmlnOiBVc2VyQ29uZmlnKTogVXNlckNvbmZpZ0V4cG9ydCA9PiB7XHJcbiAgY29uc3QgbW9kZSA9IGNvbmZpZy5tb2RlIGFzIHN0cmluZztcclxuICByZXR1cm4gZGVmaW5lQ29uZmlnKHtcclxuICAgIGJhc2U6IFwiL2FwcC9cIixcclxuICAgIG9wdGltaXplRGVwczoge1xyXG4gICAgICBpbmNsdWRlOiBbXHJcbiAgICAgICAgYCR7cHJlZml4fS9sYW5ndWFnZS9qc29uL2pzb24ud29ya2VyYCxcclxuICAgICAgICBgJHtwcmVmaXh9L2xhbmd1YWdlL2Nzcy9jc3Mud29ya2VyYCxcclxuICAgICAgICBgJHtwcmVmaXh9L2xhbmd1YWdlL2h0bWwvaHRtbC53b3JrZXJgLFxyXG4gICAgICAgIGAke3ByZWZpeH0vbGFuZ3VhZ2UvdHlwZXNjcmlwdC90cy53b3JrZXJgLFxyXG4gICAgICAgIGAke3ByZWZpeH0vZWRpdG9yL2VkaXRvci53b3JrZXJgLFxyXG4gICAgICAgIFwiQC8uLi9saWIvdmZvcm0vZGVzaWduZXIudW1kLmpzXCJcclxuICAgICAgXVxyXG4gICAgfSxcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgdnVlKCksXHJcbiAgICAgIGNyZWF0ZUh0bWxQbHVnaW4oe1xyXG4gICAgICAgIG1pbmlmeTogdHJ1ZSxcclxuICAgICAgICAvKipcclxuICAgICAgICAgKiBcdTk3MDBcdTg5ODFcdTZDRThcdTUxNjUgaW5kZXguaHRtbCBlanMgXHU2QTIxXHU3MjQ4XHU3Njg0XHU2NTcwXHU2MzZFXHJcbiAgICAgICAgICovXHJcbiAgICAgICAgaW5qZWN0OiB7XHJcbiAgICAgICAgICBkYXRhOiB7XHJcbiAgICAgICAgICAgIGFwaVVSTDogbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpKS5WSVRFX0FQUF9BUEksXHJcbiAgICAgICAgICAgIHNvY2tldFVSTDogbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpKS5WSVRFX0FQUF9TT0NLRVQsXHJcbiAgICAgICAgICAgIHRpdGxlOiBcIlwiXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAgdGFnczogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgaW5qZWN0VG86IFwiYm9keS1wcmVwZW5kXCIsXHJcbiAgICAgICAgICAgICAgdGFnOiBcImRpdlwiLFxyXG4gICAgICAgICAgICAgIGF0dHJzOiB7XHJcbiAgICAgICAgICAgICAgICBpZDogXCJ0YWdcIlxyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgXVxyXG4gICAgICAgIH1cclxuICAgICAgfSksXHJcbiAgICAgIHRzY29uZmlnUGF0aHMoKSxcclxuICAgICAgY3JlYXRlU3ZnSWNvbnNQbHVnaW4oe1xyXG4gICAgICAgIGljb25EaXJzOiBbcmVzb2x2ZShfX2Rpcm5hbWUsIFwic3JjL2Fzc2V0cy9pY29ucy9zdmdcIildLFxyXG4gICAgICAgIHN5bWJvbElkOiBcImljb24tW2Rpcl0tW25hbWVdXCJcclxuICAgICAgfSlcclxuICAgIF0sXHJcbiAgICBjc3M6IHtcclxuICAgICAgcHJlcHJvY2Vzc29yT3B0aW9uczoge1xyXG4gICAgICAgIHNjc3M6IHtcclxuICAgICAgICAgIGFwaTogXCJtb2Rlcm4tY29tcGlsZXJcIlxyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfSxcclxuICAgIGJ1aWxkOiB7XHJcbiAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAyNCxcclxuICAgICAgY29tbW9uanNPcHRpb25zOiB7XHJcbiAgICAgICAgaW5jbHVkZTogL25vZGVfbW9kdWxlc3xsaWIvXHJcbiAgICAgIH0sXHJcbiAgICAgIHJvbGx1cE9wdGlvbnM6IHtcclxuICAgICAgICBvdXRwdXQ6IHtcclxuICAgICAgICAgIG1hbnVhbENodW5rczoge1xyXG4gICAgICAgICAgICBtb25hY29lZGl0b3I6IFtcIm1vbmFjby1lZGl0b3JcIl0sXHJcbiAgICAgICAgICAgIHF1aWxsOiBbXCJxdWlsbFwiXSxcclxuICAgICAgICAgICAgbG9kYXNoOiBbXCJsb2Rhc2hcIl0sXHJcbiAgICAgICAgICAgIGxpYjogW1wic29ydGFibGVqc1wiLCBcInZ4ZS10YWJsZVwiLCBcInhlLXV0aWxzXCJdLFxyXG4gICAgICAgICAgICB2bGliOiBbXCJ2dWVcIiwgXCJ2dWUtcm91dGVyXCIsIFwidnVlLWkxOG5cIiwgXCJlbGVtZW50LXBsdXNcIl1cclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICByZXNvbHZlOiB7XHJcbiAgICAgIGFsaWFzOiB7XHJcbiAgICAgICAgLy8gXHU5MTREXHU3RjZFXHU1MjJCXHU1NDBEXHJcbiAgICAgICAgXCJAXCI6IHJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxyXG4gICAgICAgIFwidnVlLWkxOG5cIjogXCJ2dWUtaTE4bi9kaXN0L3Z1ZS1pMThuLmNqcy5qc1wiXHJcbiAgICAgIH1cclxuICAgIH0sXHJcbiAgICBzZXJ2ZXI6IHtcclxuICAgICAgb3BlbjogZmFsc2UsIC8vIFx1ODFFQVx1NTJBOFx1NTQyRlx1NTJBOFx1NkQ0Rlx1ODlDOFx1NTY2OFxyXG4gICAgICBob3N0OiBcIjAuMC4wLjBcIiwgLy8gbG9jYWxob3N0XHJcbiAgICAgIHBvcnQ6IDgwMDEsIC8vIFx1N0FFRlx1NTNFM1x1NTNGN1xyXG4gICAgICBobXI6IHsgb3ZlcmxheTogZmFsc2UgfSxcclxuICAgICAgcHJveHk6IHtcclxuICAgICAgICAnL2ZpbGVzJzoge1xyXG4gICAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo4MDgwJywgLy8gXHU1NDBFXHU3QUVGXHU1NzMwXHU1NzQwXHJcbiAgICAgICAgICByZXdyaXRlOiAocGF0aCkgPT4gcGF0aC5yZXBsYWNlKC9eXFwvZmlsZXMvLCAnJyksXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgfVxyXG4gIH0pO1xyXG59O1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQW1VLE9BQU8sU0FBUztBQUNuVixTQUFTLGVBQWU7QUFDeEIsU0FBUyxjQUFjLGVBQTZDO0FBQ3BFLFNBQVMsd0JBQXdCO0FBQ2pDLE9BQU8sbUJBQW1CO0FBQzFCLFNBQVMsNEJB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
