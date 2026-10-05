# Substack MCP changelog

| Component | Version | Last Updated |
|-----------|---------|--------------|
| substack-mcp-cli | 3.0.1 | 2026-10-05 |

---

## 3.0.1, 2026-10-05

- **Built on Slipway 0.1.17**, which a fresh install of 3.0.0 already used. Since the Slipway 3.0.0 was measured on, 0.1.9, `which` also reads a tool's argument names and prints a title once where a description opens with it, and the general help names the settings that connect an account and the safety switches and counts the rest, which `agent-context` describes one by one. [Slipway's changelog](https://github.com/thenavidm/slipway/blob/main/CHANGELOG.md) lists the rest.
- **A test checks that every setting is named in `--help` or described by `agent-context`**, where it asked `--help` to name each one.

## 3.0.0, 2026-10-05

Built on [Slipway](https://github.com/thenavidm/slipway) 0.1.9. The 65 tools keep their names and arguments, and every difference below was measured against 2.2.3 before release.

- **A person approves each publish, delete, Note and comment over MCP.** Claude Code (2.1.246 and later) shows its own prompt for each of the ten tools that are public or cannot be undone, and a client that can show forms asks with an approval form whose one box starts unticked. Approvals are signed, bound to the exact call and work once. Where a client can do neither, the model's `confirm: true` still counts, and `SUBSTACK_CONFIRM=model` makes it enough everywhere, for an agent with no person to ask. The audit log records who approved each write.
- **A smaller tool list.** 22,833 tokens in Claude Code with every tool loaded, down from 25,215: the per-tool `$schema` line, an `execution` field and `additionalProperties: false` are gone. The last one advertised strict input while unknown keys were dropped anyway; the schema now says what happens.
- **`idempotentHint` is true only where a repeat changes nothing more.** 2.2.3 set it on every write that was not destructive, so a client could take a retry of `create_draft` as harmless and make a second draft. The seven tools that create something, `create_draft`, `create_draft_from_template`, `create_tag`, `create_template`, `schedule_note`, `upload_image` and `add_subscriber`, now say so; updating, scheduling a draft, tagging and cancelling keep the hint.
- **Exit codes follow the house contract everywhere.** A refused publish exits 2 instead of 5, an unknown command and a write in read-only mode 2 instead of 1, and `doctor` with nothing configured 10 instead of 1. 1 now means an unexpected error. Errors keep what Substack said in `details`, and a rate limit says how long to wait.
- **`which <words>` finds a command without the full list**, and `agent-context` describes every command, flag and setting as JSON. In Codex, finding the command that schedules a Note and the flags it requires took 83,422 input tokens instead of 105,216 (median of five), in three commands every time. 2.2.3's help listed no commands, so the model matched that only when it guessed the name; otherwise it read the full list or ran a command that does not exist. Over MCP the same task read 24 fewer out of about 48,500.
- **`install <client>`** adds the server to Claude Code, Codex, Claude Desktop, Cursor, VS Code or Gemini CLI in each one's own format, naming only the settings that connect a publication.
- **Scheduled Notes still go out from a running server**, over stdio or HTTP, and never from a terminal command, now through Slipway's `onServe`.
- **Less work to start.** The entry turns on Node's compile cache, and the server spends 173 ms of CPU before its first answer where 2.2.3 spent 202 (median of 21 runs, taking turns on one busy Mac). npx installs 4 dependencies instead of 94.
- **Docs fixes.** INSTALL.md installed `@thenavidm/substack-mcp`, the package this one replaced, and SECURITY.md and INSTALL.md linked to a repository that does not exist. The README pointed Docker at an image that was never published, carried two stale copies of the variable table inside Troubleshooting and left `get_growth_sources` out of the tools; all fixed, with a Features table. The release workflow attaches the desktop extension, the icon and terminal recording load from cdn.navid.me, and THIRD_PARTY_NOTICES.md lists the production dependencies' licenses.

### Upgrading

Node 22 or newer; 2.2.3 ran on 20. Scripts keep working for success, usage errors and missing setup; one that treated exit 5 as a refused publish, or 1 as an unknown command or read-only mode, should read 2. Over MCP, expect an approval prompt or form for each publish, delete, Note and comment; a headless agent that should act with `confirm: true` alone needs `SUBSTACK_CONFIRM=model`. A script that pipes JSON-RPC into the server must keep stdin open until it reads the answer: the server now stops when its input ends, as the MCP stdio binding asks. The HTTP settings are `SUBSTACK_HTTP_PORT`, `_HOST`, `_TOKEN` and `_ALLOWED_ORIGINS`; 2.2's `SUBSTACK_MCP_` names still work, and the new ones win when both are set. `--http` will not start on an address other than localhost without a token, where 2.2.3 only warned. Some terminal screens grew: the general help by 218 tokens, for `which`, `install`, the flags, the exit codes and the safety settings it now lists; the command list by 24, for the lines that point to `which` and `--help`; `create-draft --help` by 16, for the defaults it now shows and `--dry-run`, which is new; and a missing argument's error by 15, for its code and the help to read.

## 2.2.3, 2026-10-04

- **`npx -y @thenavidm/substack-mcp-cli` starts the MCP server whatever order npm keeps.** npx starts whichever binary the npm registry lists first when they share one file, and the registry does not keep the published order. For this package that happened to be the server; for 23 others it was the CLI. A third binary named after the package, on its own file, now always starts the server, and npx picks it by name.

## 2.2.2

Two real bugs, and honest numbers.

`--select posts.title,posts.slug` returned only the slug. Two paths under one
head overwrote each other, so the flag whose entire purpose is choosing what you
keep was quietly dropping most of it. Paths are grouped by their first segment
now, with regression tests at three depths.

`--port 8788` and `--host` were ignored unless written with an equals sign. The
space form fell through to the default without complaining.

The context cost in the README was characters divided by four. Counted properly
with a tokeniser against a live handshake it is 18,008 a turn, not 19,900, and
the payload is 47% JSON Schema structure, 36% argument descriptions, 17% tool
descriptions. The CLI side said "roughly a hundred tokens" and is 99.

The desktop extension is offered in the README now. The repo has always built
one and never mentioned it.

---

## 2.2.1

Every link in the package pointed at a GitHub account that no longer exists.

The account was renamed, so the clone command, the issues link, the security
advisory link and the setup URL inside `src/` were all resolving through
GitHub's rename redirect, which stops working once someone else claims the old
name.

npm serves whatever was in the published tarball, so fixing GitHub did not fix
the package page. This release is what corrects it.

Also: the read-only tool count said 42 and is 41.

---

## 2.2.0

A CLI, and a rename to match.

### Every tool is now a shell command

All 65 tools run from the terminal. The command is the tool name: `create_draft`
runs as `create-draft`, and the underscore spelling works too. Flags, help text
and validation come from the same schema the MCP tool declares, so both surfaces
accept the same arguments and a tool added tomorrow is a command tomorrow.

`--confirm`, `SUBSTACK_READ_ONLY`, `SUBSTACK_ALLOW_DESTRUCTIVE` and the audit log
behave identically whichever surface you use. `substack-cli schema <command>`
prints the exact JSON Schema an MCP client receives, so the two surfaces can be
checked against each other rather than taken on trust.

### Two binaries

`substack-mcp` is the server your AI app runs. `substack-cli` is the one you
type, and run bare it lists every command.

### Renamed to substack-mcp-cli

So the name says both surfaces. The server binary is still `substack-mcp`, so
existing client configs keep working. The package is now
`@thenavidm/substack-mcp-cli`.

### Refusals name the right syntax

A blocked write used to say `confirm: true` whichever surface you were on. In a
terminal it now says `--confirm`.

### Fixed

`SUBSTACK_MAX_RETRIES` and `SUBSTACK_USER_AGENT` were read by the code but never
documented in `--help`. A new test compares the two, so that cannot drift again.

25 new tests, 95 total.

---

## 2.1.0

Brought in line with the repo standard, which it was not following.

`openWorldHint` is now true on every tool. Every call in this server reaches
Substack, reads included, so the old conditional was wrong. `idempotentHint` now
marks reversible writes as idempotent and only irreversible ones as not.

The README follows the standard section order: what you can ask it, quick
install, setup, connect your client, check it worked, then the rest, with the FAQ
before the About block. Installing the package no longer appears to need
credentials you have not been told how to get yet.

Added `AGENTS.md` and `CLAUDE.md` for agents working on the repo, which were
missing. The LICENSE holder is corrected. Every internal anchor and external link
in the README was checked and four broken ones fixed.

---

## 2.0.3

The repository moved to `thenavidm/substack-mcp`. Package links updated to match. No code change.

---

## 2.0.2

`--version` and `--help` reported 2.0.0 on a 2.0.1 package, because the version
was written in the source as well as in package.json and only one of them was
bumped. It is now read from package.json, and the check that keeps the tool
counts honest checks the version too.

---

## 2.0.1

Metadata only. The package description and keywords now match the house format, and the repo description and topics with them. No code change.

---

## 2.0.0

A rewrite. TypeScript, 65 tools, and a correctness fix that mattered.

### The fix

1.x sent `draft_body` as raw HTML. Substack's `draft_body` is a JSON ProseMirror document, and the API accepts HTML with a 200 and then renders the post with the tags visible as literal text. There was no error to catch.

1.x also never sent `draft_bylines`, which Substack requires on a draft.

Both are fixed, and a test exists for each so neither can come back.

### Tools

26 to 65.

New: `get_draft`, `unschedule_draft`, `list_scheduled_posts`, `set_draft_body`, `preview_draft_body`, `get_sections`, `get_post_by_id`, `rank_posts`, `publish_note_with_link`, `export_subscribers`, `get_analytics`, `list_publication_tags`, `create_tag`, `get_post_tags`, `add_tag_to_post`, `remove_tag_from_post`, `get_post_comments`, `comment_on_post`, `delete_comment`, `list_subscriptions`, `list_reader_posts`, `get_reader_post`, `get_reader_feed`, `get_profile_feed`, `get_comment_thread`, `restack_note`, `get_publication_settings`, `update_publication_settings`, `get_user_profile`, `list_templates`, `create_template`, `delete_template`, `create_draft_from_template`, `research_creator_posts`, `research_creator_notes`, `compare_publications`, `upload_image`, `list_contributors`, `get_import_status`.

`list_subscribers` now filters on all 48 columns with 18 operators, instead of taking only an offset and a limit.

### Content

Markdown in, markdown back out. `get_draft` returns an editable body, so changing one sentence no longer means reconstructing the document.

A line containing only a YouTube, X, Spotify or Vimeo URL becomes a real embedded player. `<paywall>` on its own line marks the paid boundary. Nested lists survive to any depth with ordered and unordered mixed. A markdown table is preserved verbatim in a code block rather than being flattened.

Documents are validated before they are sent, so an unknown node is an error here rather than a post that renders wrong on Substack.

### Safety

Irreversible actions need `confirm: true`: publishing, deleting anything, publishing a Note, commenting, restacking. `SUBSTACK_READ_ONLY=1` hides and refuses every write. `SUBSTACK_ALLOW_DESTRUCTIVE=0` keeps drafting but blocks publishing and deleting. `SUBSTACK_AUDIT_LOG` records every attempted write.

Every tool sets all four MCP annotations explicitly, because an omitted `destructiveHint` defaults to true.

Tools that return other people's text say so in the response, and the server's instructions tell the model to treat it as data.

### Reliability

A 30 second request deadline, since Node applies none. Exponential backoff with jitter on 429 and 5xx, honouring `Retry-After`. A 350ms floor between requests so a loop does not get the account rate limited. Typed errors, so a message names the fix instead of saying "Substack API error". Cloudflare's 1010 block on custom domains is recognized and explained.

### Setup

`substack-mcp login` stores a session encrypted with AES-256-GCM, machine-bound, `0600`. Three ways to capture it: paste (default, instant), `--playwriter` (reads the Chrome you already have open), `--playwright` (launches its own, slowest). Browser drivers are optional and lazily imported, so the server never loads them.

`substack-mcp doctor` checks credentials, config, connectivity and byline resolution.

`SUBSTACK_USER_ID` is now optional. It is resolved and cached automatically.

### Transports

stdio by default. `--http` serves streamable HTTP with Origin validation and optional bearer auth, for running it somewhere always on so scheduled Notes fire.

### Also

Two MCP resources and four prompts. Multi-publication support, with a `publication` argument on every publication-scoped tool. 69 tests.

### Verified against a live publication

Every read-only tool was run against a real Substack account rather than checked by reading code. That found four bugs, all fixed here: `get_dashboard_summary` and `get_subscriber_count` both failed because the dashboard endpoint needs a date range and the old subscriber-count endpoint is gone, `list_scheduled_posts` sorted by a field the endpoint rejects, and `search_publications` silently returned nothing because it answers 200 with an empty list when unauthenticated.

The write path was proven too. A draft created from markdown stores as a real ProseMirror document with a working YouTube embed and a paywall, reads back as markdown, and survives an edit.

### Breaking changes from 1.x

- `list_subscribers` takes `filters` instead of `filter`.
- `get_draft` returns markdown by default rather than raw ProseMirror.
- `delete_draft`, `publish_draft`, `delete_note` now require `confirm: true`.
- The package ships from `dist/`. `index.mjs` is gone.

---

## 1.0.0

First release. 26 tools over Substack's internal API, as a single `index.mjs`.
