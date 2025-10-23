import * as THREE from "three";
import { useXRStore } from "../stores/xrStore";

/**
 * HitTestManager
 * WebXRのヒットテストAPIを使用して現実世界の表面を検出し、
 * レティクル（照準マーカー）を表示する
 */
export class HitTestManager {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private reticleMesh: THREE.Mesh | null = null;
  private hitTestSource: XRHitTestSource | null = null;
  private rightHandHitTestSource: XRHitTestSource | null = null;
  private rightHandInputSource: XRInputSource | null = null;
  private referenceSpace: XRReferenceSpace | null = null;
  private lastHitPosition: THREE.Vector3 = new THREE.Vector3();
  private placedObjects: THREE.Object3D[] = [];
  private objectCounter = 0;
  private session: XRSession | null = null;
  private inputSourcesChangeListener: ((event: XRInputSourcesChangeEvent) => void) | null = null;
  private sessionEndListener: (() => void) | null = null;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene) {
    this.renderer = renderer;
    this.scene = scene;
    this.createReticle();
    this.setupTapListener();
  }

  /**
   * レティクル（照準リング）の作成
   */
  private createReticle() {
    const geometry = new THREE.RingGeometry(0.1, 0.12, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      opacity: 0.7,
      transparent: true,
      side: THREE.DoubleSide,
    });

    this.reticleMesh = new THREE.Mesh(geometry, material);
    this.reticleMesh.rotation.x = -Math.PI / 2; // 地面に平行に配置
    this.reticleMesh.visible = false;
    this.reticleMesh.matrixAutoUpdate = false;

    this.scene.add(this.reticleMesh);
  }

  /**
   * XRセッション開始時の処理
   */
  async onSessionStart(session: XRSession) {
    try {
      this.session = session;
      // reference spaceを取得（利用可能なものを順番に試す）
      try {
        this.referenceSpace = await session.requestReferenceSpace("local-floor");
      } catch {
        try {
          this.referenceSpace = await session.requestReferenceSpace("local");
        } catch {
          this.referenceSpace = await session.requestReferenceSpace("viewer");
        }
      }

      // ヒットテストソースをセットアップ
      const viewerSpace = await session.requestReferenceSpace("viewer");
      if (session.requestHitTestSource) {
        const hitTestSource = await session.requestHitTestSource({
          space: viewerSpace,
        });
        this.hitTestSource = hitTestSource ?? null;
      } else {
        throw new Error("Hit test not supported");
      }

      // 右手入力ソースの監視とヒットテスト初期化
      const trySetupRightHand = (inputSource: XRInputSource) => {
        if (inputSource.handedness === "right" && inputSource.targetRaySpace) {
          this.setupRightHandHitTest(session, inputSource);
        }
      };

      session.inputSources.forEach((source) => trySetupRightHand(source));

      const handleInputSourcesChange = (event: XRInputSourcesChangeEvent) => {
        event.added.forEach(trySetupRightHand);

        event.removed.forEach((inputSource: XRInputSource) => {
          if (inputSource === this.rightHandInputSource) {
            this.clearRightHandHitTest();
          }
        });
      };

      session.addEventListener("inputsourceschange", handleInputSourcesChange);
      this.inputSourcesChangeListener = handleInputSourcesChange;

      const handleSessionEnd = () => {
        this.clearRightHandHitTest();
        if (this.session && this.inputSourcesChangeListener) {
          this.session.removeEventListener("inputsourceschange", this.inputSourcesChangeListener);
        }
        this.session = null;
        this.sessionEndListener = null;
        this.inputSourcesChangeListener = null;
      };

      session.addEventListener("end", handleSessionEnd);
      this.sessionEndListener = handleSessionEnd;

      console.log("✅ Hit test source initialized");
      useXRStore.getState().setError(null);
    } catch (error) {
      console.error("❌ Failed to setup hit test:", error);
      useXRStore.getState().setError("Hit test setup failed");
    }
  }

  /**
   * 毎フレーム実行される更新処理
   */
  update(frame?: XRFrame) {
    if (!frame || !this.reticleMesh || !this.referenceSpace) {
      return;
    }

    try {
      let hitTestResults: XRHitTestResult[] = [];

      if (this.rightHandHitTestSource) {
        hitTestResults = frame.getHitTestResults(this.rightHandHitTestSource);
      }

      if (hitTestResults.length === 0 && this.hitTestSource) {
        hitTestResults = frame.getHitTestResults(this.hitTestSource);
      }

      if (hitTestResults.length > 0) {
        const hit = hitTestResults[0];
        const pose = hit.getPose(this.referenceSpace);

        if (pose) {
          // レティクルの位置と向きを更新
          this.reticleMesh.matrix.fromArray(pose.transform.matrix);
          this.reticleMesh.visible = true;

          // 最後のヒット位置を保存
          this.lastHitPosition.setFromMatrixPosition(this.reticleMesh.matrix);

          // ストア更新
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
   * タップイベントリスナーのセットアップ
   */
  private setupTapListener() {
    const handleSelect = () => {
      if (this.reticleMesh && this.reticleMesh.visible) {
        this.spawnObjectAtHitPosition();
      }
    };

    // XRセッションの select イベントを監視
    this.renderer.xr.addEventListener("sessionstart", () => {
      const session = this.renderer.xr.getSession();
      if (session) {
        session.addEventListener("select", handleSelect);
      }
    });
  }

  /**
   * ヒット位置にオブジェクトを配置
   */
  private spawnObjectAtHitPosition() {
    this.objectCounter++;
    const objectType = this.objectCounter % 3;

    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;

    switch (objectType) {
      case 0: // キューブ
        geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
        material = new THREE.MeshStandardMaterial({
          color: 0xff0000,
          metalness: 0.3,
          roughness: 0.7,
        });
        break;
      case 1: // 球体
        geometry = new THREE.SphereGeometry(0.05, 16, 16);
        material = new THREE.MeshStandardMaterial({
          color: 0x00ff00,
          metalness: 0.5,
          roughness: 0.5,
        });
        break;
      case 2: // 円柱
        geometry = new THREE.BoxGeometry(0.05, 0.15, 0.05);
        material = new THREE.MeshStandardMaterial({
          color: 0x0000ff,
          metalness: 0.4,
          roughness: 0.6,
        });
        break;
      default:
        return;
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(this.lastHitPosition);
    mesh.position.y += 0.05; // 少し浮かせる
    mesh.userData.interactive = true; // インタラクション可能フラグ

    this.scene.add(mesh);
    this.placedObjects.push(mesh);

    console.log(`✨ Object spawned (type: ${objectType})`);

    // レティクルの色を一時的に変更(フィードバック)
    this.setReticleColor(0xffff00);
    setTimeout(() => {
      this.setReticleColor(0x00ff00);
    }, 200);
  }

  /**
   * レティクルの色を変更
   */
  private setReticleColor(color: number) {
    if (this.reticleMesh) {
      (this.reticleMesh.material as THREE.MeshBasicMaterial).color.setHex(color);
    }
  }

  /**
   * 最後のヒット位置を取得
   */
  getLastHitPosition(): THREE.Vector3 {
    return this.lastHitPosition.clone();
  }

  /**
   * 配置済みオブジェクトを取得
   */
  getPlacedObjects(): THREE.Object3D[] {
    return this.placedObjects;
  }

  /**
   * クリーンアップ
   */
  dispose() {
    this.clearRightHandHitTest();

    if (this.hitTestSource) {
      this.hitTestSource.cancel();
      this.hitTestSource = null;
    }

    if (this.session && this.inputSourcesChangeListener) {
      this.session.removeEventListener("inputsourceschange", this.inputSourcesChangeListener);
    }

    if (this.session && this.sessionEndListener) {
      this.session.removeEventListener("end", this.sessionEndListener);
    }

    this.session = null;
    this.inputSourcesChangeListener = null;
    this.sessionEndListener = null;

    if (this.reticleMesh) {
      this.scene.remove(this.reticleMesh);
      this.reticleMesh.geometry.dispose();
      (this.reticleMesh.material as THREE.Material).dispose();
      this.reticleMesh = null;
    }

    // 配置したオブジェクトをクリーンアップ
    this.placedObjects.forEach((obj) => {
      this.scene.remove(obj);
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (obj.material instanceof THREE.Material) {
          obj.material.dispose();
        }
      }
    });
    this.placedObjects = [];
  }

  /**
   * 右手ヒットテストのセットアップ
   */
  private async setupRightHandHitTest(session: XRSession, inputSource: XRInputSource) {
    try {
      if (!inputSource.targetRaySpace) return;

      this.clearRightHandHitTest();

      if (!session.requestHitTestSource) {
        console.warn("⚠️ requestHitTestSource is unavailable on this session");
        return;
      }

      const source = await session.requestHitTestSource({
        space: inputSource.targetRaySpace,
      });

      this.rightHandHitTestSource = source ?? null;
      this.rightHandInputSource = inputSource;
      console.log("✅ Right-hand hit test source initialized");
    } catch (error) {
      console.warn("⚠️ Failed to setup right-hand hit test:", error);
    }
  }

  /**
   * 右手ヒットテストの破棄
   */
  private clearRightHandHitTest() {
    if (this.rightHandHitTestSource) {
      this.rightHandHitTestSource.cancel();
      this.rightHandHitTestSource = null;
    }
    this.rightHandInputSource = null;
  }
}
