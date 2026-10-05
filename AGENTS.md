# Working on this repo

For agents editing this repo, not for people installing it. Installation is the
README.

## Commands

```bash
npm install
npm run build          # tsc to dist/
npm test               # vitest, no network, no credentials
npm run typecheck      # tsc --noEmit
npm run check:counts   # every documented number against the running server
```

`check:counts` is the one to run before committing anything that adds or removes
a tool. The tool count appears in six places and it derives all of them from the
built server rather than trusting the documents.

## Decisions already made

Do not re-litigate these.

**Substack has no public API.** Every endpoint here is one the web app calls,
signed with a `connect.sid` cookie. They change without notice. That is the
reason for the single client in `src/api/client.ts`: an upstream change is fixed
in one file.

**`draft_body` is a ProseMirror document, not HTML.** Sending HTML returns 200
and then renders the post with the tags visible as text. There is no error to
catch. `src/content/` exists entirely because of this, and the round trip is
tested in `tests/content.test.ts`. Never send a raw string as a body.

**Writes are on by default.** Only the public or irreversible actions need
approval: over MCP a person approves each where the client can ask, and
`confirm: true` counts only where it cannot. A server that gates every write
teaches the caller to approve reflexively, which is worse than no gate. Slipway
runs the guard; `src/tools/kit.ts` decides which tools need it.

**Annotations are set on every tool**, by Slipway from each tool's risk, because MCP defaults `destructiveHint`
and `openWorldHint` to true when omitted, so an unannotated read shows up in a
client as dangerous.

**Note scheduling is local.** Substack schedules posts but not Notes, so the
queue lives in `src/scheduler.ts` and only fires while the server runs:
`onServe` in `src/app.ts` starts it, over stdio or HTTP, and never for a CLI
command. That limit is documented rather than hidden.

## Where things are

| Path | What it holds |
|---|---|
| `src/app.ts` | The Slipway app: tools, settings, login, doctor, the Note queue. Slipway serves MCP, the CLI and `--http`, and owns the write guard and the audit log |
| `src/guide.ts` | Server instructions, resources and prompts |
| `src/doctor.ts` | Session age, publications and a live sign-in per publication |
| `src/config.ts` | Credentials and the multi-publication model |
| `src/api/` | The one HTTP client and its typed errors |
| `src/auth/` | `login` and the encrypted session file |
| `src/content/` | Markdown and HTML to Substack's ProseMirror body, and back |
| `src/tools/` | One module per group; `kit.ts` adapts them to Slipway |

## Adding a tool

One `defineTool` call in the right module under `src/tools/`. Guarding,
annotations and error handling come from Slipway, and `src/tools/kit.ts` adds
publication selection and turns Substack's errors into exit codes, so a tool
describes only what it does.

Group by what the tool reaches, not by endpoint. Put platform constraints in the
tool description, where they stay in context, not only in the README.

Then run `npm run check:counts`, which fails if any document disagrees with the
new count.

## Commit identity

Commits are authored `Navid Moazzez <n@navid.me>`. The machine's global git
config is already correct, so a plain `git commit` does the right thing.

Do not pass `-c user.email=` on the commit. That override is how commits end up
attributed to a dead profile with the contributors panel reading zero.

```bash
git config user.email   # must print n@navid.me
```

## Tests

vitest against pure functions and fakes. Never the network, never a real token.
A test that needs credentials is a test nobody runs.

The content pipeline carries the most risk, because a bug there produces a post
that looks wrong on Substack rather than an error anyone sees. That is why the
round trip, the embeds and the paywall each have a test.
