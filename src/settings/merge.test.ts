import { describe, expect, it } from "vitest";
import { applyLocalChange, createReplica, mergeReplicas, parseReplica, toPreferences } from "./merge";

describe("mergeReplicas", () => {
  it("is commutative: both merge orders reach the same values", () => {
    const base = createReplica("base");
    const a = applyLocalChange(base, "theme", "dark", "tab-a");
    const b = applyLocalChange(base, "theme", "light", "tab-b");

    expect(toPreferences(mergeReplicas(a, b))).toEqual(toPreferences(mergeReplicas(b, a)));
  });

  it("is idempotent: merging the same state twice changes nothing", () => {
    const a = applyLocalChange(createReplica("base"), "fontSize", 20, "tab-a");
    expect(mergeReplicas(a, a)).toEqual(a);
  });

  it("keeps the write with the higher clock", () => {
    let r = createReplica("base");
    r = applyLocalChange(r, "language", "fr", "tab-a"); // clock 1
    r = applyLocalChange(r, "language", "de", "tab-a"); // clock 2

    const stale = applyLocalChange(createReplica("base"), "language", "es", "tab-b"); // clock 1
    expect(mergeReplicas(r, stale).language.value).toBe("de");
  });

  it("breaks equal-clock ties deterministically by writer id", () => {
    const a = applyLocalChange(createReplica("base"), "theme", "dark", "tab-a");
    const b = applyLocalChange(createReplica("base"), "theme", "light", "tab-b");

    // "tab-b" > "tab-a", so the light write wins in both directions.
    expect(mergeReplicas(a, b).theme.value).toBe("light");
    expect(mergeReplicas(b, a).theme.value).toBe("light");
  });

  it("gives a local edit a clock above everything it has already seen", () => {
    const remote = applyLocalChange(createReplica("base"), "theme", "dark", "tab-b");
    const merged = mergeReplicas(createReplica("tab-a"), remote);
    const next = applyLocalChange(merged, "fontSize", 18, "tab-a");

    expect(next.fontSize.clock).toBeGreaterThan(remote.theme.clock);
  });
});

describe("parseReplica", () => {
  it("drops entries with invalid values", () => {
    const parsed = parseReplica({
      theme: { value: "neon", clock: 99, writer: "x" },
      fontSize: { value: 500, clock: 1, writer: "x" },
    });
    expect(parsed.theme).toBeUndefined();
    expect(parsed.fontSize).toBeUndefined();
  });

  it("keeps well-formed entries", () => {
    const parsed = parseReplica({ language: { value: "ta", clock: 3, writer: "x" } });
    expect(parsed.language).toEqual({ value: "ta", clock: 3, writer: "x" });
  });

  it("returns an empty result for non-object input", () => {
    expect(parseReplica(null)).toEqual({});
    expect(parseReplica("not an object")).toEqual({});
  });
});
