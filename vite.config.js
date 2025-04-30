import { defineConfig } from "vite";
import path from "path";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [cssInjectedByJsPlugin()],

  build: {
    lib: {
      entry: path.resolve(__dirname, "./lib/aurea-eden.js"),
      name: "Aurea EDEN",
      fileName: (format) => `aurea-eden.${format}.js`,
    },
  },
});
