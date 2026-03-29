// vite.config.ts
import vue from "file:///D:/project/qipai-soft/hand-annotation-web/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import { resolve } from "path";
import { defineConfig, loadEnv } from "file:///D:/project/qipai-soft/hand-annotation-web/node_modules/vite/dist/node/index.js";
import { createHtmlPlugin } from "file:///D:/project/qipai-soft/hand-annotation-web/node_modules/vite-plugin-html/dist/index.mjs";
import tsconfigPaths from "file:///D:/project/qipai-soft/hand-annotation-web/node_modules/vite-tsconfig-paths/dist/index.mjs";
import { createSvgIconsPlugin } from "file:///D:/project/qipai-soft/hand-annotation-web/node_modules/vite-plugin-svg-icons/dist/index.mjs";
var __vite_injected_original_dirname = "D:\\project\\qipai-soft\\hand-annotation-web";
var prefix = `monaco-editor/esm/vs`;
var vite_config_default = (config) => {
  const mode = config.mode;
  return defineConfig({
    base: "./",
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
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxwcm9qZWN0XFxcXHFpcGFpLXNvZnRcXFxcaGFuZC1hbm5vdGF0aW9uLXdlYlwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxccHJvamVjdFxcXFxxaXBhaS1zb2Z0XFxcXGhhbmQtYW5ub3RhdGlvbi13ZWJcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L3Byb2plY3QvcWlwYWktc29mdC9oYW5kLWFubm90YXRpb24td2ViL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHZ1ZSBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tdnVlXCI7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSBcInBhdGhcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgbG9hZEVudiwgVXNlckNvbmZpZywgVXNlckNvbmZpZ0V4cG9ydCB9IGZyb20gXCJ2aXRlXCI7XG5pbXBvcnQgeyBjcmVhdGVIdG1sUGx1Z2luIH0gZnJvbSBcInZpdGUtcGx1Z2luLWh0bWxcIjtcbmltcG9ydCB0c2NvbmZpZ1BhdGhzIGZyb20gXCJ2aXRlLXRzY29uZmlnLXBhdGhzXCI7XG5pbXBvcnQgeyBjcmVhdGVTdmdJY29uc1BsdWdpbiB9IGZyb20gXCJ2aXRlLXBsdWdpbi1zdmctaWNvbnNcIjtcbmNvbnN0IHByZWZpeCA9IGBtb25hY28tZWRpdG9yL2VzbS92c2A7XG5cbmV4cG9ydCBkZWZhdWx0IChjb25maWc6IFVzZXJDb25maWcpOiBVc2VyQ29uZmlnRXhwb3J0ID0+IHtcbiAgY29uc3QgbW9kZSA9IGNvbmZpZy5tb2RlIGFzIHN0cmluZztcbiAgcmV0dXJuIGRlZmluZUNvbmZpZyh7XG4gICAgYmFzZTogXCIuL1wiLFxuICAgIG9wdGltaXplRGVwczoge1xuICAgICAgaW5jbHVkZTogW1xuICAgICAgICBgJHtwcmVmaXh9L2xhbmd1YWdlL2pzb24vanNvbi53b3JrZXJgLFxuICAgICAgICBgJHtwcmVmaXh9L2xhbmd1YWdlL2Nzcy9jc3Mud29ya2VyYCxcbiAgICAgICAgYCR7cHJlZml4fS9sYW5ndWFnZS9odG1sL2h0bWwud29ya2VyYCxcbiAgICAgICAgYCR7cHJlZml4fS9sYW5ndWFnZS90eXBlc2NyaXB0L3RzLndvcmtlcmAsXG4gICAgICAgIGAke3ByZWZpeH0vZWRpdG9yL2VkaXRvci53b3JrZXJgLFxuICAgICAgICBcIkAvLi4vbGliL3Zmb3JtL2Rlc2lnbmVyLnVtZC5qc1wiXG4gICAgICBdXG4gICAgfSxcbiAgICBwbHVnaW5zOiBbXG4gICAgICB2dWUoKSxcbiAgICAgIGNyZWF0ZUh0bWxQbHVnaW4oe1xuICAgICAgICBtaW5pZnk6IHRydWUsXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBcdTk3MDBcdTg5ODFcdTZDRThcdTUxNjUgaW5kZXguaHRtbCBlanMgXHU2QTIxXHU3MjQ4XHU3Njg0XHU2NTcwXHU2MzZFXG4gICAgICAgICAqL1xuICAgICAgICBpbmplY3Q6IHtcbiAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBhcGlVUkw6IGxvYWRFbnYobW9kZSwgcHJvY2Vzcy5jd2QoKSkuVklURV9BUFBfQVBJLFxuICAgICAgICAgICAgc29ja2V0VVJMOiBsb2FkRW52KG1vZGUsIHByb2Nlc3MuY3dkKCkpLlZJVEVfQVBQX1NPQ0tFVCxcbiAgICAgICAgICAgIHRpdGxlOiBcIlwiXG4gICAgICAgICAgfSxcbiAgICAgICAgICB0YWdzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIGluamVjdFRvOiBcImJvZHktcHJlcGVuZFwiLFxuICAgICAgICAgICAgICB0YWc6IFwiZGl2XCIsXG4gICAgICAgICAgICAgIGF0dHJzOiB7XG4gICAgICAgICAgICAgICAgaWQ6IFwidGFnXCJcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfVxuICAgICAgfSksXG4gICAgICB0c2NvbmZpZ1BhdGhzKCksXG4gICAgICBjcmVhdGVTdmdJY29uc1BsdWdpbih7XG4gICAgICAgIGljb25EaXJzOiBbcmVzb2x2ZShfX2Rpcm5hbWUsIFwic3JjL2Fzc2V0cy9pY29ucy9zdmdcIildLFxuICAgICAgICBzeW1ib2xJZDogXCJpY29uLVtkaXJdLVtuYW1lXVwiXG4gICAgICB9KVxuICAgIF0sXG4gICAgY3NzOiB7XG4gICAgICBwcmVwcm9jZXNzb3JPcHRpb25zOiB7XG4gICAgICAgIHNjc3M6IHtcbiAgICAgICAgICBhcGk6IFwibW9kZXJuLWNvbXBpbGVyXCJcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgYnVpbGQ6IHtcbiAgICAgIGNodW5rU2l6ZVdhcm5pbmdMaW1pdDogMTAyNCxcbiAgICAgIGNvbW1vbmpzT3B0aW9uczoge1xuICAgICAgICBpbmNsdWRlOiAvbm9kZV9tb2R1bGVzfGxpYi9cbiAgICAgIH0sXG4gICAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICAgIG91dHB1dDoge1xuICAgICAgICAgIG1hbnVhbENodW5rczoge1xuICAgICAgICAgICAgbW9uYWNvZWRpdG9yOiBbXCJtb25hY28tZWRpdG9yXCJdLFxuICAgICAgICAgICAgcXVpbGw6IFtcInF1aWxsXCJdLFxuICAgICAgICAgICAgbG9kYXNoOiBbXCJsb2Rhc2hcIl0sXG4gICAgICAgICAgICBsaWI6IFtcInNvcnRhYmxlanNcIiwgXCJ2eGUtdGFibGVcIiwgXCJ4ZS11dGlsc1wiXSxcbiAgICAgICAgICAgIHZsaWI6IFtcInZ1ZVwiLCBcInZ1ZS1yb3V0ZXJcIiwgXCJ2dWUtaTE4blwiLCBcImVsZW1lbnQtcGx1c1wiXVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgcmVzb2x2ZToge1xuICAgICAgYWxpYXM6IHtcbiAgICAgICAgLy8gXHU5MTREXHU3RjZFXHU1MjJCXHU1NDBEXG4gICAgICAgIFwiQFwiOiByZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSxcbiAgICAgICAgXCJ2dWUtaTE4blwiOiBcInZ1ZS1pMThuL2Rpc3QvdnVlLWkxOG4uY2pzLmpzXCJcbiAgICAgIH1cbiAgICB9LFxuICAgIHNlcnZlcjoge1xuICAgICAgb3BlbjogZmFsc2UsIC8vIFx1ODFFQVx1NTJBOFx1NTQyRlx1NTJBOFx1NkQ0Rlx1ODlDOFx1NTY2OFxuICAgICAgaG9zdDogXCIwLjAuMC4wXCIsIC8vIGxvY2FsaG9zdFxuICAgICAgcG9ydDogODAwMSwgLy8gXHU3QUVGXHU1M0UzXHU1M0Y3XG4gICAgICBobXI6IHsgb3ZlcmxheTogZmFsc2UgfSxcbiAgICAgIHByb3h5OiB7XG4gICAgICAgICcvZmlsZXMnOiB7XG4gICAgICAgICAgdGFyZ2V0OiAnaHR0cDovL2xvY2FsaG9zdDo4MDgwJywgLy8gXHU1NDBFXHU3QUVGXHU1NzMwXHU1NzQwXG4gICAgICAgICAgcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2ZpbGVzLywgJycpLFxuICAgICAgICB9XG4gICAgfVxuICAgIH1cbiAgfSk7XG59O1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFxVCxPQUFPLFNBQVM7QUFDclUsU0FBUyxlQUFlO0FBQ3hCLFNBQVMsY0FBYyxlQUE2QztBQUNwRSxTQUFTLHdCQUF3QjtBQUNqQyxPQUFPLG1CQUFtQjtBQUMxQixTQUFTLDRCQUE0QjtBQUxyQyxJQUFNLG1DQUFtQztBQU16QyxJQUFNLFNBQVM7QUFFZixJQUFPLHNCQUFRLENBQUMsV0FBeUM7QUFDdkQsUUFBTSxPQUFPLE9BQU87QUFDcEIsU0FBTyxhQUFhO0FBQUEsSUFDbEIsTUFBTTtBQUFBLElBQ04sY0FBYztBQUFBLE1BQ1osU0FBUztBQUFBLFFBQ1AsR0FBRyxNQUFNO0FBQUEsUUFDVCxHQUFHLE1BQU07QUFBQSxRQUNULEdBQUcsTUFBTTtBQUFBLFFBQ1QsR0FBRyxNQUFNO0FBQUEsUUFDVCxHQUFHLE1BQU07QUFBQSxRQUNUO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLFNBQVM7QUFBQSxNQUNQLElBQUk7QUFBQSxNQUNKLGlCQUFpQjtBQUFBLFFBQ2YsUUFBUTtBQUFBO0FBQUE7QUFBQTtBQUFBLFFBSVIsUUFBUTtBQUFBLFVBQ04sTUFBTTtBQUFBLFlBQ0osUUFBUSxRQUFRLE1BQU0sUUFBUSxJQUFJLENBQUMsRUFBRTtBQUFBLFlBQ3JDLFdBQVcsUUFBUSxNQUFNLFFBQVEsSUFBSSxDQUFDLEVBQUU7QUFBQSxZQUN4QyxPQUFPO0FBQUEsVUFDVDtBQUFBLFVBQ0EsTUFBTTtBQUFBLFlBQ0o7QUFBQSxjQUNFLFVBQVU7QUFBQSxjQUNWLEtBQUs7QUFBQSxjQUNMLE9BQU87QUFBQSxnQkFDTCxJQUFJO0FBQUEsY0FDTjtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0YsQ0FBQztBQUFBLE1BQ0QsY0FBYztBQUFBLE1BQ2QscUJBQXFCO0FBQUEsUUFDbkIsVUFBVSxDQUFDLFFBQVEsa0NBQVcsc0JBQXNCLENBQUM7QUFBQSxRQUNyRCxVQUFVO0FBQUEsTUFDWixDQUFDO0FBQUEsSUFDSDtBQUFBLElBQ0EsS0FBSztBQUFBLE1BQ0gscUJBQXFCO0FBQUEsUUFDbkIsTUFBTTtBQUFBLFVBQ0osS0FBSztBQUFBLFFBQ1A7QUFBQSxNQUNGO0FBQUEsSUFDRjtBQUFBLElBQ0EsT0FBTztBQUFBLE1BQ0wsdUJBQXVCO0FBQUEsTUFDdkIsaUJBQWlCO0FBQUEsUUFDZixTQUFTO0FBQUEsTUFDWDtBQUFBLE1BQ0EsZUFBZTtBQUFBLFFBQ2IsUUFBUTtBQUFBLFVBQ04sY0FBYztBQUFBLFlBQ1osY0FBYyxDQUFDLGVBQWU7QUFBQSxZQUM5QixPQUFPLENBQUMsT0FBTztBQUFBLFlBQ2YsUUFBUSxDQUFDLFFBQVE7QUFBQSxZQUNqQixLQUFLLENBQUMsY0FBYyxhQUFhLFVBQVU7QUFBQSxZQUMzQyxNQUFNLENBQUMsT0FBTyxjQUFjLFlBQVksY0FBYztBQUFBLFVBQ3hEO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxTQUFTO0FBQUEsTUFDUCxPQUFPO0FBQUE7QUFBQSxRQUVMLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsUUFDL0IsWUFBWTtBQUFBLE1BQ2Q7QUFBQSxJQUNGO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixNQUFNO0FBQUE7QUFBQSxNQUNOLE1BQU07QUFBQTtBQUFBLE1BQ04sTUFBTTtBQUFBO0FBQUEsTUFDTixLQUFLLEVBQUUsU0FBUyxNQUFNO0FBQUEsTUFDdEIsT0FBTztBQUFBLFFBQ0wsVUFBVTtBQUFBLFVBQ1IsUUFBUTtBQUFBO0FBQUEsVUFDUixTQUFTLENBQUMsU0FBUyxLQUFLLFFBQVEsWUFBWSxFQUFFO0FBQUEsUUFDaEQ7QUFBQSxNQUNKO0FBQUEsSUFDQTtBQUFBLEVBQ0YsQ0FBQztBQUNIOyIsCiAgIm5hbWVzIjogW10KfQo=
