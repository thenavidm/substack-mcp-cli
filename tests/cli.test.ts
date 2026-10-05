/**
 * The two surfaces, now that Slipway builds both from ALL_TOOLS.
 *
 * Parsing, help and the exit-code contract are Slipway's and tested there. What
 * matters here: every tool arrives on both surfaces intact, the guard behaves as
 * the README promises, the Note queue drains from a running server and never
 * from a CLI command, 2.2's HTTP setting names keep working, and the docs stay
 * in step with the code.
 */

import { existsSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EXIT, toSlipwayError } from "@thenavidm/slipway";
import { checkApp, cli, connect } from "@thenavidm/slipway/testing";
import { AuthenticationError, NotFoundError, RateLimitError, ServerError, SubstackError, ValidationError } from "../src/api/errors.js";
import { app } from "../src/app.js";
import { listScheduled, schedule } from "../src/scheduler.js";
import { ALL_TOOLS } from "../src/tools/index.js";
import { makeContext, toSlipway } from "../src/tools/kit.js";
import type { SubstackClient } from "../src/api/client.js";
import { loadConfig } from "../src/config.js";

const env = {};
afterEach(() => vi.unstubAllEnvs());
// Nothing here may read or write a real session or queue.
const emptyHome = () => vi.stubEnv("SUBSTACK_MCP_HOME", mkdtempSync(join(tmpdir(), "substack-home-")));

describe("Substack on Slipway", () => {
  it("offers every tool as a command and over MCP, under the same names", async () => {
    const list = await cli(app, [], { env });
    for (const tool of ALL_TOOLS) expect(list.stdout).toContain(tool.command);
    const mcp = await connect(app, { env });
    const names = (await mcp.listTools()).map((tool) => tool.name).sort();
    await mcp.close();
    expect(names).toEqual(ALL_TOOLS.map((tool) => tool.name).sort());
  });

  it("offers its resources once a publication is connected, as 2.2 did", async () => {
    emptyHome();
    // With none to offer, the server does not offer resources at all, as 2.2 did not.
    const before = await connect(app, { env });
    await before.close();
    vi.stubEnv("SUBSTACK_PUBLICATION_URL", "example.substack.com");
    vi.stubEnv("SUBSTACK_SESSION_TOKEN", "s");
    const after = await connect(app, { env });
    const shown = (await after.request("resources/list")) as { resources: Array<{ uri: string }> };
    await after.close();
    expect(before.initialize.capabilities.resources).toBeUndefined();
    expect(shown.resources.map((resource) => resource.uri).sort()).toEqual(["substack://connected", "substack://publication"]);
  });

  it("refuses to publish without --confirm, before anything reaches Substack", async () => {
    const run = await cli(app, ["publish-draft", "--id", "1"], { env });
    expect(run.code).toBe(2);
    expect(JSON.parse(run.stderr).code).toBe("refused");
    expect(run.stderr).toContain("--confirm");
  });

  it("hides every write when SUBSTACK_READ_ONLY is set", async () => {
    const mcp = await connect(app, { env: { SUBSTACK_READ_ONLY: "1" } });
    const tools = await mcp.listTools();
    await mcp.close();
    expect(tools.length).toBeGreaterThan(0);
    expect(tools.every((tool) => tool.annotations?.readOnlyHint === true)).toBe(true);
  });

  it("reports a missing argument by its flag and exits 2", async () => {
    const run = await cli(app, ["get-draft"], { env });
    expect(run.code).toBe(2);
    expect(JSON.parse(run.stderr).error).toContain("--id");
  });

  it("calls a run with no publication connected not configured, exit 10", async () => {
    emptyHome();
    expect((await cli(app, ["list-drafts"], { env: {} })).code).toBe(EXIT.notConfigured);
  });

  it("keeps login reachable from the CLI, with its modes", async () => {
    expect((await cli(app, ["--help"], { env })).stdout).toContain("substack-cli login [<publication>] [--paste | --playwriter | --playwright]");
    expect((await cli(app, ["login", "--help"], { env })).stdout).toContain("Usage: substack-cli login");
  });

  /** Substack schedules posts but not Notes, so 2.2 drained its own queue while serving; that moved to onServe. */
  it("publishes a Note that came due from a running server, and leaves the queue alone in the CLI", async () => {
    emptyHome();
    vi.stubEnv("SUBSTACK_PUBLICATION_URL", "example.substack.com");
    vi.stubEnv("SUBSTACK_SESSION_TOKEN", "s");
    schedule("Shipped.", new Date(Date.now() - 1000), "example.substack.com");
    expect((await cli(app, ["list-drafts", "--help"], { env: {} })).code).toBe(0);
    expect(listScheduled("scheduled")).toHaveLength(1);

    const sent: unknown[] = [];
    const config = loadConfig();
    const client = { request: async (_url: string, init: { body: unknown }) => (sent.push(init.body), { id: 77 }) } as unknown as SubstackClient;
    await app.definition.onServe!(makeContext(client, config), { debug() {}, info() {}, warn() {}, error() {} });
    await vi.waitFor(() => expect(listScheduled("published")).toHaveLength(1));
    expect(sent).toHaveLength(1);
  });

  it("passes slipway check", async () => {
    const report = await checkApp(app, { env });
    expect(report.findings.filter((finding) => finding.level === "error")).toEqual([]);
  });
});

describe("Substack's errors keep their exit codes and their details", () => {
  const at = "https://example.substack.com/api/v1/drafts";
  it.each([
    ["an expired cookie", new AuthenticationError("Session expired.", 401, at), EXIT.auth],
    ["bad arguments", new ValidationError("Bad body.", 400, at), EXIT.usage],
    ["a draft that is gone", new NotFoundError("Not found.", 404, at), EXIT.notFound],
    ["a rate limit", new RateLimitError("Slow down.", 429, at), EXIT.rateLimited],
    ["a server failure", new ServerError("Boom.", 502, at), EXIT.api],
    ["no answer at all", new SubstackError("Could not reach Substack: fetch failed", 0, at), EXIT.api],
  ])("maps %s", (_label, error, code) => {
    expect(toSlipwayError(toSlipway(error)).exitCode).toBe(code);
  });
});

describe("documentation stays in step with the code", () => {
  const read = (p: string): string => readFileSync(new URL(p, import.meta.url), "utf-8");
  // A name ending in `_` is a template prefix, such as the one src/index.ts maps 2.2's HTTP names with, not a variable.
  const names = (text: string): Set<string> => new Set((text.match(/SUBSTACK_[A-Z_]+/g) ?? []).filter((name) => !name.endsWith("_")));
  const source = (dir: string): string =>
    readdirSync(new URL(dir, import.meta.url), { withFileTypes: true })
      .map((entry) => (entry.isDirectory() ? source(`${dir}${entry.name}/`) : entry.name.endsWith(".ts") ? read(`${dir}${entry.name}`) : ""))
      .join("\n");

  /** Every variable the server reads: this repo's code, and Slipway's as agent-context lists them. */
  const used = async (): Promise<Set<string>> => {
    const context = JSON.parse((await cli(app, ["agent-context"], { env })).stdout);
    return new Set([...names(source("../src/")), ...context.settings.map((setting: { env: string }) => setting.env)]);
  };

  /**
   * Two variables shipped undocumented and five never reached `--help`, which is
   * the kind of drift nobody notices because both sides look complete on their own.
   */
  it("documents every environment variable the server reads", async () => {
    const documented = names(read("../README.md"));
    expect([...(await used())].filter((v) => !documented.has(v))).toEqual([]);
  });

  // Since Slipway 0.1.15 the help names the settings that connect an account and the safety
  // switches, and counts the rest, which agent-context describes one by one.
  it("names every environment variable in --help or agent-context", async () => {
    const help = (await cli(app, ["--help"], { env })).stdout;
    const context = JSON.parse((await cli(app, ["agent-context"], { env })).stdout);
    const described = new Set(context.settings.map((setting: { env: string }) => setting.env));
    expect([...(await used())].filter((v) => !help.includes(v) && !described.has(v))).toEqual([]);
  });

  /**
   * Two in-page links pointed at headings that had been renamed, including the
   * one row routing a shell user to the CLI. The ship checklist's link pass only
   * greps http, so a dead `#anchor` is the kind that ships quietly.
   */
  it.each(["../README.md", "../INSTALL.md"])("has no dead in-page anchors in %s", (file) => {
    if (!existsSync(new URL(file, import.meta.url))) return; // repo may ship one doc
    const md = read(file).replace(/```[\s\S]*?```/g, "");
    // GitHub's slug keeps letters, marks, numbers and connector punctuation, so an
    // emoji's variation selector (U+FE0F) stays in the anchor and a link has to carry it.
    const slugs = new Set(
      [...md.matchAll(/^#{1,6} (.+)$/gm)].map(([, heading]) =>
        (heading as string).trim().toLowerCase().replace(/[^\p{L}\p{M}\p{N}\p{Pc}\s-]/gu, "").replace(/ /g, "-"),
      ),
    );
    const dead = [...md.matchAll(/\[[^\]]+\]\(#([^)]+)\)/g)]
      .map((m) => decodeURIComponent(m[1] as string))
      .filter((a) => !slugs.has(a));
    expect(dead).toEqual([]);
  });
});
