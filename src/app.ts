/**
 * The Substack app: everything Slipway needs to ship the MCP server and the CLI.
 *
 * This file only describes. It never starts anything, so `slipway check` and
 * tests can import it; `index.ts` is what runs.
 */

import { createRequire } from "node:module";
import { slipway } from "@thenavidm/slipway";
import { SubstackClient } from "./api/client.js";
import { loadConfig } from "./config.js";
import { markdownToDoc } from "./content/markdown.js";
import { serialize } from "./content/prosemirror.js";
import { doctor } from "./doctor.js";
import { INSTRUCTIONS, PROMPTS } from "./guide.js";
import { NoteScheduler } from "./scheduler.js";
import { ALL_TOOLS } from "./tools/index.js";
import { makeContext, type ToolContext } from "./tools/kit.js";

const require = createRequire(import.meta.url);
export const VERSION: string = (require("../package.json") as { version: string }).version;

/**
 * The resources are offered once a publication is connected, as in 2.2. Before
 * that a read can only fail, and a client that sees resources may list its own
 * resource tools to the model on every message.
 */
function connected(): boolean {
  try {
    return loadConfig().publications.length > 0;
  } catch {
    return false;
  }
}

export const app = slipway<ToolContext>({
  name: "substack",
  title: "Substack",
  version: VERSION,
  package: "@thenavidm/substack-mcp-cli",
  description: "drafts, published posts, Notes, subscribers, analytics, tags, comments, the reader feed and research on other publications on Substack",
  instructions: INSTRUCTIONS,
  context: () => {
    const config = loadConfig();
    return makeContext(new SubstackClient(config), config);
  },
  configured: (ctx) => ctx.config.publications.length > 0,
  secrets: (ctx) => ctx.config.publications.map((publication) => publication.sessionToken),
  tools: ALL_TOOLS,
  resources: [
    {
      name: "publication",
      uri: "substack://publication",
      title: "Publication settings",
      description:
        "Your publication's name, description, sections and theme. Load this before writing so a draft matches the publication it is going into.",
      mimeType: "application/json",
      listed: connected,
      read: async (ctx) => {
        const creds = ctx.publication();
        return ctx.client.request<unknown>(`${ctx.client.apiUrl(creds)}/publication`, { creds });
      },
    },
    {
      name: "connected-publications",
      uri: "substack://connected",
      title: "Connected publications",
      description: "Which publications this server can act on, and which is the default.",
      mimeType: "application/json",
      listed: connected,
      read: (ctx) => ({
        default: ctx.config.publications[0]?.publicationUrl ?? null,
        publications: ctx.config.publications.map((p) => p.publicationUrl),
        read_only: ctx.config.readOnly,
      }),
    },
  ],
  prompts: PROMPTS,
  doctor,
  // An expired cookie, a wrong URL and a Cloudflare block all fail the same way, so doctor asks Substack every time, as 2.2 did.
  doctorNetwork: true,
  login: {
    usage: "login [<publication>] [--paste | --playwriter | --playwright]",
    help: "capture a session for your publication, once",
    run: async (_io, args) => {
      // Imported here: the browser drivers are optional and heavy, and the server must never pay to load them.
      const { runLogin } = await import("./auth/login.js");
      await runLogin(args);
      return 0;
    },
  },
  // Substack schedules posts but not Notes, so the queue lives here and drains while the server runs, on either transport.
  onServe: (ctx) => {
    const scheduler = new NoteScheduler(async (note) => {
      const creds = ctx.publication(note.publication_url);
      const document = markdownToDoc(note.text);
      const result = await ctx.client.request<Record<string, unknown>>("https://substack.com/api/v1/comment/feed", {
        method: "POST",
        body: { body: serialize(document), bodyJson: document },
        creds,
      });
      const id = result.id ?? (result.comment as Record<string, unknown> | undefined)?.id;
      return { id: typeof id === "number" ? id : undefined };
    });
    scheduler.start();
  },
  // 2.2 listened on 8788 by default, and anything already pointed at it keeps working.
  httpPort: 8788,
  settings: [
    { env: "SUBSTACK_PUBLICATIONS", description: "Several publications at once, as a JSON array.", secret: true },
    { env: "SUBSTACK_PUBLICATION_URL", description: "Your publication, for example example.substack.com." },
    { env: "SUBSTACK_SESSION_TOKEN", description: "The connect.sid cookie value.", secret: true },
    { env: "SUBSTACK_USER_ID", description: "Optional, resolved automatically when absent." },
    { env: "SUBSTACK_MCP_HOME", description: "Where `login` stores the session. Defaults to ~/.substack-mcp." },
    { env: "SUBSTACK_REQUEST_TIMEOUT_MS", description: "Per-request deadline. Defaults to 30000.", tuning: true },
    { env: "SUBSTACK_MIN_REQUEST_INTERVAL_MS", description: "Spacing between requests. Defaults to 350.", tuning: true },
    { env: "SUBSTACK_MAX_RETRIES", description: "Retries on rate limits and 5xx. Defaults to 3.", tuning: true },
    { env: "SUBSTACK_USER_AGENT", description: "The browser User-Agent sent to Substack.", tuning: true },
  ],
  links: { repository: "https://github.com/thenavidm/substack-mcp-cli" },
});
