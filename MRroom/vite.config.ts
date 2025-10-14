import { optimizeGLTF } from "@iwsdk/vite-plugin-gltf-optimizer";
import { injectIWER } from "@iwsdk/vite-plugin-iwer";
import {
  discoverComponents,
  generateGLXF,
} from "@iwsdk/vite-plugin-metaspatial";
import { compileUIKit } from "@iwsdk/vite-plugin-uikitml";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";

export default defineConfig({
  plugins: [
    // HTTPS証明書生成（WebXR開発に必須）
    mkcert(),

    // React Fast Refresh
    react({
      // HMRの最適化
      fastRefresh: true,
    }),

    // IWER: WebXRエミュレーション
    injectIWER({
      device: "metaQuest3",
      activation: "localhost",
      verbose: true,
      // Synthetic Environment Module（仮想環境）
      sem: {
        defaultScene: "living_room",
      },
    }),

    // コンポーネント自動検出
    discoverComponents({
      outputDir: "metaspatial/components",
      include: /\.(js|ts|jsx|tsx)$/,
      exclude: /node_modules/,
      verbose: false,
    }),

    // GLXF生成（Meta Spatial用）
    generateGLXF({
      metaSpatialDir: "metaspatial",
      outputDir: "public/glxf",
      verbose: false,
      enableWatcher: true, // ファイル変更を監視
    }),

    // UIKitMLコンパイル
    compileUIKit({
      sourceDir: "ui",
      outputDir: "public/ui",
      verbose: true,
    }),

    // GLTFモデル最適化
    optimizeGLTF({
      level: "medium",
    }),
  ],

  // 開発サーバー設定
  server: {
    host: "0.0.0.0",
    port: 8081,
    open: true,
    // HMRの設定
    hmr: {
      overlay: true, // エラーオーバーレイを表示
    },
  },

  // ビルド設定
  build: {
    outDir: "dist",
    sourcemap: process.env.NODE_ENV !== "production",
    target: "esnext",
    rollupOptions: {
      input: "./index.html",
    },
    // チャンク分割の最適化
    chunkSizeWarningLimit: 1000,
  },

  // ESBuild設定
  esbuild: {
    target: "esnext",
  },

  // 依存関係の最適化
  optimizeDeps: {
    exclude: ["@babylonjs/havok"],
    esbuildOptions: {
      target: "esnext",
    },
  },

  publicDir: "public",
  base: "./",
});
