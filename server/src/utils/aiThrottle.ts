/**
 * Serialized, self-pacing request gate for upstream AI providers.
 *
 * A single ingestion fires 8+ Gemini calls back to back (1 Content Spine
 * extraction + 7 deliverables). Free-tier Gemini keys allow only a handful of
 * requests per minute, so firing them without pacing guarantees a 429 storm
 * halfway through generation. This gate:
 *
 *   - runs upstream calls one at a time (no accidental burst),
 *   - keeps a minimum spacing between consecutive calls,
 *   - applies a shared cooldown after a 429 so queued callers back off too,
 *   - relaxes the spacing again after a run of clean successes.
 */
const num = (raw: string | undefined, fallback: number): number => {
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

export class RequestThrottle {
  private queue: Promise<unknown> = Promise.resolve();
  private lastStartedAt = 0;
  private cooldownUntil = 0;
  private consecutiveSuccesses = 0;

  constructor(
    private readonly label: string,
    private baseIntervalMs: number,
    private readonly maxIntervalMs: number
  ) {}

  private currentIntervalMs = 0;

  get intervalMs(): number {
    return this.currentIntervalMs || this.baseIntervalMs;
  }

  /** Milliseconds a new caller would have to wait before its turn starts. */
  get estimatedWaitMs(): number {
    return Math.max(0, this.cooldownUntil - Date.now());
  }

  /** True while a provider-imposed cooldown is still active. */
  isCoolingDown(): boolean {
    return Date.now() < this.cooldownUntil;
  }

  /** Called after a 429 so every queued caller paces itself. */
  penalize(retryAfterSeconds: number): void {
    const waitMs = Math.max(1000, Math.min(retryAfterSeconds || 30, 60) * 1000);
    this.cooldownUntil = Math.max(this.cooldownUntil, Date.now() + waitMs);
    this.currentIntervalMs = Math.min(this.maxIntervalMs, Math.max(this.intervalMs * 2, this.baseIntervalMs));
    this.consecutiveSuccesses = 0;
    console.warn(
      `[Throttle:${this.label}] Cooling down for ${Math.ceil(waitMs / 1000)}s; spacing raised to ${this.currentIntervalMs}ms.`
    );
  }

  /** Called after a clean response so spacing can relax back to baseline. */
  reward(): void {
    this.consecutiveSuccesses++;
    if (this.consecutiveSuccesses >= 3 && this.currentIntervalMs > this.baseIntervalMs) {
      this.currentIntervalMs = Math.max(this.baseIntervalMs, Math.floor(this.currentIntervalMs / 2));
      this.consecutiveSuccesses = 0;
    }
  }

  /** Clears an active cooldown (used when the provider recovers). */
  reset(): void {
    this.cooldownUntil = 0;
    this.currentIntervalMs = this.baseIntervalMs;
    this.consecutiveSuccesses = 0;
  }

  /**
   * Runs `fn` on the shared queue. `deadlineAt` (epoch ms) lets a caller bail
   * out rather than block a serverless request past its budget.
   */
  run<T>(fn: () => Promise<T>, deadlineAt?: number): Promise<T> {
    const task = this.queue.then(async () => {
      const now = Date.now();
      const readyAt = Math.max(this.lastStartedAt + this.intervalMs, this.cooldownUntil);
      const waitMs = Math.max(0, readyAt - now);

      if (deadlineAt && now + waitMs > deadlineAt) {
        const err: any = new Error(
          `Upstream pacing window (${Math.ceil(waitMs / 1000)}s) exceeds the remaining request budget.`
        );
        err.code = 'AI_BUDGET_EXCEEDED';
        err.status = 429;
        err.retryAfterSeconds = Math.ceil(waitMs / 1000);
        throw err;
      }

      if (waitMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }

      this.lastStartedAt = Date.now();
      return fn();
    });

    // Keep the chain alive regardless of individual task outcomes.
    this.queue = task.then(
      () => undefined,
      () => undefined
    );

    return task;
  }
}

export const geminiThrottle = new RequestThrottle(
  'gemini',
  num(process.env.GEMINI_MIN_INTERVAL_MS, 1100),
  num(process.env.GEMINI_MAX_INTERVAL_MS, 15000)
);

/** Total wall-clock budget for one end-to-end pipeline request. */
export const PIPELINE_BUDGET_MS = num(process.env.AI_PIPELINE_BUDGET_MS, 50_000);

/** Per-provider-call ceiling, so one slow call cannot eat the whole budget. */
export const PROVIDER_CALL_BUDGET_MS = num(process.env.AI_PROVIDER_CALL_BUDGET_MS, 25_000);

export function createDeadline(budgetMs: number = PIPELINE_BUDGET_MS): number {
  return Date.now() + budgetMs;
}

export function remainingMs(deadlineAt?: number): number {
  if (!deadlineAt) return Number.POSITIVE_INFINITY;
  return deadlineAt - Date.now();
}

export function isExpired(deadlineAt?: number): boolean {
  return remainingMs(deadlineAt) <= 0;
}

/** Rejects if `promise` outlives `timeoutMs` (upstream SDK has no timeout option). */
export async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return promise;
  let timer: NodeJS.Timeout;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      const err: any = new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)}s.`);
      err.code = 'AI_CALL_TIMEOUT';
      reject(err);
    }, timeoutMs);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer!);
  }
}
