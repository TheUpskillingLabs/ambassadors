/* The ambassador application, and where it will meet OLOS.
   Today nothing is sent by the site: the applicant texts (or emails) their
   coordinator from their own phone at the end. When OLOS sign-in is ready,
   submitApplication() posts toOlosPayload() instead. */
import type { Application } from "./store";

/** OLOS registration field names (POST /api/registrations/funnel), plus the
 *  ambassador-only parts OLOS doesn't have yet (agreement doc "ambassador",
 *  quiz). */
export function toOlosPayload(a: Application) {
  return {
    first_name: a.first ?? "",
    last_name: a.last ?? "",
    email: a.email ?? "",
    zip: a.zip ?? "",
    source: a.referredBy ? "referral" : "other",
    referred_by: a.referredBy || undefined,
    agreement: a.agreement ? { doc: "ambassador", version: a.agreement.version, accepted_at: new Date(a.agreement.acceptedAt).toISOString() } : undefined,
    initiation: a.quiz ? { quiz_score: a.quiz.score, quiz_total: a.quiz.total, passed_at: new Date(a.quiz.passedAt).toISOString() } : undefined,
  };
}

/** The coordinator message, filled from the application. */
export function coordinatorMessage(template: string, a: Application, nobody: string): string {
  const v: Record<string, string | number> = {
    first: a.first ?? "", last: a.last ?? "", email: a.email ?? "", zip: a.zip ?? "",
    referredBy: a.referredBy || nobody, version: a.agreement?.version ?? "",
    score: a.quiz?.score ?? 0, total: a.quiz?.total ?? 0,
  };
  return template.replace(/\{(\w+)\}/g, (_, k) => String(v[k] ?? ""));
}

/** The link that sends it: a text when a coordinator phone is set, else an email. */
export function coordinatorHref(body: string, phone: string, email: string): string {
  // OLOS: when sign-in exists, POST toOlosPayload(application.get()) here
  // before showing "You're in", and keep this link as the human hello.
  return phone ? `sms:${phone}?&body=${encodeURIComponent(body)}` : `mailto:${email}?body=${encodeURIComponent(body)}`;
}
