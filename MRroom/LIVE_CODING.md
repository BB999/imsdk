# ライブコーディングガイド

このプロジェクトは**XRセッションを維持したまま**、リアルタイムで3Dオブジェクトを追加・変更できるように設計されています。

## 使い方

### 1. 開発サーバーを起動

```bash
npm run dev
```

ブラウザが `https://localhost:8081` を開きます。

---

### 2. XRモードに入る

- **デスクトップ**: 「Enter XR」ボタン → IWERエミュレーション起動
- **Quest実機**: Quest Browserで同じURLにアクセス → XRモードに入る

---

### 3. Playgroundコンポーネントを編集

`src/components/Playground.tsx` を開いて編集します。

#### 基本的な編集場所

```typescript
useEffect(() => {
  if (!world) return;

  // ここから下に自由に3Dオブジェクトを追加
  // ========================================

  // あなたのコードをここに書く

  // ========================================

  return () => {
    // クリーンアップ処理（自動）
  };
}, [world]);
```

---

## サンプルコード

### キューブを追加

```typescript
const cube = new Mesh(
  new BoxGeometry(0.5, 0.5, 0.5),
  new MeshStandardMaterial({ color: 0xff0000 })
);
cube.position.set(0, 1.5, -2);

const entity = world.createTransformEntity(cube);
objectsRef.current.push({ mesh: cube, entity });
```

保存 → **即座に赤いキューブが出現** ✅

---

### インタラクティブにする

```typescript
// キューブをクリック可能にする
Interactive.add(entity, {
  id: "my-cube",
  highlightColor: 0x00ff00, // クリック時の色
});
```

保存 → **キューブをクリックすると緑色にハイライト** ✅

---

### 複数のオブジェクトを追加

```typescript
// 赤、緑、青のキューブを横に並べる
const colors = [0xff0000, 0x00ff00, 0x0000ff];
colors.forEach((color, i) => {
  const cube = new Mesh(
    new BoxGeometry(0.3, 0.3, 0.3),
    new MeshStandardMaterial({ color })
  );
  cube.position.set(i - 1, 1.5, -2);

  const entity = world.createTransformEntity(cube);
  Interactive.add(entity, { id: `cube-${i}` });
  objectsRef.current.push({ mesh: cube, entity });
});
```

保存 → **3つのキューブが出現** ✅

---

### マテリアルを変更

```typescript
// 既存のオブジェクトを取得して変更
const firstObject = objectsRef.current[0];
if (firstObject) {
  firstObject.mesh.material.color.setHex(0x0000ff); // 赤→青
  firstObject.mesh.material.metalness = 0.9; // 金属感
  firstObject.mesh.material.roughness = 0.1; // ツヤツヤ
}
```

保存 → **色とマテリアルが変わる** ✅

---

### アニメーション追加

```typescript
// 回転するキューブ
const rotatingCube = new Mesh(
  new BoxGeometry(0.5, 0.5, 0.5),
  new MeshStandardMaterial({ color: 0xffff00 })
);
rotatingCube.position.set(0, 2, -2);

const entity = world.createTransformEntity(rotatingCube);
objectsRef.current.push({ mesh: rotatingCube, entity });

// アニメーションフレーム
const animate = () => {
  rotatingCube.rotation.y += 0.01;
  requestAnimationFrame(animate);
};
animate();
```

保存 → **回転するキューブが出現** ✅

---

### 球体を追加

```typescript
import { SphereGeometry } from "@iwsdk/core";

const sphere = new Mesh(
  new SphereGeometry(0.3, 32, 32),
  new MeshStandardMaterial({
    color: 0x00ffff,
    metalness: 0.7,
    roughness: 0.3,
  })
);
sphere.position.set(1, 1.5, -2);

const entity = world.createTransformEntity(sphere);
objectsRef.current.push({ mesh: sphere, entity });
```

保存 → **シアンの球体が出現** ✅

---

## 高度な使い方

### GLTFモデルを追加

#### 1. アセットマニフェストに追加

```typescript
// src/App.tsx
const assets: AssetManifest = {
  robot: {
    url: "/models/robot.glb",
    type: AssetType.Model,
    priority: "critical",
  },
};
```

⚠️ **注意**: これを変更するとXRセッションが切れます

#### 2. Playgroundで読み込み

```typescript
import { AssetManager } from "@iwsdk/core";

const model = AssetManager.getModel("robot");
if (model) {
  const entity = world.createTransformEntity(model.scene);
  model.scene.position.set(0, 0, -3);
  model.scene.scale.set(0.5, 0.5, 0.5);
  objectsRef.current.push({ mesh: model.scene, entity });
}
```

保存 → **モデルが出現** ✅（セッション継続）

---

### ライトを追加

```typescript
import { PointLight } from "@iwsdk/core";

const light = new PointLight(0xffffff, 1, 10);
light.position.set(0, 2, -1);

const entity = world.createTransformEntity(light);
objectsRef.current.push({ mesh: light, entity });
```

保存 → **ライトが追加される** ✅

---

### ヒットテスト結果を使う

```typescript
// ヒットテストで検出した位置にキューブを配置
const { hitTestResults } = useXRStore.getState();

if (hitTestResults.length > 0) {
  const hitTestSystem = world.getSystem(HitTestSystem);
  const hitPosition = hitTestSystem.getLastHitPosition();

  const cube = new Mesh(
    new BoxGeometry(0.2, 0.2, 0.2),
    new MeshStandardMaterial({ color: 0xff00ff })
  );
  cube.position.copy(hitPosition);

  const entity = world.createTransformEntity(cube);
  objectsRef.current.push({ mesh: cube, entity });
}
```

---

## トラブルシューティング

### オブジェクトが表示されない

- `objectsRef.current.push({ mesh, entity })` を忘れていないか確認
- `world.createTransformEntity()` を呼んでいるか確認
- `position.set()` でカメラの視野内に配置しているか確認

### XRセッションが切れる

以下を変更すると**必ずセッションが切れます**:

- `src/App.tsx` の `World.create` 設定
- システムの登録（`registerSystem`）
- アセットマニフェスト

**解決策**: `src/components/Playground.tsx` のみを編集する

### エラーが出る

- ブラウザのコンソールでエラー内容を確認
- TypeScriptの型エラーはVSCodeで確認
- `npm run dev` を再起動

---

## ベストプラクティス

### ✅ やるべきこと

1. **Playground.tsxのみを編集**（セッション維持）
2. **objectsRef.currentに必ず登録**（クリーンアップのため）
3. **コンソールログで確認**（`console.log`でデバッグ）
4. **小さな変更をこまめに保存**（問題の切り分け）

### ❌ 避けるべきこと

1. **App.tsxを編集**（セッションが切れる）
2. **システムを追加**（セッションが切れる）
3. **アセットマニフェストを頻繁に変更**（セッションが切れる）
4. **大量のオブジェクトを一度に追加**（パフォーマンス低下）

---

## デモシナリオ例

### シナリオ: VRプレゼンでライブコーディング

```typescript
// 1. XRモードに入る

// 2. 最初のキューブ
const cube1 = new Mesh(
  new BoxGeometry(0.3, 0.3, 0.3),
  new MeshStandardMaterial({ color: 0xff0000 })
);
cube1.position.set(-1, 1.5, -2);
const e1 = world.createTransformEntity(cube1);
objectsRef.current.push({ mesh: cube1, entity: e1 });

// 保存 → 赤キューブ出現

// 3. 2個目追加
const cube2 = new Mesh(
  new BoxGeometry(0.3, 0.3, 0.3),
  new MeshStandardMaterial({ color: 0x00ff00 })
);
cube2.position.set(0, 1.5, -2);
const e2 = world.createTransformEntity(cube2);
objectsRef.current.push({ mesh: cube2, entity: e2 });

// 保存 → 緑キューブ追加

// 4. インタラクティブにする
Interactive.add(e1, { id: "cube1" });
Interactive.add(e2, { id: "cube2" });

// 保存 → クリック可能になる

// 5. 色を変える
cube1.material.color.setHex(0x0000ff);

// 保存 → 赤→青に変化
```

すべて**XRセッションを維持したまま**実行できます ✅

---

## まとめ

- **`src/components/Playground.tsx`** を編集する
- **保存するだけ**で即座に反映
- **XRセッション継続**（セッションから出なくてOK）
- **ライブコーディングに最適**

楽しんでね！
