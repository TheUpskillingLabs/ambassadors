/* The personal, dated ask: the message an ambassador sends from their own
   phone ("say {me} sent you"). Shared by the Conversation step's list of
   three (AskList.astro) and the one name asked for on "You're in" (/apply/).
   Nothing is sent by the site. */
import { asks } from "./store";
import { nextSession, formatSession } from "./schedule";

/** Fill the invite template with the next session (or the undated one). */
export function askMessage(tpl: string, tplOpen: string, them: string, me: string): string {
  const s = nextSession();
  const f = s && formatSession(s);
  const t = s ? tpl : tplOpen;
  return t.replaceAll("{them}", them || "…").replaceAll("{me}", me || "…")
    .replace("{what}", s?.type ?? "").replace("{day}", f?.day ?? "").replace("{time}", f?.time ?? "")
    .replace("{place}", s ? s.location.split(",")[0] : "");
}

/** Opens the phone's messaging app with the text ready to send. */
export function askHref(text: string): string {
  return `sms:?&body=${encodeURIComponent(text)}`;
}

/** Put a name at the front of the ask list, marked sent; keeps the others. */
export function rememberAsk(name: string): void {
  const rest = asks.get().filter((a) => a.name !== name);
  asks.set([{ name, sent: Date.now() }, ...rest]);
}
