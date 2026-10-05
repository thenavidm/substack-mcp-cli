/**
 * Shared plumbing every tool uses, now on Slipway.
 *
 * Tool modules keep describing themselves with a Zod shape, a risk and a
 * handler. This adapter turns each into a Slipway tool, so the MCP server, the
 * CLI, the write guard, annotations and errors all come from the framework
 * instead of a copy kept in this repo.
 */

import { SlipwayError, toSlipwayError, toolkit, z, type Risk, type Tool } from "@thenavidm/slipway";
import type { SubstackClient } from "../api/client.js";
import type { Config, Credentials } from "../config.js";
import { selectPublication } from "../config.js";
import { SubstackError } from "../api/errors.js";

export type ToolContext = {
  client: SubstackClient;
  config: Config;
  /** Resolve which publication this call targets. */
  publication: (hint?: string) => Credentials;
};

const kit = toolkit<ToolContext>();

/** The optional argument that picks a publication, on every publication-scoped tool. */
export const publicationArg = {
  publication: z
    .string()
    .optional()
    .describe(
      "Which connected publication to act on, matched loosely against its hostname (for example 'example.substack.com' or just 'example'). Defaults to the first connected publication.",
    ),
};

export type ToolSpec<S extends Shape> = {
  name: string;
  /** One line, imperative. Shown in tool pickers. */
  title: string;
  description: string;
  schema: S;
  risk: Risk;
  /** True when the effect is visible to anyone but you. */
  public?: boolean;
  /** True when repeating the call with the same arguments changes nothing more. Reads always are. */
  idempotent?: boolean;
  handler: (args: z.infer<z.ZodObject<S>>, ctx: ToolContext) => Promise<unknown>;
  /** One line for the audit log, when this is a write. */
  summary?: (args: z.infer<z.ZodObject<S>>) => string;
};

export type AnyToolSpec = Tool<ToolContext>;

export function makeContext(
  client: SubstackClient,
  config: Config,
): ToolContext {
  return {
    client,
    config,
    publication: (hint?: string) => selectPublication(config, hint),
  };
}

/** Clamp a caller-supplied limit into a range Substack will accept. */
export function clamp(value: number | undefined, fallback: number, max: number): number {
  if (value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(Math.max(Math.trunc(value), 1), max);
}

/** Build a query string, dropping undefined values. */
export function query(params: Record<string, string | number | boolean | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") qs.set(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : "";
}

/**
 * Kept so tool modules read the same, but never sent: Slipway adds `confirm`
 * to every irreversible tool itself, with one description everywhere.
 */
export const confirmArg = {
  confirm: z.boolean().optional(),
};

type Shape = Record<string, z.ZodType>;

/**
 * Slipway reads the status (or, without one, the words) to pick the exit code
 * and the error code. What else the error knew, such as the endpoint, rides
 * along in `details` for the model to read.
 */
export function toSlipway(error: SubstackError): SlipwayError {
  const known = toSlipwayError(error);
  const json = typeof (error as { toJSON?: () => unknown }).toJSON === "function" ? ((error as { toJSON: () => Record<string, unknown> }).toJSON()) : {};
  const { error: _message, type: _type, status: _status, retry_after_seconds: retryAfter, ...rest } = json as Record<string, unknown>;
  const details = Object.fromEntries(Object.entries(rest).filter(([, value]) => value !== undefined && value !== ""));
  return new SlipwayError(known.message, known.code, known.exitCode, {
    ...(known.hint ? { hint: known.hint } : {}),
    ...(known.status !== undefined ? { status: known.status } : {}),
    ...(typeof retryAfter === "number" ? { retryAfterSeconds: retryAfter } : known.retryAfterSeconds !== undefined ? { retryAfterSeconds: known.retryAfterSeconds } : {}),
    ...(Object.keys(details).length ? { details } : {}),
    cause: error,
  });
}

export function defineTool<S extends Shape>(spec: ToolSpec<S>): Tool<ToolContext> {
  const { confirm: _confirm, ...shape } = spec.schema as Shape;
  const handler = spec.handler as (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;
  return kit.defineTool({
    name: spec.name,
    title: spec.title,
    description: spec.description,
    input: z.object(shape),
    risk: spec.risk,
    ...(spec.idempotent !== undefined ? { idempotent: spec.idempotent } : {}),
    ...(spec.summary ? { summary: spec.summary as (args: Record<string, unknown>) => string } : {}),
    handler: async (args, ctx) => {
      try {
        return await handler(args, ctx);
      } catch (error) {
        throw error instanceof SubstackError ? toSlipway(error) : error;
      }
    },
  });
}
