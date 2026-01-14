import { defineConfig } from "vite";
import path from "path";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import vue from "@vitejs/plugin-vue";
import fs from "fs";
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
      'process.env': {} // Fix: Define process.env for dependencies that might use it
    }
  };

  // 1. CONFIGURATION FOR GITHUB PAGES (Demo Site)
  if (mode === 'site') {
    return {
      ...commonConfig,
      base: './', // GitHub Pages usually requires relative paths or specific base URL
      build: {
        outDir: 'dist-site',
        minify: 'terser',
        // FIX: Do NOT externalize Vue here.
        // We want the demo site to bundle Vue so it works in the browser.
        rollupOptions: {
          // No external settings needed here
        }
      },
      plugins: [
        ...commonConfig.plugins,
        {
          name: 'vite-plugin-nojekyll',
          closeBundle() {
            // Create .nojekyll file to prevent GitHub Pages from ignoring files starting with _
            const noJekyllPath = path.resolve(__dirname, 'dist-site', '.nojekyll');
            fs.writeFileSync(noJekyllPath, '');
            console.log('Created .nojekyll file');
          }
        }
      ]
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
        },
        // FIX: Externalize Vue here!
        // This ensures your library package does not include Vue source code.
        rollupOptions: {
          external: ['vue'],
          output: {
            globals: {
              vue: 'Vue' // Required for UMD builds
            }
          }
        }
      }
    };
  }

  return {
    ...commonConfig,
  }
});