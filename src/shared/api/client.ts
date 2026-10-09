// HTTP-клиент для реального бэкенда (gateway).
// Замена моков: вместо localStorage и BroadcastChannel — HTTP-запросы к серверу.
// Базовый URL — window.location.origin (Caddy проксирует /access/... → gateway).
// Токен — из localStorage, выставляется после OIDC-логина (Keycloak).
const BASE = "";

function token(): string {
  return localStorage.getItem("access_token") ?? "";
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token()) headers["Authorization"] = `Bearer ${token()}`;
  const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? err.detail ?? `HTTP ${res.status}`);
  }
  return res.json();
}

function get<T>(path: string): Promise<T> { return req<T>("GET", path); }

function post<T>(path: string, body?: unknown): Promise<T> { return req<T>("POST", path, body); }

function put<T>(path: string, body?: unknown): Promise<T> { return req<T>("PUT", path, body); }

function del(path: string): Promise<void> { req<void>("DELETE", path); return Promise.resolve(); }

// ─── Kiosk ───
export async function kioskScan(qr: string, direction: string, checkpointId: string) {
  return post("/access/api/v1/kiosk/attempts", { qr, direction, checkpointId });
}

export async function kioskFrames(token: string, frames: string[]) {
  return post(`/access/api/v1/kiosk/attempts/${token}/frames`, { frames });
}

export async function kioskManual(workerId: string, direction: string, checkpointId: string, reason: string) {
  return post("/access/api/v1/kiosk/manual", { workerId, direction, checkpointId, reason });
}

// ─── Settings ───
export async function getSettings() {
  return get("/access/api/v1/kiosk/settings");
}

export async function updateSettings(s: Record<string, unknown>) {
  return put("/access/api/v1/kiosk/settings", s);
}

// ─── Workers ───
export async function getWorkers(query?: string, filter?: string, cursor?: string, limit?: number) {
  const p = new URLSearchParams();
  if (query) p.set("q", query);
  if (filter) p.set("filter", filter);
  if (cursor) p.set("cursor", cursor);
  if (limit) p.set("limit", String(limit));
  return get(`/people/api/v1/workers?${p}`);
}

export async function getWorker(id: string) {
  return get(`/people/api/v1/workers/${id}`);
}

export async function createWorker(draft: Record<string, unknown>) {
  return post("/people/api/v1/workers", draft);
}

export async function updateWorker(id: string, patch: Record<string, unknown>) {
  return req("PATCH", `/people/api/v1/workers/${id}`, patch);
}

export async function blockWorker(id: string) {
  return post(`/people/api/v1/workers/${id}/block`);
}

export async function unblockWorker(id: string) {
  return post(`/people/api/v1/workers/${id}/unblock`);
}

export async function generateInvite(id: string) {
  return post(`/people/api/v1/workers/${id}/invite`);
}

export async function getDevices(id: string) {
  return get(`/people/api/v1/workers/${id}/devices`);
}

export async function revokeDevice(workerId: string, deviceId: string) {
  return del(`/people/api/v1/workers/${workerId}/devices/${deviceId}`);
}

export async function enrollFace(workerId: string, frames: string[]) {
  return post(`/people/api/v1/workers/${workerId}/face`, { frames });
}

export async function deleteFace(workerId: string) {
  return del(`/people/api/v1/workers/${workerId}/face`);
}

// ─── Sites / Zones / Checkpoints ───
export async function getSites() {
  return get("/people/api/v1/sites");
}

export async function getZones(siteId?: string) {
  return get(`/people/api/v1/zones${siteId ? `?siteId=${siteId}` : ""}`);
}

export async function getCheckpoints(zoneId?: string) {
  return get(`/people/api/v1/checkpoints${zoneId ? `?zoneId=${zoneId}` : ""}`);
}

// ─── Shifts ───
export async function getShifts(params?: Record<string, string>) {
  const p = new URLSearchParams(params ?? {});
  return get(`/shift/api/v1/shifts?${p}`);
}

export async function createShift(shift: Record<string, unknown>) {
  return post("/shift/api/v1/shifts", shift);
}

export async function deleteShift(id: string) {
  return del(`/shift/api/v1/shifts/${id}`);
}

// ─── Analytics ───
export async function getSummary() {
  return get("/shift/api/v1/analytics/summary");
}

export async function getHours(from: string, to: string, worker?: string, zone?: string) {
  const p = new URLSearchParams({ from, to });
  if (worker) p.set("worker", worker);
  if (zone) p.set("zone", zone);
  return get(`/shift/api/v1/analytics/hours?${p}`);
}

export async function getLateOvertime(from: string, to: string, worker?: string) {
  const p = new URLSearchParams({ from, to });
  if (worker) p.set("worker", worker);
  return get(`/shift/api/v1/analytics/late-overtime?${p}`);
}

// ─── Intervals ───
export async function getIntervals(params?: Record<string, string>) {
  const p = new URLSearchParams(params ?? {});
  return get(`/shift/api/v1/intervals?${p}`);
}

// ─── Reports ───
export async function getTimesheet(from: string, to: string, contractor?: string) {
  const p = new URLSearchParams({ from, to });
  if (contractor) p.set("contractor", contractor);
  return get(`/shift/api/v1/reports/timesheet?${p}`);
}

// ─── Worker (phone) ───
export async function getWorkerMe() {
  return get("/shift/api/v1/worker/me");
}

export async function getWorkerShifts(from?: string, to?: string) {
  const p = new URLSearchParams();
  if (from) p.set("from", from);
  if (to) p.set("to", to);
  return get(`/shift/api/v1/worker/shifts?${p}`);
}

// ─── Attempts (journal) ───
export async function getAttempts(params?: Record<string, string>) {
  const p = new URLSearchParams(params ?? {});
  return get(`/access/api/v1/attempts?${p}`);
}

export async function getWorkerAttempts(cursor?: string, limit?: number) {
  const p = new URLSearchParams();
  if (cursor) p.set("cursor", cursor);
  if (limit) p.set("limit", String(limit));
  return get(`/access/api/v1/worker/attempts?${p}`);
}

// ─── Security ───
export async function verifyJournal() {
  return post("/access/api/v1/security/journal/verify");
}

// ─── Simulator ───
export async function simulateRun(rq: Record<string, unknown>) {
  return post("/access/api/v1/simulator/runs", rq);
}

// ─── Auth ───
export async function activateDevice(code: string, deviceId: string, publicKeyJwk: Record<string, unknown>) {
  return post("/people/api/v1/auth/activate", { inviteCode: code, deviceId, publicKeyJwk });
}

// ─── Assistant ───
export async function askAssistant(question: string) {
  return post("/assistant/api/v1/assistant/ask", { question });
}

export async function assistantStatus() {
  return get("/assistant/api/v1/assistant/status");
}

// ─── SSE stream ───
export async function getStreamTicket() {
  return get("/shift/api/v1/stream/ticket");
}

export function openSituationStream(ticket: string, lastEventId?: string, onEvent?: (e: MessageEvent) => void) {
  const params = new URLSearchParams({ ticket });
  if (lastEventId) params.set("lastEventId", lastEventId);
  const sse = new EventSource(`/shift/api/v1/stream/situation?${params}`);
  if (onEvent) sse.onmessage = onEvent;
  return sse;
}

export function openWorkerStream(ticket: string, lastEventId?: string, onEvent?: (e: MessageEvent) => void) {
  const params = new URLSearchParams({ ticket });
  if (lastEventId) params.set("lastEventId", lastEventId);
  const sse = new EventSource(`/shift/api/v1/stream/worker?${params}`);
  if (onEvent) sse.onmessage = onEvent;
  return sse;
}