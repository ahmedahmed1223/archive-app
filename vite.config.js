import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile({ removeViteModuleLoader: true })],
  build: {
    chunkSizeWarningLimit: 3000
  },
  server: {
    host: "127.0.0.1"
  },
  preview: {
    host: "127.0.0.1"
  }
});
