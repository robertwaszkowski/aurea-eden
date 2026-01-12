import { defineConfig } from "vite";
import path from "path";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import vue from "@vitejs/plugin-vue";
import pkg from './package.json';

export default defineConfig(({ mode }) => {
  const commonConfig = {
    plugins: [vue()],
    resolve: {
      alias: {
        'vue': 'vue/dist/vue.esm-bundler.js'
      }
    },
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false,
      __APP_VERSION__: JSON.stringify(pkg.version),
    }
  };

  // 1. CONFIGURATION FOR GITHUB PAGES (Demo Site)
  if (mode === 'site') {
    return {
      ...commonConfig,
      base: './', // Vital for GH Pages
      build: {
        outDir: 'dist-site', // Separate folder for the site
        minify: 'terser',
        rollupOptions: {
          external: ['vue'],
          output: {
            paths: {
              vue: 'https://unpkg.com/vue@3.5.25/dist/vue.esm-browser.js'
            }
          }
        }
      }
    };
  }

  // 2. CONFIGURATION FOR NPM (Library)
  if (mode === 'lib') {
    return {
      ...commonConfig,
      plugins: [vue(), cssInjectedByJsPlugin()],
      build: {
        lib: {
          entry: path.resolve(__dirname, "./lib/notations/BpmnDiagram.js"),
          name: "AureaEDEN",
          fileName: (format) => `bpmn-diagram.${format}.js`,
          formats: ['es', 'umd']
        },
        sourcemap: true,
        minify: 'terser',
        terserOptions: {
          compress: { drop_console: false }
        }
      }
    };
  }

  return {
    ...commonConfig,
    // if you need to serve a specific html file for dev, you can do it here
    // server: {
    //   open: '/index.html'
    // }
  }
});
