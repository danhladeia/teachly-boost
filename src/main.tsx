import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

const root = document.getElementById("root")!;

// Remove static SEO fallback content before React mounts
const seoFallback = document.getElementById("seo-fallback");
if (seoFallback) seoFallback.remove();

createRoot(root).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);
