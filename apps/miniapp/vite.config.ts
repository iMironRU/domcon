import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Mini App деплоится отдельно (или на /miniapp/ той же Pages).
export default defineConfig({
  plugins: [react()],
  base: "./",
});
