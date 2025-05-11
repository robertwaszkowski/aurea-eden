// import { defineConfig } from "vite";
// import path from "path";
// import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

// export default defineConfig({
//   plugins: [cssInjectedByJsPlugin()],

//   build: {
//     lib: {
//       entry: path.resolve(__dirname, "./lib/notations/BpmnDiagram.js"),
//       name: "Aurea EDEN",
//       fileName: (format) => `bpmn-diagram.${format}.js`,
//     },
//   },
// });

import { defineConfig } from "vite";
import path from "path";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [cssInjectedByJsPlugin()],

  build: {
    lib: {
      entry: path.resolve(__dirname, "./lib/notations/BpmnDiagram.js"),
      name: "AureaEDEN",
      fileName: (format) => `bpmn-diagram.${format}.js`,
      formats: ['es', 'umd']
    },
    rollupOptions: {
      external: ['three'],
      output: {
        globals: {
          three: 'THREE'
        }
      }
    },
    sourcemap: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false
      }
    }
  }
});