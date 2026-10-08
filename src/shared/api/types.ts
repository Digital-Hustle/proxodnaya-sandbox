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
  /** FACE — проход в режиме «Сначала лицо» (ADR-038). */
  source: "QR" | "MANUAL" | "FACE";
  score?: number;
  note?: string;
  /** ADR-040: кто принял ручное решение (охранник поста). */
  guard?: string;
  /** ADR-040: проверка ручного пропуска вторым человеком. Нет поля — ждёт подтверждения. */
  review?: ManualReview;
};

export type ManualReview = { status: "CONFIRMED" | "DISPUTED"; by: string; at: number; comment?: string };

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
  /** ADR-038: логика терминала по умолчанию. Киоск может переопределить. */
  terminalMode?: TerminalMode;
  /** ADR-038: что делает киоск без связи с сервером. Автоматического пропуска офлайн нет ни в одном режиме. */
  offlinePolicy?: OfflinePolicy;
  /** ADR-038/040: GLOBAL — логика одна для всех терминалов (по умолчанию), PER_KIOSK — у каждого своя, а здесь — значение по умолчанию. */
  terminalScope?: TerminalScope;
};

export type TerminalScope = "GLOBAL" | "PER_KIOSK";

/** ADR-038. QR_FACE — QR + сверка лица 1:1 (по умолчанию). FACE_FIRST — идентификация по лицу 1:N на сервере, QR — запасной путь. */
export type TerminalMode = "QR_FACE" | "FACE_FIRST";
/** GUARD — без связи пропускает только охранник (MANUAL, с причиной). CLOSED — проход закрыт до восстановления связи. */
export type OfflinePolicy = "GUARD" | "CLOSED";

/** Терминал (киоск). Пока не сопряжён с проходной в админке — показывает код сопряжения и никого не пропускает. */
export type Kiosk = {
  id: string;
  pairCode: string;
  name?: string;
  checkpointId?: string;
  /** Переопределение Settings.terminalMode для этого терминала. */
  mode?: TerminalMode;
  /** Переопределение Settings.offlinePolicy (только при terminalScope = PER_KIOSK). */
  offlinePolicy?: OfflinePolicy;
  pairedAt?: number;
  lastSeen: number;
  createdAt: number;
};

/** Роли панели (FR-60) + инженер терминалов. */
export type Role = "ADMIN" | "SECURITY_OFFICER" | "MANAGER" | "INSTALLER" | "GUARD";

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
  /** ADR-038: сопряжённые и ожидающие терминалы. Необязательно — старые базы без поля. */
  kiosks?: Kiosk[];
};

export type Interval = { workerId: string; zoneId: string; start: number; end?: number };
