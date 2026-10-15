export const LANGUAGES = ["en", "es", "fr", "de", "ta"] as const;
export type Language = (typeof LANGUAGES)[number];

export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];

export const FONT_MIN = 12;
export const FONT_MAX = 24;

/** The user-facing settings. */
export interface Preferences {
  theme: Theme;
  language: Language;
  fontSize: number;
}

export type PreferenceKey = keyof Preferences;

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "light",
  language: "en",
  fontSize: 16,
};

/**
 * A preference value plus the metadata needed to order concurrent writes.
 * Each preference is stored as its own register (last-writer-wins per key).
 */
export interface Stamped<T> {
  value: T;
  /** Lamport clock: one more than the highest clock this tab had seen when it wrote. */
  clock: number;
  /** Id of the tab that wrote the value. Breaks ties deterministically. */
  writer: string;
}

/** The full synchronized state: one stamped register per preference. */
export type Replica = { [K in PreferenceKey]: Stamped<Preferences[K]> };

/** localStorage key holding the persisted replica. */
export const STORAGE_KEY = "prefs-sync:v1";

/** BroadcastChannel name used for instant cross-tab messages. */
export const CHANNEL_NAME = "prefs-sync";

/** Message sent over the BroadcastChannel. */
export interface SyncMessage {
  type: "state";
  replica: Replica;
  /** Date.now() when the sender posted, used to measure sync latency. */
  sentAt: number;
}

/** Describes why the store changed, so the UI can react. */
export interface ChangeInfo {
  source: "local" | "remote" | "storage";
  /** Only set for "remote" (BroadcastChannel) updates. */
  latencyMs?: number;
}
