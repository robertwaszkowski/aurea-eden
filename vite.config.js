import { defineConfig } from "vite";
import path from "path";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig(({ mode }) => {
  // 1. CONFIGURATION FOR GITHUB PAGES (Demo Site)
  if (mode === 'site') {
    return {
      base: './', // Vital for GH Pages
      build: {
        outDir: 'dist-site', // Separate folder for the site
        minify: 'terser',
      }
    };
  }

  // 2. CONFIGURATION FOR NPM (Library)
  return {
    plugins: [cssInjectedByJsPlugin()],
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
});
