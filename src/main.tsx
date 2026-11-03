import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Benign browser warning (layout observers settling a frame late); not a real crash.
window.addEventListener("error", (e) => {
  if (typeof e.message === "string" && e.message.startsWith("ResizeObserver loop")) {
    e.stopImmediatePropagation();
    e.preventDefault();
  }
}, true);

createRoot(document.getElementById("root")!).render(<App />);
