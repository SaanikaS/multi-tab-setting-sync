import {
  DEFAULT_PREFERENCES,
  FONT_MAX,
  FONT_MIN,
  LANGUAGES,
  Preferences,
  PreferenceKey,
  Replica,
  Stamped,
} from "./types";

export const KEYS = Object.keys(DEFAULT_PREFERENCES) as PreferenceKey[];

/** Validates a single preference value. Used for user input and for data read from other tabs. */
export function isValid(key: PreferenceKey, value: unknown): boolean {
  switch (key) {
    case "theme":
      return value === "light" || value === "dark";
    case "language":
      return (LANGUAGES as readonly unknown[]).includes(value);
    case "fontSize":
      return typeof value === "number" && value >= FONT_MIN && value <= FONT_MAX;
    default:
      return false;
  }
}

/** A replica where every preference holds its default, stamped at clock 0. */
export function createReplica(writer: string): Replica {
  const entries = KEYS.map((key) => [key, { value: DEFAULT_PREFERENCES[key], clock: 0, writer }]);
  return Object.fromEntries(entries) as unknown as Replica;
}

/**
 * Total order on writes: higher clock wins. If clocks are equal, the larger
 * writer id wins. Every tab applies the same rule, so all tabs pick the same
 * winner no matter the order in which they receive updates.
 */
function isNewer(a: Stamped<unknown>, b: Stamped<unknown>): boolean {
  if (a.clock !== b.clock) return a.clock > b.clock;
  return a.writer > b.writer;
}

/**
 * Merges incoming state into local state, key by key.
 * This operation is commutative, associative and idempotent, so tabs converge
 * on the same values regardless of message order or duplicates.
 */
export function mergeReplicas(local: Replica, incoming: Partial<Replica>): Replica {
  const merged: Record<string, Stamped<unknown>> = { ...local };
  for (const key of KEYS) {
    const other = incoming[key];
    if (other && isNewer(other, merged[key])) {
      merged[key] = other;
    }
  }
  return merged as unknown as Replica;
}

/**
 * Records a local edit. The new clock is strictly greater than every clock
 * this tab has seen, so the edit wins over anything it has already observed.
 */
export function applyLocalChange<K extends PreferenceKey>(
  replica: Replica,
  key: K,
  value: Preferences[K],
  writer: string,
): Replica {
  const highest = Math.max(...KEYS.map((k) => replica[k].clock));
    return { ...replica, [key]: { value, clock: highest + 1, writer } } as unknown as Replica;
}

/** Extracts plain preference values from a replica. */
export function toPreferences(replica: Replica): Preferences {
    return Object.fromEntries(KEYS.map((k) => [k, replica[k].value])) as unknown as Preferences;
}

/**
 * Parses untrusted data (messages, storage). Drops any entry with a malformed
 * shape or an invalid value instead of letting it into the state.
 */
export function parseReplica(raw: unknown): Partial<Replica> {
  const out: Record<string, Stamped<unknown>> = {};
  if (typeof raw !== "object" || raw === null) return out as Partial<Replica>;

  const record = raw as Record<string, unknown>;
  for (const key of KEYS) {
    const entry = record[key] as Partial<Stamped<unknown>> | undefined;
    if (
      entry &&
      typeof entry.clock === "number" &&
      Number.isFinite(entry.clock) &&
      entry.clock >= 0 &&
      typeof entry.writer === "string" &&
      isValid(key, entry.value)
    ) {
      out[key] = { value: entry.value, clock: entry.clock, writer: entry.writer };
    }
  }
  return out as Partial<Replica>;
}
