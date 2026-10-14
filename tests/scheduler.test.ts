// The Notes queue: every Note sent once, nothing lost, and an honest status for anything uncertain.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, readdirSync, readFileSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { cancel, drain, listScheduled, MAX_ATTEMPTS, QueueError, schedule, STALE_CLAIM_MS, type ScheduledNote } from "../src/scheduler.js";

let home: string;
const T0 = Date.parse("2026-10-14T09:00:00Z");
const at = (ms: number) => () => T0 + ms;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const queueFile = () => join(home, "scheduled-notes.json");
const fail = (status: number, message = `HTTP ${status}`) => Object.assign(new Error(message), { status });

beforeEach(() => {
  home = mkdtempSync(join(tmpdir(), "notes-queue-"));
  process.env.SUBSTACK_MCP_HOME = home;
});
afterEach(() => {
  delete process.env.SUBSTACK_MCP_HOME;
});

function recorder(behaviour: (n: ScheduledNote) => Promise<{ id?: number }> = async () => ({ id: 1 })) {
  const sent: string[] = [];
  const publish = async (n: ScheduledNote) => {
    sent.push(n.text);
    return behaviour(n);
  };
  return { sent, publish };
}

describe("scheduling", () => {
  it("lists what was scheduled, soonest first, and cancels only what is still waiting", () => {
    const later = schedule("later", new Date(T0 + 7_200_000), "a.substack.com");
    schedule("sooner", new Date(T0 + 3_600_000), "a.substack.com");
    expect(listScheduled().map((n) => n.text)).toEqual(["sooner", "later"]);
    expect(cancel(later.id)?.status).toBe("canceled");
    expect(cancel(later.id)).toBeNull();
  });

  it("leaves no half-written files behind", async () => {
    schedule("one", new Date(T0 - 1000), "a.substack.com");
    await drain(recorder().publish, at(0));
    expect(readdirSync(home).filter((f) => f.endsWith(".tmp") || f.endsWith(".lock"))).toEqual([]);
  });
});

describe("publishing", () => {
  it("publishes what is due, once, in order, and leaves the rest", async () => {
    schedule("second", new Date(T0 - 1000), "a.substack.com");
    schedule("first", new Date(T0 - 5000), "a.substack.com");
    schedule("tomorrow", new Date(T0 + 86_400_000), "a.substack.com");
    const r = recorder();
    expect(await drain(r.publish, at(0))).toBe(2);
    expect(r.sent).toEqual(["first", "second"]);
    expect(await drain(r.publish, at(60_000))).toBe(0);
    expect(r.sent).toEqual(["first", "second"]);
    expect(listScheduled("scheduled").map((n) => n.text)).toEqual(["tomorrow"]);
  });

  it("marks a Note published late when the server was down at its time", async () => {
    schedule("late one", new Date(T0), "a.substack.com");
    await drain(recorder().publish, at(3 * 3_600_000));
    const [n] = listScheduled("published");
    expect(n.published_late).toBe(true);
  });

  it("sends a Note once when two servers drain the same queue at the same moment", async () => {
    for (let i = 0; i < 5; i++) schedule(`note ${i}`, new Date(T0 - 1000), "a.substack.com");
    const r = recorder(async () => {
      await wait(30); // a slow send, so the runs overlap
      return { id: 1 };
    });
    const runs = await Promise.all([drain(r.publish, at(0)), drain(r.publish, at(0)), drain(r.publish, at(0))]);
    expect(runs.reduce((a, b) => a + b, 0)).toBe(5);
    expect(r.sent.sort()).toEqual(["note 0", "note 1", "note 2", "note 3", "note 4"]);
    expect(listScheduled("published")).toHaveLength(5);
  });

  it("never sends again a Note whose server stopped mid-send, and asks for a check", async () => {
    const n = schedule("half sent", new Date(T0 - 1000), "a.substack.com");
    const q = JSON.parse(readFileSync(queueFile(), "utf8")) as ScheduledNote[];
    Object.assign(q[0], { status: "publishing", claimed_at: new Date(T0).toISOString(), claimed_by: "gone" });
    writeFileSync(queueFile(), JSON.stringify(q));
    const r = recorder();
    await drain(r.publish, at(STALE_CLAIM_MS / 2));
    expect(listScheduled()[0].status).toBe("publishing"); // still within its claim
    await drain(r.publish, at(STALE_CLAIM_MS + 1000));
    expect(r.sent).toEqual([]);
    const after = listScheduled().find((x) => x.id === n.id)!;
    expect(after.status).toBe("check");
    expect(after.error).toMatch(/may or may not have gone out/);
  });
});

describe("failures", () => {
  it("tries again after a minute when Substack could not be reached, then publishes", async () => {
    schedule("flaky", new Date(T0 - 1000), "a.substack.com");
    let calls = 0;
    const r = recorder(async () => {
      if (calls++ === 0) throw fail(0, "Could not reach Substack");
      return { id: 9 };
    });
    await drain(r.publish, at(0));
    let [n] = listScheduled();
    expect(n.status).toBe("scheduled");
    expect(n.attempts).toBe(1);
    await drain(r.publish, at(30_000)); // too soon
    expect(r.sent).toHaveLength(1);
    await drain(r.publish, at(61_000));
    [n] = listScheduled();
    expect(n.status).toBe("published");
    expect(n.note_id).toBe(9);
    expect(n.attempts).toBe(2);
  });

  it("gives up after the last try on a server that keeps failing", async () => {
    schedule("doomed", new Date(T0 - 1000), "a.substack.com");
    const r = recorder(async () => {
      throw fail(503);
    });
    let t = 0;
    for (let i = 0; i < MAX_ATTEMPTS + 2; i++) {
      await drain(r.publish, at(t));
      t += 16 * 60_000;
    }
    expect(r.sent).toHaveLength(MAX_ATTEMPTS);
    expect(listScheduled()[0].status).toBe("failed");
  });

  it("does not resend after a timeout, because it may already be live", async () => {
    schedule("timed out", new Date(T0 - 1000), "a.substack.com");
    const r = recorder(async () => {
      throw fail(408, "No response from Substack within 30000ms.");
    });
    await drain(r.publish, at(0));
    await drain(r.publish, at(3_600_000));
    expect(r.sent).toHaveLength(1);
    expect(listScheduled()[0].status).toBe("check");
  });

  it("stops at once on an error a retry cannot fix, such as a lapsed login", async () => {
    schedule("logged out", new Date(T0 - 1000), "a.substack.com");
    const r = recorder(async () => {
      throw fail(401, "Your Substack session has expired.");
    });
    await drain(r.publish, at(0));
    const [n] = listScheduled();
    expect(n.status).toBe("failed");
    expect(n.error).toMatch(/expired/);
  });
});

describe("the queue file", () => {
  it("is never wiped when it cannot be read: a copy is kept and the error says where", async () => {
    schedule("precious", new Date(T0 + 3_600_000), "a.substack.com");
    writeFileSync(queueFile(), '[{"id": "precious", "text": "half a fi');
    expect(() => listScheduled()).toThrow(QueueError);
    expect(() => schedule("new", new Date(T0 + 7_200_000), "a.substack.com")).toThrow(/cannot be read/);
    expect(await drain(recorder().publish, at(0))).toBe(0);
    expect(readFileSync(queueFile(), "utf8")).toBe('[{"id": "precious", "text": "half a fi');
    expect(readdirSync(home).some((f) => f.includes(".unreadable-"))).toBe(true);
  });

  it("clears a lock left by a server that crashed holding it", () => {
    const lock = join(home, "scheduled-notes.lock");
    writeFileSync(lock, "12345 crashed\n");
    const old = new Date(Date.now() - 60_000);
    utimesSync(lock, old, old);
    expect(schedule("after a crash", new Date(T0 + 1000), "a.substack.com").status).toBe("scheduled");
  });
});
