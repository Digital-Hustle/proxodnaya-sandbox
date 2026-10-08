import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router";
import { MotionConfig } from "motion/react";
import { Toaster, applyStoredTheme } from "@/shared/ui";
import { router, prefetchRoutes } from "./providers/router";
import "./styles/index.css";

applyStoredTheme();
prefetchRoutes();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <RouterProvider router={router} />
      <Toaster />
    </MotionConfig>
  </StrictMode>,
);
