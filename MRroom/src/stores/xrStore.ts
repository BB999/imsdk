import { create } from "zustand";
import * as THREE from "three";

// XRセッション状態の型定義
export enum XRState {
  NonImmersive = "non-immersive",
  ImmersiveVR = "immersive-vr",
  ImmersiveAR = "immersive-ar",
}

// ストアの型定義
interface XRStore {
  // 状態
  renderer: THREE.WebGLRenderer | null;
  scene: THREE.Scene | null;
  camera: THREE.PerspectiveCamera | null;
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
  setRenderer: (renderer: THREE.WebGLRenderer) => void;
  setScene: (scene: THREE.Scene) => void;
  setCamera: (camera: THREE.PerspectiveCamera) => void;
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

  // リセット
  reset: () => void;
}

// 初期状態
const initialState = {
  renderer: null,
  scene: null,
  camera: null,
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
export const useXRStore = create<XRStore>((set) => ({
  ...initialState,

  // Renderer設定
  setRenderer: (renderer) => {
    set({ renderer, isInitialized: true });
  },

  // Scene設定
  setScene: (scene) => set({ scene }),

  // Camera設定
  setCamera: (camera) => set({ camera }),

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

  // リセット
  reset: () => set(initialState),
}));
