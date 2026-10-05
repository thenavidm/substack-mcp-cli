/**
 * `substack-cli doctor`
 *
 * Every failure mode of a session-cookie integration looks the same from
 * inside an MCP client: a tool returns an error and the user has no way to tell
 * an expired cookie from a wrong publication URL from Cloudflare blocking a
 * custom domain. This runs the checks in order and names the actual problem.
 * Slipway runs it on every `doctor`, as 2.2 did, after its own checks.
 */

import type { DoctorCheck } from "@thenavidm/slipway";
import { resolveUserId } from "./api/identity.js";
import { AuthenticationError, SubstackError } from "./api/errors.js";
import { loadSession, sessionPath } from "./auth/session.js";
import type { ToolContext } from "./tools/kit.js";

export async function doctor(ctx: ToolContext, options: { network: boolean }): Promise<DoctorCheck[]> {
  const { client, config } = ctx;
  if (config.publications.length === 0) return [];
  const checks: DoctorCheck[] = [];

  const stored = loadSession();
  if (stored) {
    const ageDays = Math.floor((Date.now() - new Date(stored.captured_at).getTime()) / 86_400_000);
    checks.push({ name: "Session", ok: true, detail: `stored at ${sessionPath()}, captured ${stored.captured_at}` });
    if (ageDays > 75) {
      checks.push({
        name: "Session age",
        ok: false,
        warn: true,
        detail: `${ageDays} days old. Substack cookies expire around 90 days, so a refresh is due soon.`,
        fix: "Run `substack-cli login` again.",
      });
    }
  } else {
    checks.push({ name: "Session", ok: true, detail: process.env.SUBSTACK_PUBLICATIONS ? "from SUBSTACK_PUBLICATIONS" : "from SUBSTACK_* environment variables" });
  }
  checks.push({ name: "Publications", ok: true, detail: `${config.publications.length} configured` });
  checks.push({
    name: "Pacing",
    ok: true,
    detail: `${config.requestTimeoutMs} ms deadline, ${config.maxRetries} retries, ${config.minRequestIntervalMs} ms between requests`,
  });
  if (!options.network) return checks;

  for (const creds of config.publications) {
    const at = creds.publicationUrl;
    if (!/\.substack\.com$/i.test(at)) {
      checks.push({
        name: `${at} domain`,
        ok: false,
        warn: true,
        detail: "a custom domain. Substack serves those behind Cloudflare, which can answer 403 error 1010.",
        fix: "If calls fail, use the canonical *.substack.com host instead.",
      });
    }
    try {
      const publication = await client.request<Record<string, unknown>>(`${client.apiUrl(creds)}/publication`, { creds });
      const sections = Array.isArray(publication.sections) ? publication.sections.length : 0;
      checks.push({ name: `${at} sign-in`, ok: true, detail: `authenticated as "${String(publication.name ?? "unknown")}", ${sections} section(s)` });
      const userId = await resolveUserId(client, creds);
      checks.push(
        userId === undefined
          ? {
              name: `${at} user id`,
              ok: false,
              warn: true,
              detail: "could not be resolved. Drafts need a byline.",
              fix: "Set SUBSTACK_USER_ID if create_draft fails.",
            }
          : { name: `${at} user id`, ok: true, detail: `${userId}${creds.userId ? "" : " (resolved automatically)"}` },
      );
    } catch (error) {
      checks.push({
        name: `${at} sign-in`,
        ok: false,
        detail: error instanceof AuthenticationError ? error.message : error instanceof SubstackError ? `${error.name}: ${error.message}` : (error as Error).message,
        ...(error instanceof AuthenticationError ? { fix: "Run `substack-cli login` to capture a fresh session." } : {}),
      });
    }
  }
  return checks;
}
