// The write guard and annotations are Slipway's now, and tested in tests/cli.test.ts and in Slipway.
import { describe, expect, it } from "vitest";
import { DEFAULT_USER_AGENT, normalizeHost, selectPublication, type Config } from "../src/config.js";

function config(overrides: Partial<Config> = {}): Config {
  return {
    publications: [
      { publicationUrl: "example.substack.com", sessionToken: "t", userId: "1" },
      { publicationUrl: "second.substack.com", sessionToken: "t2" },
    ],
    readOnly: false,
    allowDestructive: true,
    requestTimeoutMs: 30_000,
    userAgent: DEFAULT_USER_AGENT,
    minRequestIntervalMs: 350,
    maxRetries: 3,
    ...overrides,
  };
}

describe("publication selection", () => {
  it("defaults to the first", () => {
    expect(selectPublication(config()).publicationUrl).toBe("example.substack.com");
  });

  it("matches on a bare name", () => {
    expect(selectPublication(config(), "second").publicationUrl).toBe("second.substack.com");
  });

  it("matches on a full url", () => {
    expect(selectPublication(config(), "https://second.substack.com/").publicationUrl).toBe(
      "second.substack.com",
    );
  });

  it("names what is connected when nothing matches", () => {
    expect(() => selectPublication(config(), "nope")).toThrow(/Connected: example/);
  });

  it("explains how to configure when nothing is connected", () => {
    expect(() => selectPublication(config({ publications: [] }))).toThrow(
      /SUBSTACK_PUBLICATION_URL/,
    );
  });
});

describe("host normalizing", () => {
  it("strips scheme, path and case", () => {
    expect(normalizeHost("HTTPS://Example.Substack.com/p/post")).toBe("example.substack.com");
    expect(normalizeHost("example.substack.com/")).toBe("example.substack.com");
  });
});
