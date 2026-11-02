import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import PwaInstallPrompt from "./PwaInstallPrompt.jsx";
import "./theme.css";

// Service workers require HTTPS, except on localhost during development.
if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { updateViaCache: "none" })
      .then((registration) => {
        registration.update().catch(() => {});
        console.info("SkillSwap Campus app worker is ready:", registration.scope);
      })
      .catch((error) => {
        console.error("SkillSwap Campus service worker registration failed:", error);
      });
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <>
      <App />
      <PwaInstallPrompt />
    </>
  </StrictMode>
);
