import { defineConfig } from "vitest/config";
import { transformWithEsbuild } from "vite";
import { fileURLToPath } from "node:url";

// Components are .js files with JSX (Next compiles them). For render tests
// (tests/*Render.test.js) they are compiled here the same way; everything else is untouched.
const jsxInJs = {
  name: "gavana-jsx-in-js",
  enforce: "pre",
  async transform(code, id) {
    const file = id.split("?")[0];
    if (!/\/(components|app)\/.*\.js$/.test(file) && !/\/tests\/.*Render\.test\.js$/.test(file)) return null;
    return transformWithEsbuild(code, file, { loader: "jsx", jsx: "automatic" });
  },
};

export default defineConfig({
  plugins: [jsxInJs],
  esbuild: { jsx: "automatic" },
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.{js,ts}"],
  },
});
