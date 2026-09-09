import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";

// Bootstrap first, then our own sheets, so local rules win on equal specificity.
import "bootstrap/dist/css/bootstrap.min.css";
import "./styles/base.css";
import "./styles/components.css";
import "./styles/utilities.css";

const container = document.getElementById("root");

if (!container) {
  throw new Error('Root element "#root" was not found in index.html');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
