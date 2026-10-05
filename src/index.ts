#!/usr/bin/env node
/**
 * Both binaries. `substack-mcp` with no arguments serves MCP over stdio,
 * `--http` serves it over HTTP, and any command runs one tool from the shell.
 *
 * Node's compile cache goes on before the app loads, so every launch after the
 * first skips compiling it again. Node before 22.8 has no compile cache and
 * starts as before; NODE_DISABLE_COMPILE_CACHE=1 turns it off.
 */

import * as nodeModule from "node:module";

// 2.2 named the HTTP settings SUBSTACK_MCP_*. They keep working, and the new names win when both are set.
for (const name of ["PORT", "HOST", "TOKEN", "ALLOWED_ORIGINS"]) {
  const before = process.env[`SUBSTACK_MCP_${name}`];
  if (before && !process.env[`SUBSTACK_HTTP_${name}`]) process.env[`SUBSTACK_HTTP_${name}`] = before;
}

nodeModule.enableCompileCache?.();
const { app } = await import("./app.js");
await app.main();
