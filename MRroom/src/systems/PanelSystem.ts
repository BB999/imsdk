import {
  createSystem,
  PanelUI,
  PanelDocument,
  eq,
  VisibilityState,
  UIKitDocument,
  UIKit,
} from "@iwsdk/core";
import { useXRStore, XRState } from "../stores/xrStore";

/**
 * PanelSystem
 *
 * 空間UIパネルを管理するシステム
 * - XRの出入り制御
 * - ステータス表示
 * - リセット機能
 */
export class PanelSystem extends createSystem({
  controlPanel: {
    required: [PanelUI, PanelDocument],
    where: [eq(PanelUI, "config", "/ui/control-panel.json")],
  },
}) {
  private xrButton!: UIKit.Text;
  private statusText!: UIKit.Text;
  private resetButton!: UIKit.Text;

  init() {
    // パネルが作成されたときの処理
    this.queries.controlPanel.subscribe("qualify", (entity) => {
      const document = PanelDocument.data.document[
        entity.index
      ] as UIKitDocument;
      if (!document) return;

      this.setupPanelControls(document);
    });
  }

  /**
   * パネルコントロールのセットアップ
   */
  private setupPanelControls(document: UIKitDocument) {
    // XRボタンの取得と設定
    this.xrButton = document.getElementById("xr-button") as UIKit.Text;
    if (this.xrButton) {
      this.xrButton.addEventListener("click", () => {
        this.handleXRButtonClick();
      });
    }

    // ステータステキストの取得
    this.statusText = document.getElementById("status-text") as UIKit.Text;

    // リセットボタンの取得と設定
    this.resetButton = document.getElementById("reset-button") as UIKit.Text;
    if (this.resetButton) {
      this.resetButton.addEventListener("click", () => {
        this.handleResetButtonClick();
      });
    }

    // Worldのvisibility状態を監視
    this.world.visibilityState.subscribe((visibilityState) => {
      this.updateUIForVisibilityState(visibilityState);
    });

    // Zustandストアの状態を監視（HMR対応）
    this.subscribeToStore();

    // 初期状態を設定
    this.updateUIForVisibilityState(this.world.visibilityState.value);
  }

  /**
   * Zustandストアの状態を監視
   */
  private subscribeToStore() {
    // XR状態の変化を監視
    useXRStore.subscribe(
      (state) => state.xrState,
      (xrState) => {
        this.updateStatusText(xrState);
      }
    );

    // エラー状態の監視
    useXRStore.subscribe(
      (state) => state.error,
      (error) => {
        if (error && this.statusText) {
          this.statusText.setProperties({ text: `Error: ${error}` });
        }
      }
    );
  }

  /**
   * XRボタンクリック処理
   */
  private async handleXRButtonClick() {
    const store = useXRStore.getState();

    if (this.world.visibilityState.value === VisibilityState.NonImmersive) {
      // XRに入る
      await store.enterXR();
    } else {
      // XRから出る
      await store.exitXR();
    }
  }

  /**
   * リセットボタンクリック処理
   */
  private handleResetButtonClick() {
    // カメラ位置をリセット
    const { camera } = this.world;
    camera.position.set(0, 1.6, 3);
    camera.rotation.set(0, 0, 0);

    // ストアの選択状態をクリア
    useXRStore.getState().selectObject(null);

    // ステータス更新
    if (this.statusText) {
      this.statusText.setProperties({ text: "Status: View Reset" });
      setTimeout(() => {
        this.updateStatusText(useXRStore.getState().xrState);
      }, 2000);
    }

    console.log("View reset");
  }

  /**
   * Visibility状態に応じてUIを更新
   */
  private updateUIForVisibilityState(visibilityState: VisibilityState) {
    if (!this.xrButton) return;

    if (visibilityState === VisibilityState.NonImmersive) {
      this.xrButton.setProperties({ text: "Enter XR" });
      useXRStore.getState().setXRState(XRState.NonImmersive);
    } else {
      this.xrButton.setProperties({ text: "Exit to Browser" });
      useXRStore.getState().setXRState(XRState.ImmersiveVR);
    }

    this.updateStatusText(useXRStore.getState().xrState);
  }

  /**
   * ステータステキストを更新
   */
  private updateStatusText(xrState: XRState) {
    if (!this.statusText) return;

    let statusMessage = "";
    switch (xrState) {
      case XRState.NonImmersive:
        statusMessage = "Status: Ready";
        break;
      case XRState.ImmersiveVR:
        statusMessage = "Status: In VR Mode";
        break;
      case XRState.ImmersiveAR:
        statusMessage = "Status: In AR Mode";
        break;
      default:
        statusMessage = "Status: Unknown";
    }

    this.statusText.setProperties({ text: statusMessage });
  }

  /**
   * 毎フレームの更新処理
   */
  update() {
    // 必要に応じてリアルタイム更新処理を追加
    // 例: ヒットテスト結果の表示など
  }
}
