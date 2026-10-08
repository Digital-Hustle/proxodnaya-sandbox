import { createHashRouter, Navigate } from "react-router";
import { HomePage } from "@/pages/home";
import { KioskPage } from "@/pages/kiosk";
import { WorkerActivatePage, WorkerPassPage, WorkerHistoryPage, WorkerShiftsPage } from "@/pages/worker";
import { DashboardPage } from "@/pages/admin-dashboard";
import { PeoplePage, NewPersonPage, PersonPage } from "@/pages/admin-people";
import { JournalPage } from "@/pages/admin-journal";
import { ShiftsPage } from "@/pages/admin-shifts";
import { AnalyticsPage } from "@/pages/admin-analytics";
import { AssistantPage } from "@/pages/admin-assistant";
import { SettingsPage } from "@/pages/admin-settings";
import { AdminShell } from "@/widgets/admin-shell";
import { WorkerShell } from "@/widgets/worker-shell";

// HashRouter: GitHub Pages и любой статический хостинг без настройки fallback.
export const router = createHashRouter([
  { path: "/", element: <HomePage /> },
  { path: "/kiosk", element: <KioskPage /> },
  { path: "/worker/activate", element: <WorkerActivatePage /> },
  {
    path: "/worker", element: <WorkerShell />,
    children: [
      { index: true, element: <WorkerPassPage /> },
      { path: "history", element: <WorkerHistoryPage /> },
      { path: "shifts", element: <WorkerShiftsPage /> },
    ],
  },
  {
    path: "/admin", element: <AdminShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "people", element: <PeoplePage /> },
      { path: "people/new", element: <NewPersonPage /> },
      { path: "people/:id", element: <PersonPage /> },
      { path: "journal", element: <JournalPage /> },
      { path: "shifts", element: <ShiftsPage /> },
      { path: "analytics", element: <AnalyticsPage /> },
      { path: "assistant", element: <AssistantPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
