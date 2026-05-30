import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

// Two build targets share one source tree (ports + adapters keep feature code
// backend-agnostic):
//   spa   (default) -> offline single-file bundle in dist/        (local adapters)
//   cloud (--mode cloud) -> multi-file bundle in dist-cloud/       (cloud adapters)
// Use `vite build` for spa and `vite build --mode cloud` for cloud — the
// `--mode` flag works cross-platform (Windows cmd.exe can't do env-var prefixes).
export default defineConfig(({ mode }) => {
  const target = mode === "cloud" ? "cloud" : "spa";
  const isCloud = target === "cloud";

  return {
    plugins: [
      react(),
      tailwindcss(),
      // Single-file inlining only makes sense for the offline SPA distribution.
      ...(isCloud ? [] : [viteSingleFile({ removeViteModuleLoader: true })])
    ],
    define: {
      __VITE_TARGET__: JSON.stringify(target)
    },
    build: {
      outDir: isCloud ? "dist-cloud" : "dist",
      chunkSizeWarningLimit: 3000
    },
    server: {
      host: "127.0.0.1"
    },
    preview: {
      host: "127.0.0.1"
    }
  };
});
