import { useEffect, useRef, useState } from "react";
import {
  AssetManifest,
  AssetType,
  SessionMode,
  World,
} from "@iwsdk/core";
import { useXRStore } from "./stores/xrStore";
import { HitTestSystem } from "./systems/HitTestSystem";
import { InteractionSystem } from "./systems/InteractionSystem";
import { PanelSystem } from "./systems/PanelSystem";
import { Playground } from "./components/Playground";

// アセットマニフェスト定義
const assets: AssetManifest = {
  // 必要に応じてアセットを追加
  // chimeSound: {
  //   url: "/audio/chime.mp3",
  //   type: AssetType.Audio,
  //   priority: "background",
  // },
};

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setWorld, world, error } = useXRStore();
  const [isInitializing, setIsInitializing] = useState(false);
  const initOnceRef = useRef(false);

  useEffect(() => {
    // 既にworldが存在するか、初期化中の場合はスキップ
    if (world || initOnceRef.current || !containerRef.current) return;

    initOnceRef.current = true;
    setIsInitializing(true);

    console.log("Initializing IWSDK World...");

    // IWSDK Worldの作成
    World.create(containerRef.current, {
      assets,
      xr: {
        sessionMode: SessionMode.ImmersiveVR,
        offer: "always",
        // XR機能の設定
        features: {
          handTracking: { required: true },
          layers: { required: true },
          // ヒットテスト機能を有効化
          "hit-test": { required: false, optional: true },
        },
      },
      features: {
        locomotion: { useWorker: true },
        grabbing: true,
        physics: true,
        sceneUnderstanding: true, // ヒットテストに必要
      },
      // Metaspatialのレベルファイル（後で追加）
      // level: "/glxf/Composition.glxf",
    })
      .then((newWorld) => {
        console.log("World created successfully");

        // カメラの初期位置設定
        const { camera } = newWorld;
        camera.position.set(0, 1.6, 3);
        camera.lookAt(0, 1, 0);

        // システムの登録(問題のあるシステムを特定するため1つずつ)
        try {
          console.log("Registering PanelSystem...");
          newWorld.registerSystem(PanelSystem);
          console.log("PanelSystem registered successfully");
        } catch (err) {
          console.error("Failed to register PanelSystem:", err);
        }

        try {
          console.log("Registering HitTestSystem...");
          newWorld.registerSystem(HitTestSystem);
          console.log("HitTestSystem registered successfully");
        } catch (err) {
          console.error("Failed to register HitTestSystem:", err);
        }

        try {
          console.log("Registering InteractionSystem...");
          newWorld.registerSystem(InteractionSystem);
          console.log("InteractionSystem registered successfully");
        } catch (err: any) {
          console.error("Failed to register InteractionSystem:", err);
          console.error("InteractionSystem error details:", {
            message: err?.message,
            stack: err?.stack,
            name: err?.name,
          });
        }

        // Zustandストアに保存
        setWorld(newWorld);
        setIsInitializing(false);

        console.log("Systems registered");
      })
      .catch((err) => {
        console.error("Failed to create World:", err);
        console.error("Error details:", {
          message: err?.message,
          stack: err?.stack,
          name: err?.name,
          fullError: JSON.stringify(err, Object.getOwnPropertyNames(err))
        });
        useXRStore.getState().setError(err?.message || "Unknown error occurred");
        setIsInitializing(false);
        initOnceRef.current = false; // 再試行を可能にする
      });

    // クリーンアップ
    return () => {
      if (world) {
        console.log("Cleaning up World...");
        // XRセッションが有効な場合は終了
        world.exitXR().catch(console.error);
      }
    };
  }, [world, setWorld]);

  // エラー表示
  if (error) {
    return (
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          padding: "20px",
          background: "rgba(220, 38, 38, 0.9)",
          color: "white",
          borderRadius: "8px",
          fontFamily: "monospace",
          maxWidth: "80%",
          zIndex: 1000,
        }}
      >
        <h2 style={{ margin: "0 0 10px 0" }}>Error</h2>
        <p style={{ margin: 0 }}>{error}</p>
        <button
          onClick={() => {
            useXRStore.getState().setError(null);
            window.location.reload();
          }}
          style={{
            marginTop: "15px",
            padding: "8px 16px",
            background: "white",
            color: "#dc2626",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Reload
        </button>
      </div>
    );
  }

  // ローディング表示
  if (isInitializing) {
    return (
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          color: "white",
          fontFamily: "Arial, sans-serif",
          fontSize: "24px",
          zIndex: 1000,
        }}
      >
        Initializing MR Room...
      </div>
    );
  }

  return (
    <>
      {/* IWSDKのシーンコンテナ */}
      <div
        ref={containerRef}
        id="scene-container"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />

      {/* Playgroundコンポーネント（ライブコーディング用） */}
      <Playground />

      {/* デバッグ情報（開発時のみ表示） */}
      {import.meta.env.DEV && world && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: "rgba(0, 0, 0, 0.7)",
            color: "#0f0",
            padding: "10px",
            fontFamily: "monospace",
            fontSize: "12px",
            borderRadius: "4px",
            zIndex: 999,
            pointerEvents: "none",
          }}
        >
          <div>MR Room - Development Mode</div>
          <div>World: {world ? "✓" : "✗"}</div>
          <div>
            XR State: {useXRStore.getState().xrState}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
