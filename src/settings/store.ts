import {
  applyLocalChange,
  createReplica,
  isValid,
  KEYS,
  mergeReplicas,
  parseReplica,
  toPreferences,
} from "./merge";
import {
  CHANNEL_NAME,
  ChangeInfo,
  Preferences,
  PreferenceKey,
  Replica,
  STORAGE_KEY,
  SyncMessage,
} from "./types";

type Listener = (prefs: Preferences, info: ChangeInfo) => void;

function newTabId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // crypto.randomUUID needs a secure context (https or localhost). This fallback keeps the app working elsewhere.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Keeps preferences consistent across all tabs of the same origin.
 *
 * Transport layers:
 *  - BroadcastChannel: instant delivery to every other open tab (typically a few ms).
 *  - localStorage + "storage" event: persistence across restarts, and a fallback
 *    channel for browsers without BroadcastChannel.
 *
 * Every incoming state is merged with the local one. Merging is idempotent, so
 * receiving the same update twice (once per channel) is harmless.
 */
export class PreferenceStore {
  private readonly tabId = newTabId();
  private replica: Replica;
  private readonly channel: BroadcastChannel | null;
  private readonly listeners = new Set<Listener>();

  constructor() {
    this.replica = this.load();

    this.channel = typeof BroadcastChannel === "function" ? new BroadcastChannel(CHANNEL_NAME) : null;
    this.channel?.addEventListener("message", (event: MessageEvent<SyncMessage>) => {
      if (event.data?.type !== "state") return;
      const latencyMs = Date.now() - event.data.sentAt;
      this.absorb(parseReplica(event.data.replica), "remote", latencyMs);
    });

    window.addEventListener("storage", (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || event.newValue === null) return;
      try {
        this.absorb(parseReplica(JSON.parse(event.newValue)), "storage");
      } catch {
        // Ignore malformed data written by something else.
      }
    });
  }

  get preferences(): Preferences {
    return toPreferences(this.replica);
  }

  /** Updates one preference, persists it, and broadcasts it to other tabs. */
  set<K extends PreferenceKey>(key: K, value: Preferences[K]): void {
    if (!isValid(key, value)) {
      throw new RangeError(`Invalid value for ${key}: ${String(value)}`);
    }
    if (this.replica[key].value === value) return;

    this.replica = applyLocalChange(this.replica, key, value, this.tabId);
    this.persist();
    this.channel?.postMessage({
      type: "state",
      replica: this.replica,
      sentAt: Date.now(),
    } satisfies SyncMessage);
    this.notify({ source: "local" });
  }

  /** Registers a listener for every change. Returns an unsubscribe function. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  close(): void {
    this.channel?.close();
  }

  /** Merges incoming state. Persists and notifies only if something actually changed. */
  private absorb(incoming: Partial<Replica>, source: ChangeInfo["source"], latencyMs?: number): void {
    const next = mergeReplicas(this.replica, incoming);
    const changed = KEYS.some((key) => next[key] !== this.replica[key]);
    if (!changed) return;

    this.replica = next;
    this.persist();
    this.notify({ source, latencyMs });
  }

  private load(): Replica {
    const fallback = createReplica(this.tabId);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? mergeReplicas(fallback, parseReplica(JSON.parse(raw))) : fallback;
    } catch {
      return fallback;
    }
  }

  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.replica));
    } catch {
      // Storage is full or disabled. Live sync between open tabs still works.
    }
  }

  private notify(info: ChangeInfo): void {
    const prefs = this.preferences;
    for (const listener of this.listeners) {
      listener(prefs, info);
    }
  }
}
