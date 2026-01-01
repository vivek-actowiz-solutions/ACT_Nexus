// vite.config.mjs
import { defineConfig, loadEnv } from "file:///C:/Users/vivek.panakhaniya/Desktop/ACT_API_HUB/Frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/vivek.panakhaniya/Desktop/ACT_API_HUB/Frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import jsconfigPaths from "file:///C:/Users/vivek.panakhaniya/Desktop/ACT_API_HUB/Frontend/node_modules/vite-jsconfig-paths/dist/index.mjs";
var vite_config_default = defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const API_URL = `${env.VITE_APP_BASE_NAME}`;
  const PORT = `${"3000"}`;
  return {
    server: {
      // this ensures that the browser opens upon server start
      open: true,
      // this sets a default port to 3000
      port: PORT,
      // this sets the host to 0.0.0.0
      host: true
    },
    define: {
      global: "window"
    },
    resolve: {
      alias: [
        // { find: '', replacement: path.resolve(__dirname, 'src') },
        // {
        //   find: /^~(.+)/,
        //   replacement: path.join(process.cwd(), 'node_modules/$1')
        // },
        // {
        //   find: /^src(.+)/,
        //   replacement: path.join(process.cwd(), 'src/$1')
        // }
        // {
        //   find: 'assets',
        //   replacement: path.join(process.cwd(), 'src/assets')
        // },
      ]
    },
    css: {
      preprocessorOptions: {
        scss: {
          charset: false
        },
        less: {
          charset: false
        }
      },
      charset: false,
      postcss: {
        plugins: [
          {
            postcssPlugin: "internal:charset-removal",
            AtRule: {
              charset: (atRule) => {
                if (atRule.name === "charset") {
                  atRule.remove();
                }
              }
            }
          }
        ]
      }
    },
    base: API_URL,
    plugins: [react(), jsconfigPaths()]
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubWpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcdml2ZWsucGFuYWtoYW5peWFcXFxcRGVza3RvcFxcXFxBQ1RfQVBJX0hVQlxcXFxGcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcdml2ZWsucGFuYWtoYW5peWFcXFxcRGVza3RvcFxcXFxBQ1RfQVBJX0hVQlxcXFxGcm9udGVuZFxcXFx2aXRlLmNvbmZpZy5tanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL3ZpdmVrLnBhbmFraGFuaXlhL0Rlc2t0b3AvQUNUX0FQSV9IVUIvRnJvbnRlbmQvdml0ZS5jb25maWcubWpzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnLCBsb2FkRW52IH0gZnJvbSAndml0ZSc7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnO1xuaW1wb3J0IGpzY29uZmlnUGF0aHMgZnJvbSAndml0ZS1qc2NvbmZpZy1wYXRocyc7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZygoeyBtb2RlIH0pID0+IHtcbiAgY29uc3QgZW52ID0gbG9hZEVudihtb2RlLCBwcm9jZXNzLmN3ZCgpLCAnJyk7XG4gIGNvbnN0IEFQSV9VUkwgPSBgJHtlbnYuVklURV9BUFBfQkFTRV9OQU1FfWA7XG4gIGNvbnN0IFBPUlQgPSBgJHsnMzAwMCd9YDtcblxuICByZXR1cm4ge1xuICAgIHNlcnZlcjoge1xuICAgICAgLy8gdGhpcyBlbnN1cmVzIHRoYXQgdGhlIGJyb3dzZXIgb3BlbnMgdXBvbiBzZXJ2ZXIgc3RhcnRcbiAgICAgIG9wZW46IHRydWUsXG4gICAgICAvLyB0aGlzIHNldHMgYSBkZWZhdWx0IHBvcnQgdG8gMzAwMFxuICAgICAgcG9ydDogUE9SVCxcbiAgICAgIC8vIHRoaXMgc2V0cyB0aGUgaG9zdCB0byAwLjAuMC4wXG4gICAgICBob3N0OiB0cnVlXG4gICAgfSxcbiAgICBkZWZpbmU6IHtcbiAgICAgIGdsb2JhbDogJ3dpbmRvdydcbiAgICB9LFxuICAgIHJlc29sdmU6IHtcbiAgICAgIGFsaWFzOiBbXG4gICAgICAgIC8vIHsgZmluZDogJycsIHJlcGxhY2VtZW50OiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAnc3JjJykgfSxcbiAgICAgICAgLy8ge1xuICAgICAgICAvLyAgIGZpbmQ6IC9efiguKykvLFxuICAgICAgICAvLyAgIHJlcGxhY2VtZW50OiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ25vZGVfbW9kdWxlcy8kMScpXG4gICAgICAgIC8vIH0sXG4gICAgICAgIC8vIHtcbiAgICAgICAgLy8gICBmaW5kOiAvXnNyYyguKykvLFxuICAgICAgICAvLyAgIHJlcGxhY2VtZW50OiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3NyYy8kMScpXG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8ge1xuICAgICAgICAvLyAgIGZpbmQ6ICdhc3NldHMnLFxuICAgICAgICAvLyAgIHJlcGxhY2VtZW50OiBwYXRoLmpvaW4ocHJvY2Vzcy5jd2QoKSwgJ3NyYy9hc3NldHMnKVxuICAgICAgICAvLyB9LFxuICAgICAgXVxuICAgIH0sXG4gICAgY3NzOiB7XG4gICAgICBwcmVwcm9jZXNzb3JPcHRpb25zOiB7XG4gICAgICAgIHNjc3M6IHtcbiAgICAgICAgICBjaGFyc2V0OiBmYWxzZVxuICAgICAgICB9LFxuICAgICAgICBsZXNzOiB7XG4gICAgICAgICAgY2hhcnNldDogZmFsc2VcbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgIGNoYXJzZXQ6IGZhbHNlLFxuICAgICAgcG9zdGNzczoge1xuICAgICAgICBwbHVnaW5zOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgcG9zdGNzc1BsdWdpbjogJ2ludGVybmFsOmNoYXJzZXQtcmVtb3ZhbCcsXG4gICAgICAgICAgICBBdFJ1bGU6IHtcbiAgICAgICAgICAgICAgY2hhcnNldDogKGF0UnVsZSkgPT4ge1xuICAgICAgICAgICAgICAgIGlmIChhdFJ1bGUubmFtZSA9PT0gJ2NoYXJzZXQnKSB7XG4gICAgICAgICAgICAgICAgICBhdFJ1bGUucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9XG4gICAgfSxcbiAgICBiYXNlOiBBUElfVVJMLFxuICAgIHBsdWdpbnM6IFtyZWFjdCgpLCBqc2NvbmZpZ1BhdGhzKCldXG4gIH07XG59KTtcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBcVcsU0FBUyxjQUFjLGVBQWU7QUFDM1ksT0FBTyxXQUFXO0FBQ2xCLE9BQU8sbUJBQW1CO0FBRTFCLElBQU8sc0JBQVEsYUFBYSxDQUFDLEVBQUUsS0FBSyxNQUFNO0FBQ3hDLFFBQU0sTUFBTSxRQUFRLE1BQU0sUUFBUSxJQUFJLEdBQUcsRUFBRTtBQUMzQyxRQUFNLFVBQVUsR0FBRyxJQUFJLGtCQUFrQjtBQUN6QyxRQUFNLE9BQU8sR0FBRyxNQUFNO0FBRXRCLFNBQU87QUFBQSxJQUNMLFFBQVE7QUFBQTtBQUFBLE1BRU4sTUFBTTtBQUFBO0FBQUEsTUFFTixNQUFNO0FBQUE7QUFBQSxNQUVOLE1BQU07QUFBQSxJQUNSO0FBQUEsSUFDQSxRQUFRO0FBQUEsTUFDTixRQUFRO0FBQUEsSUFDVjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ1AsT0FBTztBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsTUFjUDtBQUFBLElBQ0Y7QUFBQSxJQUNBLEtBQUs7QUFBQSxNQUNILHFCQUFxQjtBQUFBLFFBQ25CLE1BQU07QUFBQSxVQUNKLFNBQVM7QUFBQSxRQUNYO0FBQUEsUUFDQSxNQUFNO0FBQUEsVUFDSixTQUFTO0FBQUEsUUFDWDtBQUFBLE1BQ0Y7QUFBQSxNQUNBLFNBQVM7QUFBQSxNQUNULFNBQVM7QUFBQSxRQUNQLFNBQVM7QUFBQSxVQUNQO0FBQUEsWUFDRSxlQUFlO0FBQUEsWUFDZixRQUFRO0FBQUEsY0FDTixTQUFTLENBQUMsV0FBVztBQUNuQixvQkFBSSxPQUFPLFNBQVMsV0FBVztBQUM3Qix5QkFBTyxPQUFPO0FBQUEsZ0JBQ2hCO0FBQUEsY0FDRjtBQUFBLFlBQ0Y7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsSUFDQSxNQUFNO0FBQUEsSUFDTixTQUFTLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQztBQUFBLEVBQ3BDO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
