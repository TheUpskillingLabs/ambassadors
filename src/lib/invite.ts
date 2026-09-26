/* Pre-approved invites. A coordinator's /invite/ page packs the invitee's
   name, email, and who invited them into the part of the link after "#"
   (never sent to the web server). /apply/ unpacks it. Until OLOS exists the
   link itself is the pre-approval; OLOS invitations replace it later. */

export type Invite = { first: string; last: string; email: string; by: string; note: string };

const cap = (v: unknown, n: number) => (typeof v === "string" ? v.trim().slice(0, n) : "");

/** UTF-8 safe base64url. */
function b64urlEncode(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): string {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function encodeInvite(i: Invite): string {
  return b64urlEncode(JSON.stringify({ v: 1, first: i.first, last: i.last, email: i.email, by: i.by, note: i.note }));
}

/** Returns null for anything that isn't a well-formed invite. */
export function decodeInvite(data: string): Invite | null {
  try {
    const o = JSON.parse(b64urlDecode(data));
    if (!o || o.v !== 1) return null;
    const inv = { first: cap(o.first, 60), last: cap(o.last, 60), email: cap(o.email, 120), by: cap(o.by, 80), note: cap(o.note, 200) };
    return inv.first && inv.by ? inv : null;
  } catch {
    return null;
  }
}

/** Reads "#invite=…" or "#ref=…" from a hash. */
export function readHash(hash: string): { invite?: Invite; ref?: string } {
  const p = new URLSearchParams(hash.replace(/^#/, ""));
  const inv = p.get("invite");
  if (inv) { const i = decodeInvite(inv); return i ? { invite: i } : {}; }
  const ref = cap(p.get("ref"), 80);
  return ref ? { ref } : {};
}
