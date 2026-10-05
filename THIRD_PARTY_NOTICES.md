# Third party notices

The source in this repository is MIT licensed. These production dependencies keep their own licenses, and the desktop bundle ships each one's license file with it:

| Dependency | License |
|---|---|
| [@thenavidm/slipway](https://github.com/thenavidm/slipway) | Apache-2.0 |
| [@modelcontextprotocol/server](https://github.com/modelcontextprotocol/typescript-sdk) and its `core` package | Apache-2.0 |
| [zod](https://github.com/colinhacks/zod) | MIT |

`login --playwright` uses [Playwright](https://github.com/microsoft/playwright) (Apache-2.0) when you have installed it yourself. It is an optional peer dependency, so it is never installed for you and never shipped in the desktop bundle.
