import { useEffect, useState } from "react";
import "./PwaInstallPrompt.css";

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) ||
    (window.navigator.platform === "MacIntel" && window.navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return window.matchMedia?.("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
}

export default function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (isStandalone()) return undefined;

    const handleBeforeInstall = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const handleInstalled = () => {
      setInstallPrompt(null);
      setShowIosHelp(false);
      setHidden(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (hidden || isStandalone()) return null;

  async function handleInstall() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  if (installPrompt) {
    return (
      <aside className="pwa-install-card" aria-label="Install SkillSwap Campus">
        <div className="pwa-install-copy">
          <strong>Get the SkillSwap app</strong>
          <span>Install it on your phone for an app-like experience.</span>
        </div>
        <button type="button" className="pwa-install-action" onClick={handleInstall}>Install</button>
        <button type="button" className="pwa-install-close" aria-label="Dismiss install prompt" onClick={() => setHidden(true)}>×</button>
      </aside>
    );
  }

  if (isIosDevice() && !showIosHelp) {
    return (
      <button type="button" className="pwa-ios-install-link" onClick={() => setShowIosHelp(true)}>
        Add SkillSwap to Home Screen
      </button>
    );
  }

  if (showIosHelp) {
    return (
      <aside className="pwa-ios-help" role="dialog" aria-modal="true" aria-labelledby="pwa-ios-title">
        <button type="button" className="pwa-install-close" aria-label="Close instructions" onClick={() => setShowIosHelp(false)}>×</button>
        <strong id="pwa-ios-title">Install SkillSwap Campus</strong>
        <ol>
          <li>Open this website in <strong>Safari</strong>.</li>
          <li>Tap the <strong>Share</strong> button.</li>
          <li>Choose <strong>Add to Home Screen</strong>, then tap <strong>Add</strong>.</li>
        </ol>
      </aside>
    );
  }

  return null;
}
