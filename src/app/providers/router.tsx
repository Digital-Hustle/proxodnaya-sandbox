import { createHashRouter, Navigate } from "react-router";
import { HomePage } from "@/pages/home";
import { AdminShell } from "@/widgets/admin-shell";
import { WorkerShell } from "@/widgets/worker-shell";

// Каждая страница — отдельный чанк (recharts, zxing, ogl и т. п. не грузятся на главной).
// react-router дожидается чанка до смены экрана, поэтому переход без мигания пустого экрана.
const kiosk = () => import("@/pages/kiosk");
const worker = () => import("@/pages/worker");
const dashboard = () => import("@/pages/admin-dashboard");
const people = () => import("@/pages/admin-people");
const journal = () => import("@/pages/admin-journal");
const shifts = () => import("@/pages/admin-shifts");
const analytics = () => import("@/pages/admin-analytics");
const assistant = () => import("@/pages/admin-assistant");
const settings = () => import("@/pages/admin-settings");

/** Фоновая предзагрузка всех страниц после первого экрана: дальнейшие переходы мгновенные. */
export const prefetchRoutes = () => {
  const run = () => [kiosk, worker, dashboard, people, journal, shifts, analytics, assistant, settings].forEach((f) => { f().catch(() => {}); });
  if ("requestIdleCallback" in window) requestIdleCallback(run); else setTimeout(run, 1);
};

// HashRouter: GitHub Pages и любой статический хостинг без настройки fallback.
export const router = createHashRouter([
  { path: "/", element: <HomePage /> },
  { path: "/kiosk", lazy: async () => ({ Component: (await kiosk()).KioskPage }) },
  { path: "/worker/activate", lazy: async () => ({ Component: (await worker()).WorkerActivatePage }) },
  {
    path: "/worker", element: <WorkerShell />,
    children: [
      { index: true, lazy: async () => ({ Component: (await worker()).WorkerPassPage }) },
      { path: "history", lazy: async () => ({ Component: (await worker()).WorkerHistoryPage }) },
      { path: "shifts", lazy: async () => ({ Component: (await worker()).WorkerShiftsPage }) },
    ],
  },
  {
    path: "/admin", element: <AdminShell />,
    children: [
      { index: true, lazy: async () => ({ Component: (await dashboard()).DashboardPage }) },
      { path: "people", lazy: async () => ({ Component: (await people()).PeoplePage }) },
      { path: "people/new", lazy: async () => ({ Component: (await people()).NewPersonPage }) },
      { path: "people/:id", lazy: async () => ({ Component: (await people()).PersonPage }) },
      { path: "journal", lazy: async () => ({ Component: (await journal()).JournalPage }) },
      { path: "shifts", lazy: async () => ({ Component: (await shifts()).ShiftsPage }) },
      { path: "analytics", lazy: async () => ({ Component: (await analytics()).AnalyticsPage }) },
      { path: "assistant", lazy: async () => ({ Component: (await assistant()).AssistantPage }) },
      { path: "settings", lazy: async () => ({ Component: (await settings()).SettingsPage }) },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
