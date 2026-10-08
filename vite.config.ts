import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";
import { pwa } from "./scripts/vite-pwa";

// base "./" — сборка открывается и на GitHub Pages (подпуть), и на любом статическом сервере.
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), pwa()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  server: { host: true },
  build: { chunkSizeWarningLimit: 1500 },
});
