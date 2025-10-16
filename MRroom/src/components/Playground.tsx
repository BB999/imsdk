import { useEffect, useRef } from "react";
import { useXRStore } from "../stores/xrStore";
import {
  BoxGeometry,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
} from "@iwsdk/core";
import { Interactive } from "../systems/InteractionSystem";

/**
 * Playground Component
 *
 * ライブコーディング用のコンポーネント
 * このファイルを編集すると、XRセッションを維持したまま
 * リアルタイムで3Dオブジェクトを追加・変更できる
 *
 * 使い方:
 * 1. XRモードに入る
 * 2. このファイルを編集
 * 3. 保存 → 即座に反映（セッション継続）
 */
export function Playground() {
  const { world } = useXRStore();
  const objectsRef = useRef<any[]>([]);

  useEffect(() => {
    if (!world) return;

    console.log("🎮 Playground: Initializing...");

    // ここから下に自由に3Dオブジェクトを追加してください
    // ========================================

    // サンプル1: 赤いキューブ
    const cubeGeometry = new BoxGeometry(0.3, 0.3, 0.3);
    const cubeMaterial = new MeshStandardMaterial({
      color: 0xff0000,
      metalness: 0.3,
      roughness: 0.7,
    });
    const cube = new Mesh(cubeGeometry, cubeMaterial);
    cube.position.set(-0.5, 1.5, -2);

    const cubeEntity = world.createTransformEntity(cube);
    Interactive.add(cubeEntity, {
      id: "playground-cube",
      highlightColor: 0xff00ff,
    });
    objectsRef.current.push({ mesh: cube, entity: cubeEntity });

    // サンプル2: 緑の球体
    const sphereGeometry = new SphereGeometry(0.2, 32, 32);
    const sphereMaterial = new MeshStandardMaterial({
      color: 0x00ff00,
      metalness: 0.5,
      roughness: 0.5,
    });
    const sphere = new Mesh(sphereGeometry, sphereMaterial);
    sphere.position.set(0.5, 1.5, -2);

    const sphereEntity = world.createTransformEntity(sphere);
    Interactive.add(sphereEntity, {
      id: "playground-sphere",
      highlightColor: 0x00ffff,
    });
    objectsRef.current.push({ mesh: sphere, entity: sphereEntity });

    // ========================================
    // ここまで

    console.log(`🎮 Playground: Created ${objectsRef.current.length} objects`);

    // クリーンアップ: コンポーネントがアンマウントされたらオブジェクトを削除
    return () => {
      console.log("🎮 Playground: Cleaning up...");
      objectsRef.current.forEach(({ entity }) => {
        try {
          world.destroyEntity(entity);
        } catch (error) {
          console.error("Failed to destroy entity:", error);
        }
      });
      objectsRef.current = [];
    };
  }, [world]);

  // UIは不要（3Dオブジェクトのみ管理）
  return null;
}

/**
 * 使用例:
 *
 * // キューブを追加
 * const cube = new Mesh(
 *   new BoxGeometry(0.5, 0.5, 0.5),
 *   new MeshStandardMaterial({ color: 0xff0000 })
 * );
 * cube.position.set(0, 1.5, -2);
 * const entity = world.createTransformEntity(cube);
 * objectsRef.current.push({ mesh: cube, entity });
 *
 * // インタラクティブにする
 * Interactive.add(entity, { id: "my-cube" });
 *
 * // GLTFモデルをロード（事前にアセットマニフェストに追加が必要）
 * import { AssetManager } from "@iwsdk/core";
 * const model = AssetManager.getModel("modelName");
 * if (model) {
 *   const entity = world.createTransformEntity(model.scene);
 *   model.scene.position.set(0, 0, -3);
 *   objectsRef.current.push({ mesh: model.scene, entity });
 * }
 */
