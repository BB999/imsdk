import {
  createComponent,
  createSystem,
  Mesh,
  MeshBasicMaterial,
  RingGeometry,
  Vector3,
} from "@iwsdk/core";
import { useXRStore } from "../stores/xrStore";

// ヒットテストレティクル用のコンポーネント
export const HitTestReticle = createComponent("HitTestReticle", {});

/**
 * HitTestSystem
 *
 * WebXRのヒットテストAPIを使用して、現実世界の表面を検出し、
 * その位置にレティクル（照準マーカー）を表示するシステム
 */
export class HitTestSystem extends createSystem({
  reticle: { required: [HitTestReticle] },
}) {
  private hitTestSource: XRHitTestSource | null = null;
  private reticleMesh: Mesh | null = null;
  private lastHitPosition: Vector3 = new Vector3();

  init() {
    // レティクルの作成
    this.createReticle();

    // XRセッション開始時にヒットテストソースを初期化
    this.world.xrSession.subscribe((session) => {
      if (session) {
        this.setupHitTestSource(session);
      } else {
        this.cleanupHitTestSource();
      }
    });
  }

  /**
   * レティクル（照準リング）の作成
   */
  private createReticle() {
    // リングジオメトリでレティクルを作成
    const geometry = new RingGeometry(0.1, 0.12, 32);
    const material = new MeshBasicMaterial({
      color: 0x00ff00,
      opacity: 0.7,
      transparent: true,
      side: 2, // DoubleSide
    });

    this.reticleMesh = new Mesh(geometry, material);
    this.reticleMesh.rotation.x = -Math.PI / 2; // 地面に平行に配置
    this.reticleMesh.visible = false;

    // エンティティとして登録
    const entity = this.world.createTransformEntity(this.reticleMesh);
    HitTestReticle.add(entity);
  }

  /**
   * ヒットテストソースのセットアップ
   */
  private async setupHitTestSource(session: XRSession) {
    try {
      // ビューアー空間からのレイキャストを設定
      const referenceSpace = await session.requestReferenceSpace("viewer");
      this.hitTestSource = await session.requestHitTestSource({
        space: referenceSpace,
      });

      console.log("Hit test source initialized");
    } catch (error) {
      console.error("Failed to setup hit test source:", error);
      useXRStore.getState().setError("Hit test not supported");
    }
  }

  /**
   * ヒットテストソースのクリーンアップ
   */
  private cleanupHitTestSource() {
    if (this.hitTestSource) {
      this.hitTestSource.cancel();
      this.hitTestSource = null;
    }

    if (this.reticleMesh) {
      this.reticleMesh.visible = false;
    }

    useXRStore.getState().setReticleVisible(false);
  }

  /**
   * 毎フレーム実行される更新処理
   */
  update() {
    if (!this.hitTestSource || !this.reticleMesh) return;

    const frame = this.world.xrFrame;
    if (!frame) return;

    try {
      // ヒットテスト結果を取得
      const hitTestResults = frame.getHitTestResults(this.hitTestSource);

      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(this.world.xrReferenceSpace!);

        if (pose) {
          // レティクルの位置を更新
          const position = pose.transform.position;
          this.reticleMesh.position.set(position.x, position.y, position.z);

          // 回転も更新（表面の向きに合わせる）
          const orientation = pose.transform.orientation;
          this.reticleMesh.quaternion.set(
            orientation.x,
            orientation.y,
            orientation.z,
            orientation.w
          );

          // レティクルを表示
          this.reticleMesh.visible = true;

          // ヒット位置を保存
          this.lastHitPosition.copy(this.reticleMesh.position);

          // ストアに結果を保存
          useXRStore.getState().setHitTestResults(hitTestResults);
          useXRStore.getState().setReticleVisible(true);
        }
      } else {
        // ヒット結果がない場合は非表示
        this.reticleMesh.visible = false;
        useXRStore.getState().setReticleVisible(false);
      }
    } catch (error) {
      console.error("Hit test update error:", error);
    }
  }

  /**
   * 最後にヒットした位置を取得
   */
  getLastHitPosition(): Vector3 {
    return this.lastHitPosition.clone();
  }

  /**
   * レティクルの色を変更
   */
  setReticleColor(color: number) {
    if (this.reticleMesh) {
      (this.reticleMesh.material as MeshBasicMaterial).color.setHex(color);
    }
  }
}
