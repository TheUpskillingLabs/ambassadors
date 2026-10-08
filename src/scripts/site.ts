/* What every public page's header does (src/layouts/Site.astro): compacts
   once you scroll past the top sentinel, opens the menu on narrow screens,
   and marks the section in view in the page's own row of links. Pages add
   their own behaviour (hiding the button while their own is on screen) in
   their own scripts. */
import { initMenu } from "./navmenu";
import { initSmooth } from "./smooth";

export function initSite(): void {
  const root = document.documentElement;
  const sentinel = document.querySelector("[data-top-sentinel]");
  if (sentinel) new IntersectionObserver(([e]) => { root.dataset.scrolled = String(!e.isIntersecting); }).observe(sentinel);
  else root.dataset.scrolled = "true";
  initMenu();
  initSmooth();

  // The section in view is marked in the page's row: the last section whose top has passed a line a third
  // of the way down the screen. A link may stand for several sections (data-spy, space-separated).
  const local = document.querySelector<HTMLElement>("[data-local]");
  if (!local) return;
  const links = [...local.querySelectorAll<HTMLAnchorElement>("[data-spy]")];
  const order = links.flatMap((a) => a.dataset.spy!.split(" ")).map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
  if (!order.length) return;
  let queued = false;
  const spy = () => {
    queued = false;
    const line = innerHeight * 0.35;
    const current = order.filter((el) => el.getBoundingClientRect().top <= line).pop()?.id ?? "";
    let on: HTMLAnchorElement | null = null;
    links.forEach((a) => { const hit = a.dataset.spy!.split(" ").includes(current); if (hit) { on = a; a.setAttribute("aria-current", "true"); } else a.removeAttribute("aria-current"); });
    // Keep the marked link in view when the row scrolls sideways.
    if (on && local.scrollWidth > local.clientWidth) {
      const r = (on as HTMLAnchorElement).getBoundingClientRect(), lr = local.getBoundingClientRect();
      if (r.left < lr.left || r.right > lr.right) local.scrollTo({ left: local.scrollLeft + r.left - lr.left - 16, behavior: "smooth" });
    }
  };
  addEventListener("scroll", () => { if (!queued) { queued = true; requestAnimationFrame(spy); } }, { passive: true });
  spy();
}
