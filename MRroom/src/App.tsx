import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useXRStore } from "./stores/xrStore";
import { HitTestManager } from "./core/HitTestManager";
import { InteractionManager } from "./core/InteractionManager";

function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { setRenderer, setScene, setCamera, error, reticleVisible } = useXRStore();
  const [isInitializing, setIsInitializing] = useState(false);
  const [xrSupported, setXrSupported] = useState(false);

  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const hitTestManagerRef = useRef<HitTestManager | null>(null);
  const interactionManagerRef = useRef<InteractionManager | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // WebXRサポート確認
    if (navigator.xr) {
      navigator.xr.isSessionSupported("immersive-ar").then((supported) => {
        setXrSupported(supported);
      });
    }

    setIsInitializing(true);

    // シーンのセットアップ
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    setScene(scene);

    // カメラのセットアップ
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 1.6, 3);
    cameraRef.current = camera;
    setCamera(camera);

    // レンダラーのセットアップ
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    setRenderer(renderer);

    // ライトの追加
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(0, 10, 10);
    scene.add(directionalLight);

    // ヒットテストマネージャーの初期化
    hitTestManagerRef.current = new HitTestManager(renderer, scene);

    // インタラクションマネージャーの初期化
    interactionManagerRef.current = new InteractionManager(renderer, scene, camera);

    // アニメーションループ
    renderer.setAnimationLoop((_time, frame) => {
      if (hitTestManagerRef.current) {
        hitTestManagerRef.current.update(frame);
      }
      if (interactionManagerRef.current) {
        interactionManagerRef.current.update();
      }
      renderer.render(scene, camera);
    });

    // リサイズ処理
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    setIsInitializing(false);

    // クリーンアップ
    return () => {
      window.removeEventListener("resize", handleResize);
      renderer.setAnimationLoop(null);
      if (containerRef.current?.contains(renderer.domElement)) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      hitTestManagerRef.current?.dispose();
      interactionManagerRef.current?.dispose();
    };
  }, [setRenderer, setScene, setCamera]);

  // XRセッション開始
  const handleEnterAR = async () => {
    if (!rendererRef.current || !navigator.xr) return;

    try {
      const session = await navigator.xr.requestSession("immersive-ar", {
        requiredFeatures: ["hit-test"],
        optionalFeatures: ["local-floor", "bounded-floor", "hand-tracking"],
      });

      await rendererRef.current.xr.setSession(session);

      // セッション開始時にヒットテストを初期化
      if (hitTestManagerRef.current) {
        hitTestManagerRef.current.onSessionStart(session);
      }

      session.addEventListener("end", () => {
        console.log("XR session ended");
      });
    } catch (err) {
      console.error("Failed to start AR session:", err);
      useXRStore.getState().setError("AR session failed to start");
    }
  };

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
      {/* Three.jsのシーンコンテナ */}
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

      {/* AR開始ボタン */}
      {xrSupported && !rendererRef.current?.xr.isPresenting && (
        <button
          onClick={handleEnterAR}
          style={{
            position: "absolute",
            bottom: "40px",
            left: "50%",
            transform: "translateX(-50%)",
            padding: "15px 30px",
            background: "#0066ff",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "18px",
            fontWeight: "bold",
            cursor: "pointer",
            zIndex: 999,
          }}
        >
          Enter AR
        </button>
      )}

      {/* デバッグ情報 */}
      {import.meta.env.DEV && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "10px",
            background: "rgba(0, 0, 0, 0.8)",
            color: "#0f0",
            padding: "15px",
            fontFamily: "monospace",
            fontSize: "14px",
            borderRadius: "4px",
            zIndex: 999,
            pointerEvents: "none",
            maxWidth: "300px",
          }}
        >
          <div>MR Room - Debug Info</div>
          <div>WebXR: {xrSupported ? "✓" : "✗"}</div>
          <div>Session: {rendererRef.current?.xr.isPresenting ? "Active" : "Inactive"}</div>
          <div>Reticle: {reticleVisible ? "🎯 Visible" : "👻 Hidden"}</div>
          <div style={{ marginTop: "5px", fontSize: "12px", color: "#888" }}>
            {reticleVisible
              ? "Surface detected - Tap to place!"
              : "Point at floor/wall to detect surface"}
          </div>
        </div>
      )}
    </>
  );
}

export default App;
