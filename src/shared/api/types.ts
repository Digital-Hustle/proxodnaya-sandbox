// Контракты песочницы. Повторяют docs/API.md основного репо в упрощённом виде.
export type Decision = "ALLOW" | "DENY" | "MANUAL" | "ERROR";
export type Direction = "IN" | "OUT";
/** Режим КПП: AUTO — направление выводится из состояния присутствия (ADR-037), IN/OUT — турникет одного направления. */
export type CheckpointMode = "AUTO" | Direction;
export type ReasonCode =
  | "OK" | "QR_MISSING" | "QR_INVALID" | "QR_EXPIRED" | "QR_REUSED" | "DEVICE_UNKNOWN" | "DEVICE_REVOKED" | "DEVICE_MISMATCH"
  | "WORKER_BLOCKED" | "FACE_NOT_FOUND" | "FACE_LOW_QUALITY" | "FACE_MISMATCH" | "LIVENESS_FAILED" | "CHALLENGE_EXPIRED"
  | "NO_SHIFT" | "OUTSIDE_SHIFT_WINDOW" | "PERMIT_EXPIRED" | "NO_ZONE_PERMIT" | "ALREADY_INSIDE" | "NOT_INSIDE"
  | "TEMP_LOCKED" | "MANUAL_GUARD" | "SYSTEM_ERROR" | "REPEAT_SCAN";

export type WorkerStatus = "active" | "blocked";

export type Worker = {
  id: string;
  fullName: string;
  position: string;
  contractor: string;
  photo?: string;
  status: WorkerStatus;
  zoneIds: string[];
  permitUntil: string; // инструктаж/медосмотр, YYYY-MM-DD
  inviteCode?: string;
  createdAt: number;
};

export type Device = { id: string; workerId: string; publicKey: string; createdAt: number; revokedAt?: number; label: string };
export type Zone = { id: string; name: string; capacity: number };
export type Checkpoint = { id: string; name: string; zoneId: string; mode?: CheckpointMode };
export type Shift = { id: string; workerId: string; day: string; start: string; end: string };

export type Attempt = {
  id: string;
  ts: number;
  workerId?: string;
  checkpointId: string;
  direction: Direction;
  decision: Decision;
  code: ReasonCode;
  source: "QR" | "MANUAL";
  score?: number;
  note?: string;
};

export type Challenge = { kind: "turn-left" | "turn-right" | "blink" | "nod"; text: string; timeoutMs: number };

export type FrameStat = { brightness: number; motion: number; contrast: number };

export type DecisionResult = {
  attemptId: string;
  decision: Decision;
  code: ReasonCode;
  message: string;
  hint: string;
  worker?: Pick<Worker, "id" | "fullName" | "position" | "photo" | "contractor">;
  direction: Direction;
  score?: number;
  ts: number;
};

export type Settings = {
  faceThreshold: number;
  qrToleranceSec: number;
  shiftGraceMin: number;
  requireShift: boolean;
  /** Песочница: что вернёт «сверка лица» — настоящей биометрии здесь нет. */
  demoFace: "match" | "mismatch";
  /** ADR-037: повторное предъявление после успешного прохода раньше этого срока отклоняется (REPEAT_SCAN). */
  repeatScanCooldownSec?: number;
  /** ADR-037: незакрытый вход старше этого срока считается «забытым выходом» — следующий скан снова вход. */
  presenceTtlHours?: number;
};

export type Db = {
  version: number;
  workers: Worker[];
  devices: Device[];
  zones: Zone[];
  checkpoints: Checkpoint[];
  shifts: Shift[];
  attempts: Attempt[];
  qrUses: string[];
  settings: Settings;
};

export type Interval = { workerId: string; zoneId: string; start: number; end?: number };
