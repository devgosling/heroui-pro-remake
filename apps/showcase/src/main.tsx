import {OverlayScrollbars} from "@heroui/pro";
import {StrictMode} from "react";
import {createRoot} from "react-dom/client";

import {App} from "./app";

import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OverlayScrollbars />
    <App />
  </StrictMode>,
);
