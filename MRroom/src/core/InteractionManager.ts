import * as THREE from "three";
import { useXRStore } from "../stores/xrStore";

/**
 * InteractionManager
 * 3Dオブジェクトとのインタラクションを管理
 * - レイキャスティングによるクリック/タップ検出
 * - ホバー効果
 * - ハイライト表示
 */
export class InteractionManager {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private raycaster: THREE.Raycaster;
  private pointer: THREE.Vector2;
  private hoveredObject: THREE.Object3D | null = null;
  private selectedObject: THREE.Object3D | null = null;
  private originalColors: Map<number, THREE.Color> = new Map();

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this.setupEventListeners();
  }

  /**
   * イベントリスナーのセットアップ
   */
  private setupEventListeners() {
    const canvas = this.renderer.domElement;

    // ポインター移動
    canvas.addEventListener("pointermove", this.onPointerMove.bind(this));

    // クリック/タップ
    canvas.addEventListener("click", this.onClick.bind(this));

    // XRセッションのselectイベント
    this.renderer.xr.addEventListener("sessionstart", () => {
      const session = this.renderer.xr.getSession();
      if (session) {
        // XR内でのselectイベントは別途処理する場合はここに追加
      }
    });
  }

  /**
   * ポインター移動時の処理
   */
  private onPointerMove(event: PointerEvent) {
    // XRセッション中は無効
    if (this.renderer.xr.isPresenting) return;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  /**
   * クリック時の処理
   */
  private onClick() {
    // XRセッション中は無効（ヒットテストで処理）
    if (this.renderer.xr.isPresenting) return;

    const intersects = this.getIntersects();
    if (intersects.length > 0) {
      const object = intersects[0].object;
      this.selectObject(object);
    } else {
      this.deselectObject();
    }
  }

  /**
   * 毎フレーム実行される更新処理
   */
  update() {
    // XRセッション中は無効
    if (this.renderer.xr.isPresenting) return;

    const intersects = this.getIntersects();

    if (intersects.length > 0) {
      const object = intersects[0].object;

      // ホバー状態の更新
      if (this.hoveredObject !== object) {
        // 前のホバーオブジェクトをリセット
        if (this.hoveredObject) {
          this.unhighlightObject(this.hoveredObject);
        }

        // 新しいホバーオブジェクトをハイライト
        this.hoveredObject = object;
        this.highlightObject(object, 0x00ff00); // 緑でハイライト

        useXRStore.getState().hoverObject(object.uuid);
      }
    } else {
      // ホバー解除
      if (this.hoveredObject) {
        this.unhighlightObject(this.hoveredObject);
        this.hoveredObject = null;
        useXRStore.getState().hoverObject(null);
      }
    }
  }

  /**
   * レイキャスティングで交差するオブジェクトを取得
   */
  private getIntersects(): THREE.Intersection[] {
    this.raycaster.setFromCamera(this.pointer, this.camera);

    // インタラクティブなオブジェクトのみを対象
    const interactiveObjects = this.scene.children.filter(
      (obj) => obj.userData.interactive === true
    );

    return this.raycaster.intersectObjects(interactiveObjects, true);
  }

  /**
   * オブジェクトを選択
   */
  private selectObject(object: THREE.Object3D) {
    // 既に選択されている場合は解除
    if (this.selectedObject === object) {
      this.deselectObject();
      return;
    }

    // 前の選択を解除
    if (this.selectedObject) {
      this.unhighlightObject(this.selectedObject);
    }

    // 新しいオブジェクトを選択
    this.selectedObject = object;
    this.highlightObject(object, 0xff00ff); // 紫でハイライト

    useXRStore.getState().selectObject(object.uuid);
    console.log(`Object selected: ${object.uuid}`);
  }

  /**
   * オブジェクトの選択を解除
   */
  private deselectObject() {
    if (this.selectedObject) {
      this.unhighlightObject(this.selectedObject);
      this.selectedObject = null;
      useXRStore.getState().selectObject(null);
      console.log("Object deselected");
    }
  }

  /**
   * オブジェクトをハイライト
   */
  private highlightObject(object: THREE.Object3D, color: number) {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        // 元の色を保存
        if (!this.originalColors.has(child.id)) {
          this.originalColors.set(child.id, child.material.color.clone());
        }

        // ハイライト色を適用
        child.material.color.setHex(color);
        child.material.emissive.setHex(color);
        child.material.emissiveIntensity = 0.3;
      }
    });
  }

  /**
   * オブジェクトのハイライトを解除
   */
  private unhighlightObject(object: THREE.Object3D) {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        // 元の色に戻す
        const originalColor = this.originalColors.get(child.id);
        if (originalColor) {
          child.material.color.copy(originalColor);
        }
        child.material.emissive.setHex(0x000000);
        child.material.emissiveIntensity = 0;
      }
    });
  }

  /**
   * クリーンアップ
   */
  dispose() {
    const canvas = this.renderer.domElement;
    canvas.removeEventListener("pointermove", this.onPointerMove.bind(this));
    canvas.removeEventListener("click", this.onClick.bind(this));

    this.originalColors.clear();
    this.hoveredObject = null;
    this.selectedObject = null;
  }
}
