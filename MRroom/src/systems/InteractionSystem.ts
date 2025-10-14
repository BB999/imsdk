import {
  AudioUtils,
  createComponent,
  createSystem,
  Pressed,
  Grabbable,
  Vector3,
} from "@iwsdk/core";
import { useXRStore } from "../stores/xrStore";

// インタラクション可能なオブジェクト用のコンポーネント
export const Interactive = createComponent("Interactive", {
  id: { type: "string" },
  highlightColor: { type: "u32", default: 0x00ff00 },
});

/**
 * InteractionSystem
 *
 * 3Dオブジェクトとのインタラクションを管理するシステム
 * - クリック/タップ検出
 * - グラブ（掴む）機能
 * - ホバー（マウスオーバー）効果
 * - 音声フィードバック
 */
export class InteractionSystem extends createSystem({
  interactive: { required: [Interactive] },
  clicked: { required: [Interactive, Pressed] },
  grabbed: { required: [Interactive, Grabbable] },
}) {
  private lookAtTarget!: Vector3;
  private originalColors: Map<number, number> = new Map();

  init() {
    this.lookAtTarget = new Vector3();

    // クリックされたオブジェクトの処理
    this.queries.clicked.subscribe("qualify", (entity) => {
      this.handleClick(entity);
    });

    // クリックが解除されたときの処理
    this.queries.clicked.subscribe("disqualify", (entity) => {
      this.handleClickRelease(entity);
    });

    // グラブされたオブジェクトの処理
    this.queries.grabbed.subscribe("qualify", (entity) => {
      this.handleGrab(entity);
    });
  }

  /**
   * クリック処理
   */
  private handleClick(entity: any) {
    const interactiveData = Interactive.data.id[entity.index];
    const id = interactiveData?.toString() || `object-${entity.index}`;

    console.log(`Object clicked: ${id}`);

    // Zustandストアに選択状態を保存
    useXRStore.getState().selectObject(id);

    // 音声再生（エンティティにAudioSourceがあれば）
    try {
      AudioUtils.play(entity);
    } catch (error) {
      // 音声がない場合は無視
    }

    // ハイライト効果
    this.highlightObject(entity, true);
  }

  /**
   * クリック解除処理
   */
  private handleClickRelease(entity: any) {
    const interactiveData = Interactive.data.id[entity.index];
    const id = interactiveData?.toString() || `object-${entity.index}`;

    console.log(`Object released: ${id}`);

    // 選択解除
    useXRStore.getState().selectObject(null);

    // ハイライト解除
    this.highlightObject(entity, false);
  }

  /**
   * グラブ処理
   */
  private handleGrab(entity: any) {
    const interactiveData = Interactive.data.id[entity.index];
    const id = interactiveData?.toString() || `object-${entity.index}`;

    console.log(`Object grabbed: ${id}`);

    // グラブ時の視覚効果
    this.highlightObject(entity, true, 0xff00ff); // 紫色でハイライト
  }

  /**
   * オブジェクトをハイライト
   */
  private highlightObject(
    entity: any,
    highlight: boolean,
    color?: number
  ) {
    const object = entity.object3D;
    if (!object) return;

    object.traverse((child: any) => {
      if (child.isMesh && child.material) {
        if (highlight) {
          // 元の色を保存
          if (!this.originalColors.has(child.id)) {
            this.originalColors.set(
              child.id,
              child.material.color?.getHex() || 0xffffff
            );
          }

          // ハイライト色を適用
          const highlightColor =
            color || Interactive.data.highlightColor[entity.index] || 0x00ff00;
          if (child.material.color) {
            child.material.color.setHex(highlightColor);
          }
          if (child.material.emissive) {
            child.material.emissive.setHex(highlightColor);
            child.material.emissiveIntensity = 0.3;
          }
        } else {
          // 元の色に戻す
          const originalColor = this.originalColors.get(child.id);
          if (originalColor !== undefined && child.material.color) {
            child.material.color.setHex(originalColor);
          }
          if (child.material.emissive) {
            child.material.emissive.setHex(0x000000);
            child.material.emissiveIntensity = 0;
          }
        }
      }
    });
  }

  /**
   * 毎フレームの更新処理
   */
  update() {
    // インタラクティブなオブジェクトをプレイヤーの方向に向ける
    this.queries.interactive.entities.forEach((entity) => {
      const object = entity.object3D;
      if (!object) return;

      // プレイヤーの頭の位置を取得
      this.player.head.getWorldPosition(this.lookAtTarget);

      // オブジェクトの位置を取得
      const objectPos = new Vector3();
      object.getWorldPosition(objectPos);

      // Y軸のみをプレイヤーの高さに合わせる
      this.lookAtTarget.y = objectPos.y;

      // プレイヤーの方向を向く
      object.lookAt(this.lookAtTarget);
    });
  }

  /**
   * オブジェクトのインタラクション可能状態を設定
   */
  setInteractive(entityIndex: number, interactive: boolean) {
    const entity = this.queries.interactive.entities[entityIndex];
    if (!entity) return;

    if (interactive) {
      // Grabbableコンポーネントを追加（まだなければ）
      if (!Grabbable.has(entity)) {
        Grabbable.add(entity);
      }
    } else {
      // Grabbableコンポーネントを削除
      if (Grabbable.has(entity)) {
        Grabbable.remove(entity);
      }
    }
  }
}
