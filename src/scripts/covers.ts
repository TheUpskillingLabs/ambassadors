/* Chapter covers (src/components/JoinCover.astro): where scroll-driven
   animation isn't supported, open each cover once as it comes into view
   (join.css does the rest). Reduced motion keeps the still cover. */
export function openCovers(): void {
  if (CSS.supports("view-timeline-name: --a") || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  document.documentElement.dataset.covers = "";
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { threshold: 0.3 });
  document.querySelectorAll(".jp-cover").forEach((c) => io.observe(c));
}
