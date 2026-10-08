/* Smooth scrolling with Lenis, on every page that uses the site's layouts.
   Lenis still scrolls the window itself, so the header's sentinel, the
   scroll-spy and the CSS scroll timelines all keep working as before. Anchor
   links glide too, stopping clear of the fixed header (the page's own
   scroll-padding-top). Nested scrollers (the section row, menus, dialogs)
   keep their native scrolling, touch scrolling stays native, and anyone who
   asks for reduced motion gets plain scrolling: Lenis doesn't start. */
import Lenis from "lenis";
import "lenis/dist/lenis.css";

export function initSmooth(): Lenis | null {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  const pad = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0;
  return new Lenis({
    autoRaf: true,
    lerp: 0.1,
    anchors: { offset: -pad },
    allowNestedScroll: true,
    stopInertiaOnNavigate: true,
  });
}
