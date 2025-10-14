import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// HMR設定
if (import.meta.hot) {
  import.meta.hot.accept();

  // HMR時のクリーンアップ
  import.meta.hot.dispose(() => {
    console.log("HMR: Cleaning up...");
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
