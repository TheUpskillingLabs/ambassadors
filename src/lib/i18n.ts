/* UI strings live in content/site/ui.<locale>.json. Components call t();
   nothing user-facing is hard-coded in a component. */
import en from "../../content/site/ui.en.json";

type Dict = typeof en;
const dicts: Record<string, Dict> = { en };
export const locale = "en";

export function t(path: string, vars: Record<string, string | number> = {}): string {
  const parts = path.split(".");
  let cur: unknown = dicts[locale];
  for (const p of parts) cur = (cur as Record<string, unknown> | undefined)?.[p];
  if (typeof cur !== "string") throw new Error(`Missing UI string: ${path}`);
  return cur.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

/** The whole dictionary, for client scripts that need strings at runtime. */
export const ui = dicts[locale];
