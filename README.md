<img src="https://cdn.navid.me/connectors/substack-icon.png" alt="Substack" width="88">

# Substack MCP Server & CLI

[![npm](https://img.shields.io/npm/v/@thenavidm%2Fsubstack-mcp-cli?color=orange&label=npm)](https://www.npmjs.com/package/@thenavidm/substack-mcp-cli)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)
[![YouTube](https://img.shields.io/badge/YouTube-@thenavidm-red?logo=youtube&logoColor=white)](https://youtube.com/@thenavidm?sub_confirmation=1)
[![X](https://img.shields.io/badge/X-@thenavidm-black?logo=x)](https://x.com/thenavidm)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-thenavidm-0A66C2?logo=linkedin&logoColor=white)](https://linkedin.com/in/thenavidm)

Substack MCP server and CLI for Claude Code, Codex and AI agents. 65 tools for drafts, posts, Notes, subscribers, analytics, tags, comments, and researching other writers.

One install gives you both surfaces, the same tools under the same names,
covering everything the dashboard does and several things it cannot.

Substack has no public API, which is why your assistant cannot see any of it, and why most things that claim to connect publish posts with the HTML tags showing.

This one speaks Substack's own document format. Ask for a draft and you get a draft, with the YouTube link as a player and the paywall where you put it.

Built and maintained by [Navid Moazzez](https://navid.me?utm_source=github&utm_medium=referral&utm_campaign=substack-mcp-cli&utm_content=readme). Built on [Slipway](https://github.com/thenavidm/slipway), which turns one definition of each tool into the MCP server and the CLI.

<img src="https://cdn.navid.me/articles/vibe-creator/substack-mcp.gif?v=7" alt="Claude Code using the Substack MCP server" width="520">

## Two ways to use it

### Command line

`substack-cli` in your terminal, for scripting, cron, pipes, or a quick question
without opening anything:

```bash
substack-cli                                          # every command, one line each
substack-cli list-drafts                              # what you have in progress
substack-cli get-dashboard-summary                    # subscribers, revenue, recent posts
substack-cli rank-posts --limit 10                    # your best performing posts
substack-cli research-creator-posts --handle someone  # study another writer
substack-cli create-draft --title "Draft" --body "..."
substack-cli <command> --help                         # what any command takes
```

`--confirm` is the shell spelling of the confirmation that publishing, deleting
and posting Notes require. `--json` gives JSON, `--compact` puts it on one line,
and errors are JSON on stderr whichever you pick.

`substack-cli schema <command>` prints the exact JSON Schema an MCP client
receives for that tool, which is how you can check the two surfaces really are
one thing.

### MCP server, for your AI app

`substack-mcp` is what Claude Code, Claude Desktop, Cursor and the rest launch.
You never run it by hand:

```bash
claude mcp add substack \
  -e SUBSTACK_PUBLICATION_URL=example.substack.com \
  -e SUBSTACK_SESSION_TOKEN=xxxxx \
  -- npx -y @thenavidm/substack-mcp-cli
```

Then just ask: _"which post drove the most paid conversions last month?"_

Each publish, delete, Note and comment waits for your approval in the client, as
[section 8](#8-writing-safely-) explains.

### Which one

| Where you are | What you can reach |
|---|---|
| An agent that can run shell commands, like Claude Code or Cursor | Both. The CLI is the cheaper one: it costs nothing until you type it |
| claude.ai, the Claude Desktop chat tab, or a phone | The server only. There is no shell to run a command in |
| A terminal, a script, cron or CI | The CLI only. There is no MCP client in a shell |

They are the same program reading the same tool definitions, so anything one
can do, the other can.

## Features

Every tool is both a command and an MCP tool, with the same name. The command
is the tool name with dashes.

| Capability | CLI command | MCP tool |
|---|---|---|
| Drafts | `substack-cli list-drafts` / `get-draft` / `create-draft` / `update-draft` / `delete-draft` | `list_drafts` / `get_draft` / `create_draft` / `update_draft` / `delete_draft` |
| Publish or schedule a draft | `substack-cli publish-draft` / `schedule-draft` / `unschedule-draft` / `list-scheduled-posts` | `publish_draft` / `schedule_draft` / `unschedule_draft` / `list_scheduled_posts` |
| Bodies in Substack's own format | `substack-cli set-draft-body` / `preview-draft-body` | `set_draft_body` / `preview_draft_body` |
| Published posts and their numbers | `substack-cli list-posts` / `get-post` / `get-post-by-id` / `search-posts` / `get-post-stats` / `rank-posts` | `list_posts` / `get_post` / `get_post_by_id` / `search_posts` / `get_post_stats` / `rank_posts` |
| Notes, now or later | `substack-cli publish-note` / `publish-note-with-link` / `schedule-note` / `list-scheduled-notes` / `cancel-scheduled-note` / `list-notes` / `delete-note` | `publish_note` / `publish_note_with_link` / `schedule_note` / `list_scheduled_notes` / `cancel_scheduled_note` / `list_notes` / `delete_note` |
| Subscribers | `substack-cli list-subscribers` / `export-subscribers` / `get-subscriber-count` / `add-subscriber` | `list_subscribers` / `export_subscribers` / `get_subscriber_count` / `add_subscriber` |
| Analytics | `substack-cli get-analytics` / `get-dashboard-summary` / `get-email-stats` / `get-growth-sources` / `get-revenue-summary` | `get_analytics` / `get_dashboard_summary` / `get_email_stats` / `get_growth_sources` / `get_revenue_summary` |
| Tags | `substack-cli list-publication-tags` / `create-tag` / `get-post-tags` / `add-tag-to-post` / `remove-tag-from-post` | `list_publication_tags` / `create_tag` / `get_post_tags` / `add_tag_to_post` / `remove_tag_from_post` |
| Comments | `substack-cli get-post-comments` / `comment-on-post` / `delete-comment` / `get-comment-thread` | `get_post_comments` / `comment_on_post` / `delete_comment` / `get_comment_thread` |
| Reading Substack | `substack-cli list-subscriptions` / `list-reader-posts` / `get-reader-post` / `get-reader-feed` / `get-profile-feed` / `restack-note` | `list_subscriptions` / `list_reader_posts` / `get_reader_post` / `get_reader_feed` / `get_profile_feed` / `restack_note` |
| Your publication | `substack-cli get-publication-settings` / `update-publication-settings` / `get-sections` / `list-contributors` / `get-import-status` | `get_publication_settings` / `update_publication_settings` / `get_sections` / `list_contributors` / `get_import_status` |
| Templates | `substack-cli list-templates` / `create-template` / `delete-template` / `create-draft-from-template` | `list_templates` / `create_template` / `delete_template` / `create_draft_from_template` |
| Research other writers | `substack-cli research-creator-posts` / `research-creator-notes` / `compare-publications` / `scrape-post` / `search-publications` / `get-publication-info` / `get-user-profile` | `research_creator_posts` / `research_creator_notes` / `compare_publications` / `scrape_post` / `search_publications` / `get_publication_info` / `get_user_profile` |
| Images | `substack-cli upload-image` | `upload_image` |
| Check your setup | `substack-cli doctor` | not a tool |

All 65 with their arguments are in [section 7](#7-tools-%EF%B8%8F).

## Contents

| # | Section | What is in it |
|---|---|---|
| 1 | [What you can ask it](#1-what-you-can-ask-it-) | Real prompts, not features |
| 2 | [Quick install](#2-quick-install-) | One line, no account needed |
| 3 | [Setup](#3-setup-) | Getting your session cookie |
| 4 | [Connect your client](#4-connect-your-client-) | Claude, Cursor, Windsurf, the rest |
| 5 | [Check it worked](#5-check-it-worked-) | And the two things that fail |
| 6 | [Which surface, and what each costs](#6-which-surface-and-what-each-costs) | Measured in Claude Code, and how to spend less |
| 7 | [Tools](#7-tools-%EF%B8%8F) | All 65, grouped by what they reach |
| 8 | [Writing safely](#8-writing-safely-) | What is guarded and what is not |
| 9 | [Writing posts](#9-writing-posts-%EF%B8%8F) | Markdown, embeds, paywalls |
| 10 | [Your data](#10-your-data-) | What is stored, and where |
| 11 | [Troubleshooting](#11-troubleshooting-) | When something breaks |
| 12 | [FAQ](#12-faq-) | The questions people actually ask |

## 1. What you can ask it 💬

- Draft this week's post from my notes, in the voice of my last five.
- Which of my posts got the most paid conversions, and what do they have in common?
- How many subscribers have not opened anything in 90 days?
- Pull every Note that mentions pricing from the three writers I compete with.
- Add a paywall after the third section of that draft.
- Schedule this Note for 9am Tuesday.
- Compare my open rate to what it was six months ago.
- Read my inbox and tell me what my corner of Substack is arguing about this week.
- Turn my last three posts into a guide, and put the YouTube version at the top.

The last one is the point. It reads your existing posts, writes a new draft in your format, and embeds the video as a real player rather than a blue link, because it speaks Substack's document format rather than pasting HTML at it.

## 2. Quick install ⚡

Node 22 or newer. Nothing else.

```bash
npx -y @thenavidm/substack-mcp-cli@latest --version
```

That is the whole install. `npx` fetches it on demand, so there is nothing to update later.

Installing the package needs no account. Only connecting it does, which is the next section.

### Before you start

| You need | Check with | If missing |
|---|---|---|
| Node 22 or newer | `node -v` | [nodejs.org](https://nodejs.org) |
| A Substack publication you own | Open your publication's dashboard | Start one at [substack.com](https://substack.com), it is free |
| Its canonical address | It ends `.substack.com` | Custom domains do not serve the API, see below |

> [!IMPORTANT]
> Use the `yourname.substack.com` address, not a custom domain. Substack does not
> serve its API on custom domains: the request redirects and ends in a 404.

## 3. Setup 🔑

Substack has no public API and no OAuth. Everything here runs on your browser session cookie, exactly like the Substack tab you already have open.

**Treat that cookie like a password.** It is full access to your account. Never paste it into an issue, a gist, or a chat with anyone.

### Option A: paste the cookie (fastest, recommended)

```bash
npx @thenavidm/substack-mcp-cli@latest login
```

It asks for your publication URL and the cookie, resolves your user id, and stores the result encrypted. Then you can leave the `env` block out of your client config entirely.

To find the cookie:

1. Open your publication and sign in.
2. DevTools, then Application, then Cookies.
3. Copy the value of `connect.sid`. It is long and starts with `s%3A`.

Turn off ad blockers first. Some of them strip the cookie from that panel.

### Option B: read it from the Chrome you already have open

```bash
npx @thenavidm/substack-mcp-cli@latest login --playwriter
```

Uses [Playwriter](https://playwriter.dev) to read the cookie out of your running Chrome, where you are already signed in. No browser launch, no sign-in, no CAPTCHA. Requires Playwriter and its extension.

### Option C: launch a browser and sign in

```bash
npm i -g playwright && npx playwright install chromium
npx @thenavidm/substack-mcp-cli@latest login --playwright
```

A browser opens and waits up to ten minutes for you to sign in, CAPTCHA and emailed link included. This is much the slowest option, and the only one that works on a machine with no Chrome, or in CI.

Playwright is not bundled. It is large, it is only ever used by this one command, and the server never loads it, so your tool calls are not slower for it existing.

### Or just use environment variables

Nothing above is required. Set `SUBSTACK_PUBLICATION_URL` and `SUBSTACK_SESSION_TOKEN` and you are done. `SUBSTACK_USER_ID` is optional and looked up automatically when absent.

### When it expires

Sessions do expire, commonly reported at around 90 days, though I have not measured it. When calls start failing with an authentication error, run `login` again, or paste a fresh cookie. `doctor` warns you once a stored session passes 75 days.

## 4. Connect your client 🔌

The long version, every step with what to do when one fails, is in [INSTALL.md](INSTALL.md).

Every block below is complete on its own. Pick your client, paste, done.

Replace `example.substack.com` with your publication and `your-connect-sid-value` with the cookie from [section 3](#3-setup-).

### Claude Code

```bash
claude mcp add substack \
  -e SUBSTACK_PUBLICATION_URL=example.substack.com \
  -e SUBSTACK_SESSION_TOKEN=your-connect-sid-value \
  -- npx -y @thenavidm/substack-mcp-cli@latest
```

Run `/mcp` inside Claude Code and `substack` should be listed. Remove it later with `claude mcp remove substack`.

### Claude Desktop

The quickest route is the extension: download the
[`.mcpb`](https://github.com/thenavidm/substack-mcp-cli/releases/latest) and
double-click it. It carries its own dependencies and asks for your publication
and cookie in a form, so there is no config file to edit.

To wire it up by hand instead, open **Settings**, then **Developer**, then
**Edit Config**. That reveals `claude_desktop_config.json`. Or go straight there:

| System | Config file |
|---|---|
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

```json
{
  "mcpServers": {
    "substack": {
      "command": "npx",
      "args": ["-y", "@thenavidm/substack-mcp-cli@latest"],
      "env": {
        "SUBSTACK_PUBLICATION_URL": "example.substack.com",
        "SUBSTACK_SESSION_TOKEN": "your-connect-sid-value"
      }
    }
  }
}
```

If the file already has other servers, add only the `"substack"` block inside `"mcpServers"` and put a comma after the entry before it. One bad comma stops every server loading, not just this one.

Then quit Claude Desktop completely and reopen it. On macOS use **Cmd+Q**, closing the window is not enough. It only reads that file at startup.

> [!TIP]
> Claude Desktop does not inherit your shell PATH, so if `npx` is not found, run
> `which npx` and use that absolute path as `command`.

### Cursor

`~/.cursor/mcp.json` for every project, or `.cursor/mcp.json` inside one. Same JSON as above. Reload the window afterwards.

### Windsurf

`~/.codeium/windsurf/mcp_config.json`. Same JSON. Reload afterwards.

### VS Code

`.vscode/mcp.json` in a project, or run **MCP: Add Server** from the command palette.

### Anything else

Zed, Cline, Continue and any other MCP client over stdio all work. They each want the same three things: `command`, `args`, and `env`.

### Docker

No image is published, so build it from this repository:

```bash
docker build -t substack-mcp-cli .
docker run -i --rm \
  -e SUBSTACK_PUBLICATION_URL=example.substack.com \
  -e SUBSTACK_SESSION_TOKEN=your-connect-sid-value \
  substack-mcp-cli
```

### Self-hosted over HTTP

Only one thing needs this: `schedule_note` publishes from the machine the server runs on, so a Note queued for 9am fires only if that machine is awake. Everything else is fine on a laptop.

```bash
substack-mcp --http --port=8788
```

It binds to `127.0.0.1`, serves `/health`, and refuses browser requests from other sites unless `SUBSTACK_HTTP_ALLOWED_ORIGINS` lists them. To reach it from elsewhere set `SUBSTACK_HTTP_HOST=0.0.0.0` and `SUBSTACK_HTTP_TOKEN` to a random string, and put it behind TLS; it will not start on another address without the token. 2.2's `SUBSTACK_MCP_*` names still work.

> [!CAUTION]
> The HTTP transport holds a live credential for your Substack account. Binding it
> beyond localhost without a token hands your account to anyone who finds the port.

## 5. Check it worked 🩺

```bash
npx @thenavidm/substack-mcp-cli@latest doctor
```

`doctor` runs the checks in order and names the actual problem, rather than leaving you to guess which of six things is wrong.

Two things account for almost every failure. Node is not on the PATH your client sees, which the tip above covers. Or the session cookie is wrong or expired, which `doctor` names directly.

## 6. Which surface, and what each costs

Both surfaces are the same program with the same 65 tools. The
difference is when the model pays for them. Measured in Claude Code:

| Cost | MCP server | CLI |
|---|---|---|
| Every message, with every tool loaded | 22,800 tokens | nothing |
| Every message, Claude Code's default | 1,210 tokens | nothing |
| When Substack comes up | nothing more, or the tools it picks | 2,360 tokens for `SKILL.md`, once |
| 20 messages with Substack in 1, every tool loaded | 456,000 tokens | 2,360 tokens |

Claude Code's [tool search](https://code.claude.com/docs/en/mcp#scale-with-mcp-tool-search)
is on by default: it sends only the tool names and the server instructions,
and loads a tool's full definition when the model reaches for it. An app that
loads every tool up front pays the first line on every message, whether
Substack comes up or not. With the skill added, Claude Code also lists its
one-line description, about 140 tokens.

Where the tokens go, with every tool loaded:

| Part of the tool list | Share |
|---|---|
| Structure: names, types, required lists, nesting, annotations | 44% |
| Argument descriptions | 37% |
| Tool descriptions | 19% |

To spend less, turn the server off when you are not using it, which in Claude
Code is the `/mcp` panel. `SUBSTACK_READ_ONLY=1` takes the 24 write tools off the list, leaving 41.
Or install the CLI and add the server on the days it earns its place.

Measured on 2026-10-05 with Claude Code 2.1.286 on Claude Opus 5.5: one
short prompt with and without the server connected, once with
`ENABLE_TOOL_SEARCH=false` and once with the default, the difference read
from the API's own usage figures. `SKILL.md` was measured the same way. Other
apps and models count tokens a little differently.

Against 2.2.3, measured the same day: every tool loaded costs 22,833 tokens
instead of 25,215, tool search the same, and `SKILL.md` 102 more, because it now
names all ten commands that need `--confirm`, says how approval works over MCP
and lists every exit code. In Codex 0.159.3 on gpt-6.1-sol, the same
task, "find the command that schedules a Note to publish later and the flags it
requires", read a median of 83,422 input tokens on 3.0.0 against 105,216 on
2.2.3 over the CLI, and 48,510 against 48,534 over MCP, five runs each. 2.2.3's
help listed no commands, so the model matched 3.0.0 only in the two runs where
it guessed `schedule-note` blind; in the other three it read the full list or
ran a command that does not exist.

## 7. Tools 🛠️

65 tools. Every one declares whether it reads, writes, or does something that cannot be undone, so your client can show you the difference before anything runs.

Every publication-scoped tool takes an optional `publication` argument to pick which connected Substack it acts on. See [Several publications](#several-publications).

### Drafts

| Tool | Risk | What it does |
|---|---|---|
| `create_draft` | write | Create a draft from markdown. Private until you publish |
| `update_draft` | write | Change any field. Only what you pass is touched |
| `get_draft` | read | Read a draft, body returned as **markdown you can edit** |
| `list_drafts` | read | Unpublished drafts, most recently edited first |
| `delete_draft` | **destructive** | Permanent, no trash. Needs `confirm` |
| `publish_draft` | **destructive** | Publishes and emails your list. Needs `confirm` |
| `schedule_draft` | write | Schedule on Substack's side, so it fires without you |
| `unschedule_draft` | write | Back to a plain draft |
| `list_scheduled_posts` | read | What is queued, soonest first |
| `set_draft_body` | write | Replace the body with a document you build node by node |
| `preview_draft_body` | read | See what a body will render as, changing nothing |
| `get_sections` | read | Section ids, which `create_draft` needs |

`create_draft` takes `title`, `subtitle`, `body`, `body_format`, `section_id`, `audience` (`everyone`, `only_free`, `only_paid`, `founding`), `type` (`newsletter`, `podcast`, `thread`), `cover_image`, and three SEO fields.

`get_draft` takes `body_format` of `markdown`, `prosemirror`, or `both`. Markdown is the default, because it is what you can actually edit and send back.

### Posts

| Tool | Risk | What it does |
|---|---|---|
| `list_posts` | read | Published posts, newest first |
| `get_post` | read | Read a post by slug, from **any** publication |
| `get_post_by_id` | read | Same, by numeric id |
| `search_posts` | read | Search your own posts by keyword |
| `get_post_stats` | read | Opens, clicks, views, signups, reactions for one post |
| `rank_posts` | read | Rank posts by any metric, to find what worked |

### Notes

Notes have no draft state on Substack. Writing one publishes it, immediately and publicly.

| Tool | Risk | What it does |
|---|---|---|
| `publish_note` | **destructive** | Live and public at once. Needs `confirm` |
| `publish_note_with_link` | **destructive** | With a link preview card. Needs `confirm` |
| `schedule_note` | write | Queue one for later. See the caveat below |
| `list_scheduled_notes` | read | What is queued, published, failed or cancelled |
| `cancel_scheduled_note` | write | Cancel before it fires |
| `list_notes` | read | Notes you have published |
| `delete_note` | **destructive** | Permanent. Needs `confirm` |

Substack does not schedule Notes, so the queue is kept locally and this server publishes each one when it comes due.

**That only happens while the server is running.** A Note set for 9am fires at 9am if your machine is awake with your client open. Otherwise it goes out on the next start after that time, flagged as published late.

Nothing is ever dropped. For scheduling that does not depend on your laptop, see [self-hosted over HTTP](#self-hosted-over-http).

### Subscribers

| Tool | Risk | What it does |
|---|---|---|
| `list_subscribers` | read | Filter on 48 columns with 18 operators |
| `export_subscribers` | read | The only way to actually **read** engagement metrics |
| `get_subscriber_count` | read | Totals, free and paid |
| `add_subscriber` | write | Add an address to the list |

`list_subscribers` takes `filters` as `{column, operator, value}` combined with AND, plus `search`, `sort_by`, `sort_direction`, `limit` and `offset`.

Which operators apply depends on the column's type:

| Type | Operators |
|---|---|
| `Int` | `is` `is_not` `gt` `gte` `lt` `lte` |
| `String` | `is` `is_not` `is_any_of` `contains` `starts_with` `ends_with` `includes_none` |
| `DateTime` | `is_on` `is_after` `is_on_or_after` `is_before` `is_on_or_before` |
| `Array` (`tag_ids`, `emails_enabled`) | `includes_any` `includes_all` `includes_none` |
| `subscription_type`, `group_membership` | `is` `is_not` `is_any_of` |

The 48 columns cover identity (name, email, country, state, group), subscription (type, dates, revenue, Stripe plan, attribution), email engagement (opens over 7d/30d/6mo, links clicked, sections) and site engagement (views, comments, shares, days active, activity rating). The full list with types reaches your client in the tool's schema, so the model does not have to guess.

There is no OR and no nesting. That is a limit of Substack's endpoint. Anything needing OR has to be issued as separate calls.

Two things about `export_subscribers`, both verified against the live API:

- `tag_ids` and `group_membership` cannot be exported. Substack drops them without failing, so they come back in `missing_columns`. Asking for all 48 returns 46.
- Values arrive display-formatted. Revenue is `"$50.00"` here and the number `50` through `list_subscribers`.

### Analytics

| Tool | Risk | What it does |
|---|---|---|
| `get_analytics` | read | One of 16 reports, listed below |
| `get_dashboard_summary` | read | The headline numbers |
| `get_email_stats` | read | Delivery, opens, clicks |
| `get_revenue_summary` | read | Plans, prices, what each brings in |
| `get_growth_sources` | read | Where new subscribers came from in a window, ranked |

`get_analytics` reports: `unsubscribes`, `unsubscribes_timeseries`, `retention`, `retention_summary`, `referrals_leaderboard`, `referrals_summary`, `audience_overlap`, `audience_locations`, `subscriber_notes`, `paid_subscriber_growth`, `arr_timeseries`, `followers_timeseries`, `subscribers_timeseries`, `growth_sources`, `growth_events`, `network_attribution`.

`audience_overlap` is the interesting one. It names the other Substacks whose readers overlap yours, with percentages, which is the list of people worth doing a swap with.

### Tags and comments

| Tool | Risk | What it does |
|---|---|---|
| `list_publication_tags` | read | Every tag on the publication |
| `create_tag` | write | Create one |
| `get_post_tags` | read | Tags on one post |
| `add_tag_to_post` | write | Tag a post |
| `remove_tag_from_post` | **destructive** | Untag. Needs `confirm` |
| `get_post_comments` | read | Comments on your post |
| `comment_on_post` | **destructive** | Public immediately. Needs `confirm` |
| `delete_comment` | **destructive** | Permanent. Needs `confirm` |

### Reading Substack

| Tool | Risk | What it does |
|---|---|---|
| `list_subscriptions` | read | What this account subscribes to |
| `list_reader_posts` | read | Your inbox |
| `get_reader_post` | read | Any post you have access to, including paid ones |
| `get_reader_feed` | read | The Notes timeline |
| `get_profile_feed` | read | Everything one account has published |
| `get_comment_thread` | read | A Note and its replies |
| `restack_note` | **destructive** | Republishes to your followers. Needs `confirm` |

### Publication

| Tool | Risk | What it does |
|---|---|---|
| `get_publication_settings` | read | Every setting on the settings page |
| `update_publication_settings` | write | Change them, including theme colours |
| `get_user_profile` | read | Which account is connected |
| `search_publications` | read | Find Substacks by name or topic. No auth needed |
| `get_publication_info` | read | Public details of any publication |
| `list_contributors` | read | Who can write on it, with byline ids |
| `get_import_status` | read | Result of the last subscriber import |

`update_publication_settings` names `accent_color` and `color_links` explicitly, because Substack stores them under opaque theme variable names, and `color_links` being off is the usual reason links render nearly invisible on a dark theme.

### Templates

| Tool | Risk | What it does |
|---|---|---|
| `list_templates` | read | Your saved post templates |
| `create_template` | write | Save one |
| `delete_template` | **destructive** | Permanent. Needs `confirm` |
| `create_draft_from_template` | write | Start a draft from one, formatting exact |

### Research

| Tool | Risk | What it does |
|---|---|---|
| `research_creator_posts` | read | Another writer's posts **with engagement numbers** |
| `research_creator_notes` | read | Their Notes, ranked by likes or restacks |
| `compare_publications` | read | Up to 10 publications ranked together |
| `scrape_post` | read | Any public post from its URL |

`compare_publications` scores by likes, plus comments times two, plus restacks times three, because a comment and a restack both cost more effort than a like.

### Images

| Tool | Risk | What it does |
|---|---|---|
| `upload_image` | write | Upload from a URL or a local file, get a CDN URL back |

Takes exactly one of `url` or `path`. PNG, JPEG, GIF and WebP up to 10MB. The type is checked from the file's contents, not its extension.

### Resources and prompts

Beyond tools, the server exposes two MCP resources (`substack://publication` and `substack://connected`) so a client can load your publication's context without spending a tool call, and four prompts: **Draft a post from an idea**, **Find what worked**, **Study another writer**, and **Find lapsed subscribers**.
### Several publications

One Substack login often owns more than one publication.

```json
"env": {
  "SUBSTACK_PUBLICATIONS": "[{\"publication_url\":\"one.substack.com\",\"session_token\":\"...\"},{\"publication_url\":\"two.substack.com\",\"session_token\":\"...\"}]"
}
```

Every publication-scoped tool takes an optional `publication` argument, matched loosely against the hostname, so `"two"` finds `two.substack.com`. Leave it out and the first one is used.

Ask for a publication that is not connected and the error names the ones that are, rather than failing silently against the wrong Substack.

## 8. Writing safely 🔒

Two positions are common and both are wrong. Ship `publish` and `delete` unguarded, and one mis-parsed instruction emails your entire list. Remove them and call that safety, and you have not made anything safer, you have moved the work back to the human.

The actual hazard is narrow and worth naming.

`publish_draft` with `send: true` emails every subscriber you have, and there is no unsend. `delete_draft` has no undo. `publish_note` and `comment_on_post` are public the instant they run.

None of these is dangerous when a person meant it. All of them are dangerous one plausible misreading of "tidy up my drafts" away.

So everything works, and the irreversible things need your approval:

```
delete_draft is public or cannot be undone, so it will not run without confirm: true. About to: delete draft 4821. Call again with confirm: true if that is what was asked for.
```

In a terminal that is `--confirm`, which `--agent` never adds. Over MCP a person approves each call where the client can ask: Claude Code (2.1.246 and later) shows its own prompt, and a client that can show forms asks with an approval form whose one box starts unticked. Each approval is signed, bound to that exact call and works once. Where a client can do neither, the model's `confirm: true` counts, and it should pass it only when you asked for that exact action. `SUBSTACK_CONFIRM=model` makes `confirm: true` enough everywhere, for an agent with no person to ask.

### Turning writes off entirely

```json
"env": { "SUBSTACK_READ_ONLY": "1" }
```

Drops the server to its 41 read tools. Write tools are not merely refused, they are not advertised, so the model never tries.

`SUBSTACK_ALLOW_DESTRUCTIVE=0` is the middle setting: drafting and tagging still work, publishing and deleting do not.

### Annotations

Every tool sets `readOnlyHint`, `destructiveHint`, `idempotentHint` and `openWorldHint` explicitly. MCP defaults `destructiveHint` and `openWorldHint` to **true** when omitted, so a read tool left unannotated shows up in a client as dangerous, which trains people to ignore the warnings that matter.

### An audit log

```json
"env": { "SUBSTACK_AUDIT_LOG": "/Users/you/.substack-mcp/audit.log" }
```

Append-only, one JSON line per attempted write, allowed or blocked, with who approved it: `person`, `client` or `flag`.

### Prompt injection

Several tools return text other people wrote. Comments, your reader feed, another writer's posts.

An agent that can read that text and also publish is exposed to instructions hidden inside it. Someone can leave a comment that reads like a command.

Two things push back on that. Every one of those tools says so in its own response, and the server's instructions tell the model to treat that text as data rather than orders.

Neither is complete. The real defense for an agent working unattended is `SUBSTACK_READ_ONLY=1`, which removes the write tools entirely.

### Risks worth knowing

**This uses an undocumented API.**

Substack publishes no REST API and no OAuth. These are the endpoints its own web app calls.

They can change without notice, and when they do, tools break until the fix ships.

**Your session cookie is full account access.**

Anyone who gets it can post as you, read your subscribers, and change your billing. It is exactly as sensitive as your password.

Never paste it into an issue.

**An agent with publish rights can email your entire list.**

The approval gate makes that hard to do by accident. It does not make it impossible for a determined bad instruction.

If you are pointing an autonomous agent at this, run it with `SUBSTACK_READ_ONLY=1`.

**Automated subscriber additions are how publications get marked as spam.**

`add_subscriber` exists for people who asked to be added. Importing anyone else is your problem, not Substack's.

**Terms of service.**

Automating your own account through its own web endpoints is not something Substack documents or blesses.

I am not aware of anyone being banned for it. I cannot promise it, and neither can anyone else shipping a tool like this.

## 9. Writing posts ✍️

`draft_body` is **not HTML**. It is a JSON ProseMirror document. This is the single most common way a Substack integration goes wrong: send HTML and the API returns 200, then the post renders with the tags visible as literal text. There is no error. You find out by looking at the published post.

This server converts markdown, HTML, or a ready-made document into the real format, and detects which you sent.

### Markdown

Headings, bold, italic, inline code, strikethrough, links, images, nested lists to any depth with ordered and unordered mixed, fenced code blocks with a language, blockquotes and horizontal rules.

### Embeds

A line containing only a YouTube, X, Spotify or Vimeo URL becomes a **real embedded player**:

```markdown
Here is the walkthrough.

https://www.youtube.com/watch?v=dQw4w9WgXcQ

The transcript is below.
```

Substack's editor does this client-side, so it never happens for anything written through the API. Doing it here is why a draft from this server looks like one you made by hand. Put the URL inside a sentence and it stays an ordinary link.

`x.com` links are rewritten to `twitter.com`, because Substack's embed only resolves the latter.

### Paywalls

```markdown
The free part everyone sees.

<paywall>

The part only paying subscribers get.
```

### Tables

Substack's document format has no table node, so a table cannot be rendered natively. Rather than mangle the pipes into a paragraph, a markdown table is preserved verbatim in a code block. The content survives and you can reformat it in the editor.

### Reading it back

`get_draft` returns markdown by default. Edit one sentence, send it back to `update_draft`, and the rest of the formatting survives.

`preview_draft_body` shows exactly what a body will produce, including how many embeds were created and whether the paywall registered, without touching anything.

## 10. Your data 💾

Nothing is sent anywhere except Substack. There is no telemetry, no analytics, and no third-party service in the path.

Two files, both in `~/.substack-mcp` (`SUBSTACK_MCP_HOME` moves it):

**`session.json`**, only if you ran `login`. Written `0600`, encrypted with AES-256-GCM under a key derived from this OS account and this machine, which is never stored.

Be clear about what that buys. A copied file is useless elsewhere, and a casual disk or backup read sees ciphertext.

It is machine binding, not a vault. Code running as you on this machine can re-derive the key.

That is the same exposure as the environment variable path, which is why environment variables stay fully supported.

**`scheduled-notes.json`**, the local queue for `schedule_note`. Plain JSON, `0600`, containing the text of Notes you have not published yet.

Your posts, drafts and subscribers are never copied locally. Every read goes to Substack live.

### How it works

```
your MCP client
      |  stdio (or HTTP)
      v
  substack-mcp
      |
      +-- Slipway            both surfaces, the write guard, the audit log
      +-- content pipeline   markdown/HTML <-> ProseMirror, embeds
      +-- one HTTP client    timeout, retry, backoff, spacing
      |
      v
Substack's own JSON endpoints, signed with your session cookie
```

Every request goes through one client, so an upstream change is fixed in one file. That client adds four things a bare `fetch` does not:

**A real deadline.** Node applies no request timeout, only a 10 second connect timeout. A host that accepts the connection and then goes quiet would otherwise hang a tool call forever. Default 30 seconds, set with `SUBSTACK_REQUEST_TIMEOUT_MS`.

**Retries that help.** 429 and 5xx get exponential backoff with jitter, honouring `Retry-After`. Nothing else is retried, because nothing else resolves by waiting.

**Request spacing.** A floor of 350ms between requests, serialised through a queue, so a model looping over 200 posts does not get your account rate limited. `SUBSTACK_MIN_REQUEST_INTERVAL_MS`.

**A browser identity.** The client sends a browser User-Agent, Referer and Origin, because some publications sit behind Cloudflare, which blocks unrecognized clients. The error mapper recognises a Cloudflare block hiding inside a 403 and tells you to use the canonical host.

Errors map to typed classes, so the message names the fix rather than saying "Substack API error":

| Class | Status | Cause |
|---|---|---|
| `AuthenticationError` | 401/403 | Expired session, or a Cloudflare block |
| `RateLimitError` | 429 | Too many requests, after retries |
| `ValidationError` | 400 | Bad arguments |
| `NotFoundError` | 404 | No such draft, post or note |
| `ServerError` | 5xx | Substack's problem |
| `TimeoutError` | 408 | Our own deadline, no response arrived |

## 11. Troubleshooting 🔧

Run `npx @thenavidm/substack-mcp-cli@latest doctor` first. It checks credentials, config, connectivity and byline resolution, and names what is wrong.

**"Substack rejected the session"** Your cookie expired. Get a fresh `connect.sid`, or run `login` again.

**Calls fail on a custom domain** A publication served on its own domain does not answer the API there. The request redirects and ends in a 404. Set `SUBSTACK_PUBLICATION_URL` to the canonical `*.substack.com` host instead, which is served directly. The research tools retry the canonical host automatically; everything else needs it configured.

Some custom domains sit behind Cloudflare, which can answer 403 with `error code: 1010`. That is the same fix.

**Post renders with visible HTML tags** You are on an older version, or something else wrote that draft. This server never sends HTML as `draft_body`. Check with `preview_draft_body`.

**`create_draft` fails on the byline** Substack requires a byline, and it is your numeric user id. Normally resolved automatically. If that fails, set `SUBSTACK_USER_ID`. `doctor` tells you which.

**A scheduled Note did not fire** The server was not running at the time. It publishes on the next start, marked `published_late`. Check with `list_scheduled_notes`, and see the next section.

**Tools missing from the list** `SUBSTACK_READ_ONLY` is set. The 24 write tools are hidden by design.

**Nothing happens at all** Check your client's MCP logs. On a bad config the server still starts and reports the problem per tool call, rather than failing silently at boot.

**"will not run without --confirm"** Working as intended. See [section 8](#8-writing-safely-).

**Claude Code asks before every publish** Expected: publishing, deleting, Notes and comments wait for your approval.

**`claude -p` will not publish** Headless Claude Code refuses tools that need a person. Give that agent `SUBSTACK_CONFIRM=model`.

**No approval form appears** The client cannot show forms, so the model's `confirm: true` counts, and only for an action you asked for.

**A piped request gets no answer** Stdin closed before the answer. The MCP stdio binding stops a server when its input ends; keep stdin open until you read the answer, or use the CLI.


## Environment variables

Two are required. Everything else has a working default and exists so you can
tighten or tune it.

**Credentials**

| Variable | What it is |
|---|---|
| `SUBSTACK_PUBLICATION_URL` | Your publication, e.g. `example.substack.com` |
| `SUBSTACK_SESSION_TOKEN` | The `connect.sid` cookie value. [Section 3](#3-setup-) shows where to find it |
| `SUBSTACK_USER_ID` | Optional. Resolved automatically when absent |
| `SUBSTACK_PUBLICATIONS` | A JSON array instead, for several publications at once |

**Safety**

| Variable | Default | What it does |
|---|---|---|
| `SUBSTACK_READ_ONLY` | `0` | `1` hides every write, leaving the 41 reading tools |
| `SUBSTACK_ALLOW_DESTRUCTIVE` | `1` | `0` keeps ordinary writes, blocks publishing and deleting |
| `SUBSTACK_AUDIT_LOG` | none | Path to an append-only log of every attempted write, and who approved it |
| `SUBSTACK_CONFIRM` | `human` | `model` lets `confirm: true` alone approve over MCP, for an agent with no person to ask |

**Tuning**

| Variable | Default | What it does |
|---|---|---|
| `SUBSTACK_REQUEST_TIMEOUT_MS` | `30000` | Per-request deadline |
| `SUBSTACK_MIN_REQUEST_INTERVAL_MS` | `350` | Spacing between requests |
| `SUBSTACK_MAX_RETRIES` | `3` | Retries on rate limits and 5xx |
| `SUBSTACK_USER_AGENT` | a browser UA | Sent on every request |
| `SUBSTACK_MCP_HOME` | `~/.substack-mcp` | Where the session and queued Notes are kept |
| `SUBSTACK_TOOL_TIMEOUT_MS` | none | Give up on any tool after this long |
| `SUBSTACK_SURFACE` | `full` | `search` lists three tools that find, describe and run the rest |
| `SUBSTACK_DEBUG` | `0` | `1` prints debug lines on stderr |

**Serving over HTTP** (`--http`, see [SECURITY.md](SECURITY.md) before you use it)

| Variable | Default | What it does |
|---|---|---|
| `SUBSTACK_HTTP_PORT` | `8788` | Port to bind |
| `SUBSTACK_HTTP_HOST` | `127.0.0.1` | Interface to bind |
| `SUBSTACK_HTTP_TOKEN` | none | Bearer token. Any address but localhost refuses to start without one |
| `SUBSTACK_HTTP_ALLOWED_ORIGINS` | none | Comma-separated browser origins allowed to connect beyond localhost |

2.2 named these `SUBSTACK_MCP_PORT`, `SUBSTACK_MCP_HOST`, `SUBSTACK_MCP_TOKEN` and `SUBSTACK_MCP_ALLOWED_ORIGINS`. Those names still work, and the new ones win when both are set.

## Versions

See [CHANGELOG.md](CHANGELOG.md).

## 12. FAQ ❓

<details>
<summary><b>What is an MCP server?</b></summary>

An MCP server is a standard way to give an AI assistant real access to a tool.

Instead of describing your Substack to Claude and hoping it guesses right, the server exposes your actual drafts, subscribers and analytics as things the assistant can read and act on.

MCP is the protocol they agree on, so one server works in Claude, Cursor, Windsurf and anything else that speaks it.

</details>

<details>
<summary><b>What is the CLI?</b></summary>

`substack-cli` is the same program as the MCP server, run as commands. AI agents that run commands, like Claude Code, Codex and OpenCode, use it on their own, and you can type the same commands in a terminal, a script or a cron job. Every tool is a command with dashes, so `list_drafts` runs as `substack-cli list-drafts`.

</details>

<details>
<summary><b>Should I use the MCP server or the CLI?</b></summary>

Use the MCP server in an app with no terminal, like Claude Desktop's chat. Use the CLI anywhere commands run: an agent like Claude Code, Codex or OpenCode, a script or a cron job. The MCP server's tools take up context on every message, and the CLI costs nothing until it runs.

</details>

<details>
<summary><b>What is Substack?</b></summary>

Substack is a publishing platform for newsletters and blogs. Writers publish posts that go out by email and live on the web, sell paid subscriptions, and post short updates called Notes. This server connects an AI assistant to a Substack publication you own.

</details>

<details>
<summary><b>Do I need to be technical to use this?</b></summary>

You need to be able to paste a line into a terminal and copy a value out of your browser. That is the whole skill requirement. [Section 3](#3-setup-) walks through the browser part click by click, and `doctor` tells you what is wrong in plain language if something does not work.

</details>

<details>
<summary><b>Is my data sent anywhere? Who can see it?</b></summary>

Nothing goes anywhere except Substack. There is no backend, no telemetry, and no third party in the path. Your session cookie and any queued Notes sit in `~/.substack-mcp` on your own machine, and [section 10](#10-your-data-) says exactly what is in each file.

</details>

<details>
<summary><b>What can it do that I cannot do in the Substack dashboard already?</b></summary>

Three things the dashboard cannot do.

It reads the engagement metrics Substack lets you filter on but never shows you, through `export_subscribers`.

It pulls another writer's posts and Notes with their like and restack counts, so you can rank by what actually worked.

And it turns markdown into real Substack formatting, including embeds and paywalls, which the editor does not do for anything written outside it.

</details>

<details>
<summary><b>Can it delete something by accident?</b></summary>

Not without your approval. `delete_draft`, `delete_note`, `delete_comment` and `delete_template` are permanent, with no trash to recover from.

All four wait for your approval: Claude Code shows its own prompt for each one, and a client that can show forms asks with one. Where a client can do neither, the model must pass `confirm: true`. The same guard covers `publish_draft`, because publishing with `send: true` emails your whole list and an email cannot be unsent.

Setting `SUBSTACK_READ_ONLY=1` removes all 24 write tools from the list entirely.

</details>

<details>
<summary><b>Does it cost anything?</b></summary>

It costs nothing. The server is MIT licensed and free, and Substack itself is free to write on. Some analytics reports only return data once your publication has paid subscribers, because there is nothing to report until then.

</details>

<details>
<summary><b>Does it work with ChatGPT or Cursor, or only Claude?</b></summary>

It works with any client that speaks MCP. Claude Code, Claude Desktop, Cursor, Windsurf, VS Code, Zed and Cline are all covered in [section 2](#2-quick-install-), and anything else that supports MCP over stdio will work with the same three settings.

</details>

<details>
<summary><b>Can I connect more than one publication?</b></summary>

You can connect as many as you like. One Substack login often owns several, so every publication-scoped tool takes an optional `publication` argument matched against the hostname. Set `SUBSTACK_PUBLICATIONS` to a JSON array and pass `publication: "example"` to pick one, or leave it out and the first is used.

</details>

<details>
<summary><b>What happens when my session expires?</b></summary>

Substack sessions do expire, and when yours does every authenticated tool starts returning an authentication error naming the cause. The fix is to grab a fresh `connect.sid` cookie and update it, or run `substack-mcp login` again. `doctor` warns you once a stored session passes 75 days, before it breaks.

</details>

<details>
<summary><b>Can it publish without me asking?</b></summary>

It publishes when you ask it to. Publishing, deleting, Notes and comments wait
for your approval: Claude Code shows its own prompt for each one, and a client
that can show forms asks with one. Where a client can do neither, the model's
`confirm: true` counts, which is a speed bump against a careless call rather
than a lock. Setting `SUBSTACK_READ_ONLY=1` removes every write tool from the
list, so the model cannot see or call them.

</details>

<details>
<summary><b>How do I disconnect it?</b></summary>

Remove the server from your client's config, which for Claude Code is `claude mcp remove substack`. Then delete `~/.substack-mcp` to remove the stored session and any queued Notes. Nothing is left behind, and nothing was ever stored anywhere but your own machine.

</details>

## Questions

Run into a problem or have a question? [Open an issue](https://github.com/thenavidm/substack-mcp-cli/issues) and I will help.

Found a security vulnerability? [Report it privately](https://github.com/thenavidm/substack-mcp-cli/security/advisories/new) instead, never as an issue. [SECURITY.md](SECURITY.md) covers what this holds, the write-safety model, and running it over HTTP.

## About the author

Navid Moazzez is a leading AI business strategist, and the host of the AI Creator Summit, watched by 100,000+ creators. He helps creators and founders master AI and build their own AI Operating System (AI OS) to automate their business and life. He creates useful free tools, MCP servers and CLIs that creators and founders can use in their own workflows.

**Links**

- Personal website: [navid.me](https://navid.me?utm_source=github&utm_medium=referral&utm_campaign=substack-mcp-cli&utm_content=readme)
- Link in bio: [navid.bio](https://navid.bio?utm_source=github&utm_medium=referral&utm_campaign=substack-mcp-cli&utm_content=readme)
- Navid Media: [navid.media](https://navid.media?utm_source=github&utm_medium=referral&utm_campaign=substack-mcp-cli&utm_content=readme)
- YouTube: [@thenavidm](https://youtube.com/@thenavidm?sub_confirmation=1) and [@thenavidai](https://youtube.com/@thenavidai?sub_confirmation=1)
- X: [@thenavidm](https://x.com/thenavidm)
- Instagram: [@thenavidm](https://instagram.com/thenavidm)
- LinkedIn: [thenavidm](https://linkedin.com/in/thenavidm)

If this is useful, star the repo and come say hi on [X](https://x.com/thenavidm).

## Dependencies

| Library | License | What it does |
|---|---|---|
| [Slipway](https://github.com/thenavidm/slipway) | Apache-2.0 | The MCP server and the CLI from one definition of each tool, with the write guard |
| [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) | Apache-2.0 | The MCP protocol and transports, through Slipway |
| [zod](https://github.com/colinhacks/zod) | MIT | Tool argument schemas and validation |

[Playwright](https://github.com/microsoft/playwright) is an optional peer dependency, used only by `login --playwright` and never loaded by the server.

## License

[MIT](./LICENSE). Free to use, modify, and share.

Not affiliated with, endorsed by, or connected to Substack Inc.

---

© 2026 [Navid Media](https://navid.media?utm_source=github&utm_medium=referral&utm_campaign=substack-mcp-cli&utm_content=readme). Made with ❤️ by [Navid Moazzez](https://navid.me?utm_source=github&utm_medium=referral&utm_campaign=substack-mcp-cli&utm_content=readme).
