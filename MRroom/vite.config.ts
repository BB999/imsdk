import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";

export default defineConfig({
  plugins: [
    // HTTPS証明書生成（WebXR開発に必須）
    mkcert(),
    // React Fast Refresh
    react(),
  ],

  // 開発サーバー設定
  server: {
    host: "0.0.0.0",
    port: 8081,
    open: true,
  },

  // ビルド設定
  build: {
    outDir: "dist",
    sourcemap: true,
    target: "esnext",
  },

  publicDir: "public",
  base: "./",
});
