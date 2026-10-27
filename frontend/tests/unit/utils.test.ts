import { describe, it, expect } from "vitest";
import { truncateHash, formatTimestamp, cn } from "../../src/lib/utils";

describe("Utility functions", () => {
  it("truncates long hex hash to first 8 and last 6 characters", () => {
    const fullHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    expect(truncateHash(fullHash)).toBe("e3b0c442...52b855");
  });

  it("handles short or empty hash strings gracefully", () => {
    expect(truncateHash("abc")).toBe("abc");
    expect(truncateHash(null)).toBe("—");
    expect(truncateHash(undefined)).toBe("—");
  });

  it("formats ISO timestamps cleanly", () => {
    const iso = "2026-10-27T10:15:30.120Z";
    const formatted = formatTimestamp(iso);
    expect(formatted).toBe("2026-10-27 10:15:30.120");
  });

  it("merges tailwind class names properly", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});
