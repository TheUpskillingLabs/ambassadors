/* All personal state stays on this device (spec: nothing personal is sent
   to a server in v1). Every access is wrapped: storage can be unavailable
   (private mode, blocked site data) and the site must still work. */

const KEYS = {
  progress: "ag.progress.v1",
  story: "ag.story.v1",
  updatesSeen: "ag.updatesSeen.v1",
  practice: "ag.practice.v1",
  profile: "ag.profile.v1",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable: state lasts for this page view only */
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export type Progress = Record<string, number>; // pageId -> read timestamp

export const progress = {
  all(): Progress {
    return read<Progress>(KEYS.progress, {});
  },
  isRead(id: string): boolean {
    return Boolean(this.all()[id]);
  },
  markRead(id: string): boolean {
    const p = this.all();
    if (p[id]) return false;
    p[id] = Date.now();
    write(KEYS.progress, p);
    document.dispatchEvent(new CustomEvent("ag:progress", { detail: { id } }));
    return true;
  },
  count(ids: string[]): number {
    const p = this.all();
    return ids.filter((id) => p[id]).length;
  },
  reset(): void {
    remove(KEYS.progress);
    document.dispatchEvent(new CustomEvent("ag:progress", { detail: { id: null } }));
  },
};

export type Story = { answers: Record<string, string>; draft: string; savedAt?: number };

export const story = {
  get(): Story {
    return read<Story>(KEYS.story, { answers: {}, draft: "" });
  },
  save(s: Story): void {
    write(KEYS.story, { ...s, savedAt: Date.now() });
  },
  clear(): void {
    remove(KEYS.story);
  },
};

export const updatesSeen = {
  /** ISO date of the newest update the reader has seen, or "" if never. */
  get(): string {
    return read<string>(KEYS.updatesSeen, "");
  },
  set(isoDate: string): void {
    write(KEYS.updatesSeen, isoDate);
  },
};

export type SelfCheck = "had" | "close" | "not";

/** Private self-checks on practice cards. Never shown as a score; only used
 *  to bring "Not yet" and "Close" cards back first. */
export const practice = {
  all(): Record<string, SelfCheck> {
    return read<Record<string, SelfCheck>>(KEYS.practice, {});
  },
  set(id: string, v: SelfCheck): void {
    const all = this.all();
    all[id] = v;
    write(KEYS.practice, all);
  },
};

export type Profile = {
  name?: string;
  type?: "participant" | "mentor" | "partner" | "volunteer";
  mode?: "conversation" | "room" | "both";
  eventDate?: string; // YYYY-MM-DD, local
  onboarded?: number; // timestamp; set on finish or skip
  readySince?: number; // first time the whole path was complete
};

/** The ambassador's own answers from onboarding. Device-only. */
export const profile = {
  get(): Profile {
    return read<Profile>(KEYS.profile, {});
  },
  set(p: Partial<Profile>): Profile {
    const next = { ...this.get(), ...p };
    write(KEYS.profile, next);
    return next;
  },
  clear(): void {
    remove(KEYS.profile);
  },
};

/** Whole days from today to a local YYYY-MM-DD date (0 = today). */
export function daysUntil(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  const target = new Date(y, m - 1, d).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((target - today) / 86400000);
}

/** Spoken-length estimate: ~150 words per minute (65–85 words ≈ 30 s). */
export function wordStats(text: string): { words: number; seconds: number } {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return { words, seconds: Math.round((words / 150) * 60) };
}
