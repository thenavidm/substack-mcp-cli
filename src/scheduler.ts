/**
 * Scheduling Notes from here.
 *
 * Substack's own composer can schedule a Note (since April 2026). This queue adds
 * scheduling from an AI tool or the command line, in batches, with a list you can
 * check and cancel. A timer in this process publishes each Note when it comes due.
 *
 * It only fires while a server is running. A Note scheduled for 9am publishes at
 * 9am if the machine is awake with an MCP client open, and otherwise on the next
 * start after that time, marked late. For Notes that must go out on time with the
 * laptop shut, run the server over HTTP or in Docker, or schedule in Substack.
 *
 * Several servers can share one queue: every AI tool you open starts its own. So
 * the queue is changed only under a lock file, a Note is claimed before it is
 * sent so no other server sends it again, and every write lands whole or not at
 * all. A queue file that cannot be read is kept and reported, never overwritten.
 */

import {
  closeSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  renameSync,
  statSync,
  unlinkSync,
  writeFileSync,
  writeSync,
} from "node:fs";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { sessionHome } from "./auth/session.js";

export type ScheduledNote = {
  id: string;
  text: string;
  publish_at: string;
  publication_url: string;
  /**
   * scheduled: waiting for its time, or for its next try.
   * publishing: claimed by a server that is sending it right now.
   * check: it may or may not have gone out (a timeout, or a server that stopped
   *   mid-send). Look at your Notes before scheduling it again.
   */
  status: "scheduled" | "publishing" | "published" | "failed" | "check" | "canceled";
  created_at: string;
  published_at?: string;
  published_late?: boolean;
  note_id?: number;
  error?: string;
  attempts?: number;
  next_attempt_at?: string;
  claimed_at?: string;
  claimed_by?: string;
};

const FILENAME = "scheduled-notes.json";
const LOCKNAME = "scheduled-notes.lock";
/** A lock older than this was left by a process that died holding it. */
const STALE_LOCK_MS = 30_000;
/** How long to wait for another server to finish with the queue. */
const LOCK_WAIT_MS = 10_000;
/** A claim this old means its server stopped mid-send. */
export const STALE_CLAIM_MS = 10 * 60_000;
/** Tries in all, and the wait before each retry. */
export const MAX_ATTEMPTS = 4;
const RETRY_AFTER_MS = [60_000, 5 * 60_000, 15 * 60_000];

export class QueueError extends Error {}

function home(): string {
  const dir = sessionHome();
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true, mode: 0o700 });
  return dir;
}

function queuePath(): string {
  return join(home(), FILENAME);
}

function pause(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Run fn while holding the queue's lock file, so no other server changes the queue meanwhile. */
function withLock<T>(fn: () => T): T {
  const lock = join(home(), LOCKNAME);
  const giveUp = Date.now() + LOCK_WAIT_MS;
  for (;;) {
    try {
      const fd = openSync(lock, "wx", 0o600);
      writeSync(fd, `${process.pid} ${new Date().toISOString()}\n`);
      closeSync(fd);
      break;
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
      try {
        if (Date.now() - statSync(lock).mtimeMs > STALE_LOCK_MS) {
          unlinkSync(lock);
          continue;
        }
      } catch {
        continue; // released between the open and the stat
      }
      if (Date.now() > giveUp) {
        throw new QueueError(`The scheduled Notes queue is busy (${lock}). Try again in a moment.`);
      }
      pause(25);
    }
  }
  try {
    return fn();
  } finally {
    try {
      unlinkSync(lock);
    } catch {
      // already gone
    }
  }
}

function readQueue(): ScheduledNote[] {
  const path = queuePath();
  if (!existsSync(path)) return [];
  const raw = readFileSync(path, "utf8");
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (Array.isArray(parsed)) return parsed as ScheduledNote[];
  } catch {
    // reported below
  }
  // Never treat an unreadable queue as empty: the next write would wipe every
  // Note in it. Keep a copy and stop until someone looks.
  const copy = `${path}.unreadable-${Date.now()}`;
  copyFileSync(path, copy);
  throw new QueueError(
    `The scheduled Notes queue at ${path} cannot be read, so nothing in it will publish. A copy is at ${copy}. Fix or remove ${path} to continue.`,
  );
}

/** Write the whole queue to a temporary file, then swap it in, so a crash never leaves half a file. */
function writeQueue(notes: ScheduledNote[]): void {
  const path = queuePath();
  const tmp = `${path}.${process.pid}.${randomUUID()}.tmp`;
  writeFileSync(tmp, JSON.stringify(notes, null, 2), { mode: 0o600 });
  renameSync(tmp, path);
}

export function listScheduled(status?: ScheduledNote["status"]): ScheduledNote[] {
  const notes = withLock(readQueue);
  const filtered = status ? notes.filter((n) => n.status === status) : notes;
  return filtered.sort((a, b) => a.publish_at.localeCompare(b.publish_at));
}

export function schedule(text: string, publishAt: Date, publicationUrl: string): ScheduledNote {
  const note: ScheduledNote = {
    id: randomUUID(),
    text,
    publish_at: publishAt.toISOString(),
    publication_url: publicationUrl,
    status: "scheduled",
    created_at: new Date().toISOString(),
    attempts: 0,
  };
  withLock(() => {
    const queue = readQueue();
    queue.push(note);
    writeQueue(queue);
  });
  return note;
}

export function cancel(id: string): ScheduledNote | null {
  return withLock(() => {
    const queue = readQueue();
    const note = queue.find((n) => n.id === id && n.status === "scheduled");
    if (!note) return null;
    note.status = "canceled";
    writeQueue(queue);
    return note;
  });
}

export type Publisher = (note: ScheduledNote) => Promise<{ id?: number }>;

function statusOf(err: unknown): number | undefined {
  const s = (err as { status?: unknown } | null)?.status;
  return typeof s === "number" ? s : undefined;
}

/**
 * What a failed send means. The API client has already retried within the send,
 * so this decides between trying again in a few minutes, asking the writer to
 * check, and giving up with the reason.
 */
function afterFailure(note: ScheduledNote, err: unknown, now: number): void {
  const status = statusOf(err);
  const message = err instanceof Error ? err.message : String(err);
  const attempts = (note.attempts ?? 0) + 1;
  note.attempts = attempts;
  note.error = message;
  delete note.claimed_at;
  delete note.claimed_by;
  // No response in time: Substack may have published it anyway, so sending it
  // again could post it twice.
  if (status === 408) {
    note.status = "check";
    note.error = `${message} It may or may not have gone out. Check your Notes before scheduling it again.`;
    return;
  }
  // Never reached Substack, rate limited, or a server error: safe to try again.
  const retryable = status === 0 || status === 429 || (status !== undefined && status >= 500);
  if (retryable && attempts < MAX_ATTEMPTS) {
    note.status = "scheduled";
    const delay = RETRY_AFTER_MS[Math.min(attempts - 1, RETRY_AFTER_MS.length - 1)] ?? 15 * 60_000;
    note.next_attempt_at = new Date(now + delay).toISOString();
    return;
  }
  note.status = "failed";
}

/**
 * Publish every Note that is due, once. Started when the server boots and then
 * every minute. Notes are claimed under the lock before any is sent, so two
 * servers, or two overlapping runs of one, never send the same Note. They go
 * out one at a time, in order: firing them together invites rate limits.
 */
export async function drain(publish: Publisher, now: () => number = Date.now): Promise<number> {
  const claim = randomUUID();
  let due: ScheduledNote[];
  try {
    due = withLock(() => {
      const queue = readQueue();
      const t = now();
      const picked: ScheduledNote[] = [];
      let changed = false;
      for (const n of queue) {
        if (n.status === "publishing" && n.claimed_at && t - Date.parse(n.claimed_at) > STALE_CLAIM_MS) {
          n.status = "check";
          n.error = "Publishing was interrupted, so it may or may not have gone out. Check your Notes before scheduling it again.";
          delete n.claimed_at;
          delete n.claimed_by;
          changed = true;
        }
        const waiting = n.next_attempt_at !== undefined && Date.parse(n.next_attempt_at) > t;
        if (n.status === "scheduled" && Date.parse(n.publish_at) <= t && !waiting) {
          n.status = "publishing";
          n.claimed_at = new Date(t).toISOString();
          n.claimed_by = claim;
          picked.push({ ...n });
          changed = true;
        }
      }
      if (changed) writeQueue(queue);
      return picked.sort((a, b) => a.publish_at.localeCompare(b.publish_at));
    });
  } catch {
    return 0; // the queue is busy or unreadable; listScheduled reports why
  }

  let published = 0;
  for (const note of due) {
    let outcome: (n: ScheduledNote) => void;
    try {
      const result = await publish(note);
      const lateBy = now() - Date.parse(note.publish_at);
      const at = new Date(now()).toISOString();
      outcome = (n) => {
        n.status = "published";
        n.published_at = at;
        n.note_id = result.id;
        n.published_late = lateBy > 120_000;
        n.attempts = (n.attempts ?? 0) + 1;
        delete n.error;
        delete n.next_attempt_at;
        delete n.claimed_at;
        delete n.claimed_by;
      };
      published++;
    } catch (err) {
      const t = now();
      outcome = (n) => afterFailure(n, err, t);
    }
    settle(note.id, claim, outcome);
  }
  return published;
}

/** Record how a send ended, but only on the claim this run made. */
function settle(id: string, claim: string, apply: (n: ScheduledNote) => void): void {
  for (let i = 0; i < 3; i++) {
    try {
      withLock(() => {
        const queue = readQueue();
        const note = queue.find((n) => n.id === id && n.claimed_by === claim);
        if (!note) return;
        apply(note);
        writeQueue(queue);
      });
      return;
    } catch {
      pause(200);
    }
  }
  // Could not record it: the claim stays, and after STALE_CLAIM_MS the Note is
  // marked for checking rather than sent again.
}

export class NoteScheduler {
  private timer?: NodeJS.Timeout;
  private running = false;
  private readonly publish: Publisher;

  constructor(publish: Publisher) {
    this.publish = publish;
  }

  /** One run at a time in this process: a slow send never overlaps the next tick. */
  private tick(): void {
    if (this.running) return;
    this.running = true;
    void drain(this.publish)
      .catch(() => undefined)
      .finally(() => {
        this.running = false;
      });
  }

  start(intervalMs = 60_000): void {
    if (this.timer) return;
    // Catch anything that came due while the process was down.
    this.tick();
    this.timer = setInterval(() => this.tick(), intervalMs);
    // Never hold the process open on this timer alone.
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }
}
