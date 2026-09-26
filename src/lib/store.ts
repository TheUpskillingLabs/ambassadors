/* All personal state stays on this device (nothing personal is sent to a
   server). Every access is wrapped: storage can be unavailable (private
   mode, blocked site data) and the site must still work. */

const KEYS = {
  progress: "ag.progress.v1",
  story: "ag.story.v1",
  practice: "ag.practice.v1",
  profile: "ag.profile.v1",
  asks: "ag.asks.v1",
  application: "ag.application.v1",
  invites: "ag.invites.v1",
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

/** Which steps are done: step id -> timestamp. */
export const progress = {
  all(): Record<string, number> {
    return read<Record<string, number>>(KEYS.progress, {});
  },
  markRead(id: string): void {
    const p = this.all();
    if (!p[id]) write(KEYS.progress, { ...p, [id]: Date.now() });
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
};

/** Private self-checks on practice cards. Never shown as a score; "not"
 *  cards come back first next time. */
export type SelfCheck = "had" | "not";
export const practice = {
  all(): Record<string, SelfCheck> {
    return read<Record<string, SelfCheck>>(KEYS.practice, {});
  },
  set(id: string, v: SelfCheck): void {
    write(KEYS.practice, { ...this.all(), [id]: v });
  },
};

/** The ambassador's own first name, for "say {me} sent you". */
export const profile = {
  get(): { me?: string } {
    return read<{ me?: string }>(KEYS.profile, {});
  },
  set(p: { me?: string }): void {
    write(KEYS.profile, { ...this.get(), ...p });
  },
};

export type Ask = { name: string; sent?: number };

/** "Who will you ask?" Invites go from the ambassador's own phone, never
 *  from this site. */
export const asks = {
  get(): Ask[] {
    return read<Ask[]>(KEYS.asks, []);
  },
  set(list: Ask[]): void {
    write(KEYS.asks, list);
  },
};

/** The ambassador application (/apply/). Until OLOS sign-in exists it lives
 *  only here; src/lib/apply.ts maps it to OLOS's registration fields. */
export type Application = {
  first?: string;
  last?: string;
  email?: string;
  zip?: string;
  referredBy?: string;
  agreement?: { version: string; acceptedAt: number };
  videoAt?: number;
  quiz?: { score: number; total: number; passedAt: number };
  /** A coordinator's pre-approved invite (from an /invite/ link). */
  invite?: { by: string; note?: string; at: number };
};
/** none: hasn't started · started: part way · pending: passed, waiting for the
 *  coordinator to confirm · in: passed with a pre-approved invite. */
export type ApplicationStatus = "none" | "started" | "pending" | "in";
export const application = {
  get(): Application {
    return read<Application>(KEYS.application, {});
  },
  set(a: Partial<Application>): Application {
    const next = { ...this.get(), ...a };
    write(KEYS.application, next);
    return next;
  },
  /** Passed the quiz (in, or pending the coordinator's confirmation). */
  passed(): boolean {
    return Boolean(this.get().quiz?.passedAt);
  },
  started(): boolean {
    const a = this.get();
    return Boolean(a.first || a.email || a.agreement);
  },
  status(): ApplicationStatus {
    const a = this.get();
    if (a.quiz?.passedAt) return a.invite ? "in" : "pending";
    return this.started() ? "started" : "none";
  },
};

/** Invites a coordinator has made on this device (/invite/). */
export type SentInvite = { first: string; last: string; link: string; at: number };
export const invites = {
  all(): SentInvite[] {
    return read<SentInvite[]>(KEYS.invites, []);
  },
  add(i: SentInvite): void {
    write(KEYS.invites, [i, ...this.all().filter((x) => x.link !== i.link)].slice(0, 50));
  },
  clear(): void {
    write(KEYS.invites, []);
  },
};

/** "Start over": forget everything this site saved on this device. */
export function resetAll(): void {
  try {
    Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
    ["ag.updatesSeen.v1"].forEach((k) => localStorage.removeItem(k)); // retired key
  } catch {
    /* ignore */
  }
}

/** Spoken-length estimate: ~150 words per minute (65–85 words ≈ 30 s). */
export function wordStats(text: string): { words: number; seconds: number } {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return { words, seconds: Math.round((words / 150) * 60) };
}
