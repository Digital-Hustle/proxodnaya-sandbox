export const routes = {
  home: "/",
  kiosk: "/kiosk",
  worker: "/worker",
  workerActivate: "/worker/activate",
  workerHistory: "/worker/history",
  workerShifts: "/worker/shifts",
  admin: "/admin",
  adminPeople: "/admin/people",
  adminPersonNew: "/admin/people/new",
  adminPerson: (id: string) => `/admin/people/${id}`,
  adminJournal: "/admin/journal",
  adminShifts: "/admin/shifts",
  adminAnalytics: "/admin/analytics",
  adminAssistant: "/admin/assistant",
  adminSettings: "/admin/settings",
} as const;

/** Абсолютная ссылка на маршрут внутри HashRouter (для QR и «открыть на телефоне»). */
export const absoluteUrl = (path: string) => `${location.origin}${location.pathname}#${path}`;
