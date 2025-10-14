import type { World } from "@iwsdk/core";
import { create } from "zustand";

// XRセッション状態の型定義
export enum XRState {
  NonImmersive = "non-immersive",
  ImmersiveVR = "immersive-vr",
  ImmersiveAR = "immersive-ar",
}

// ストアの型定義
interface XRStore {
  // 状態
  world: World | null;
  xrState: XRState;
  isInitialized: boolean;
  isLoading: boolean;
  error: string | null;

  // ヒットテスト関連
  hitTestResults: XRHitTestResult[];
  reticleVisible: boolean;

  // インタラクション状態
  selectedObjectId: string | null;
  hoveredObjectId: string | null;

  // アクション
  setWorld: (world: World) => void;
  setXRState: (state: XRState) => void;
  setInitialized: (initialized: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // ヒットテストアクション
  setHitTestResults: (results: XRHitTestResult[]) => void;
  setReticleVisible: (visible: boolean) => void;

  // インタラクションアクション
  selectObject: (id: string | null) => void;
  hoverObject: (id: string | null) => void;

  // XR制御
  enterXR: () => Promise<void>;
  exitXR: () => Promise<void>;

  // リセット
  reset: () => void;
}

// 初期状態
const initialState = {
  world: null,
  xrState: XRState.NonImmersive,
  isInitialized: false,
  isLoading: false,
  error: null,
  hitTestResults: [],
  reticleVisible: false,
  selectedObjectId: null,
  hoveredObjectId: null,
};

// Zustand store作成
export const useXRStore = create<XRStore>((set, get) => ({
  ...initialState,

  // World設定
  setWorld: (world) => {
    set({ world, isInitialized: true });
  },

  // XR状態設定
  setXRState: (xrState) => set({ xrState }),

  // 初期化状態設定
  setInitialized: (isInitialized) => set({ isInitialized }),

  // ローディング状態設定
  setLoading: (isLoading) => set({ isLoading }),

  // エラー設定
  setError: (error) => set({ error }),

  // ヒットテスト結果設定
  setHitTestResults: (hitTestResults) => set({ hitTestResults }),

  // レティクル表示設定
  setReticleVisible: (reticleVisible) => set({ reticleVisible }),

  // オブジェクト選択
  selectObject: (selectedObjectId) => set({ selectedObjectId }),

  // オブジェクトホバー
  hoverObject: (hoveredObjectId) => set({ hoveredObjectId }),

  // XRに入る
  enterXR: async () => {
    const { world } = get();
    if (!world) {
      set({ error: "World not initialized" });
      return;
    }

    try {
      set({ isLoading: true, error: null });
      await world.launchXR();
      set({ xrState: XRState.ImmersiveVR, isLoading: false });
    } catch (error) {
      console.error("Failed to enter XR:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to enter XR",
        isLoading: false,
      });
    }
  },

  // XRから出る
  exitXR: async () => {
    const { world } = get();
    if (!world) return;

    try {
      set({ isLoading: true, error: null });
      await world.exitXR();
      set({ xrState: XRState.NonImmersive, isLoading: false });
    } catch (error) {
      console.error("Failed to exit XR:", error);
      set({
        error: error instanceof Error ? error.message : "Failed to exit XR",
        isLoading: false,
      });
    }
  },

  // リセット
  reset: () => set(initialState),
}));

// HMR対応
if (import.meta.hot) {
  import.meta.hot.accept();

  // HMR時にストアの状態を保持
  import.meta.hot.dispose(() => {
    const state = useXRStore.getState();
    // クリーンアップ処理
    if (state.world && state.xrState !== XRState.NonImmersive) {
      state.world.exitXR().catch(console.error);
    }
  });
}
