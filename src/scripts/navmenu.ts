/* The header's menu on narrow screens (join.css, max-width: 1080px): the
   section links sit behind a button whose three bars turn into an X, and drop
   down as a panel under the header. The links are the same ones the wide nav
   shows, so the scroll-spy marks the current section in both.

   The CSS collapses the nav under html[data-menu], which an inline script in
   each page's head sets before the first paint (no layout shift); with
   scripting off, the links stay inline. Closes on a link, the
   button, Escape (focus goes back to the button), a tap outside, or widening
   past the breakpoint. */
const NARROW = "(max-width: 1080px)";

export function initMenu(): void {
  const head = document.querySelector<HTMLElement>("[data-head]");
  const btn = head?.querySelector<HTMLButtonElement>("[data-menu-btn]");
  const panel = btn ? document.getElementById(btn.getAttribute("aria-controls") || "") : null;
  if (!head || !btn || !panel) return;
  const narrow = matchMedia(NARROW);
  let open = false;

  const set = (v: boolean, focusFirst = false) => {
    open = v;
    head.toggleAttribute("data-menu-open", v);
    btn.setAttribute("aria-expanded", String(v));
    btn.setAttribute("aria-label", (v ? btn.dataset.labelClose : btn.dataset.labelOpen) || "");
    panel.inert = narrow.matches && !v;
    if (v && focusFirst) panel.querySelector<HTMLAnchorElement>("a")?.focus({ preventScroll: true });
  };
  const sync = () => (open && !narrow.matches ? set(false) : (panel.inert = narrow.matches && !open));

  btn.addEventListener("click", () => set(!open, true));
  panel.addEventListener("click", (e) => { if (open && (e.target as Element).closest("a")) set(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && open) { set(false); btn.focus(); } });
  document.addEventListener("pointerdown", (e) => { if (open && !head.contains(e.target as Node)) set(false); });
  narrow.addEventListener("change", sync);
  sync();
}
