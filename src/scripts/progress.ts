/* Read progress, on every page.
   - An <article data-page-id> is marked read when its end sentinel
     ([data-read-sentinel]) scrolls into view, or when "Done" is tapped.
   - [data-read-id] elements get .is-read when that page is read (lists).
   - [data-progress-ids] counters render "3 of 6 read" and fill their pips. */
import { progress } from "../lib/store";

function paint(): void {
  const p = progress.all();

  document.querySelectorAll<HTMLElement>("[data-read-id]").forEach((el) => {
    el.classList.toggle("is-read", Boolean(p[el.dataset.readId!]));
  });

  document.querySelectorAll<HTMLElement>("[data-progress-ids]").forEach((el) => {
    const ids: string[] = JSON.parse(el.dataset.progressIds || "[]");
    const n = ids.filter((id) => p[id]).length;
    const label = el.querySelector<HTMLElement>("[data-progress-label]");
    if (label) label.textContent = `${n} ${label.dataset.template ?? ""}`.trim();
    el.querySelectorAll<HTMLElement>(".pip").forEach((pip, i) => {
      pip.classList.toggle("on", Boolean(p[ids[i]]));
    });
    el.dataset.complete = String(n === ids.length);
  });

  document.querySelectorAll<HTMLButtonElement>("[data-done]").forEach((btn) => {
    const read = Boolean(p[btn.dataset.done!]);
    btn.classList.toggle("is-read", read);
    const label = btn.querySelector<HTMLElement>("[data-done-label]");
    if (label) label.textContent = read ? btn.dataset.readText! : btn.dataset.doneText!;
  });
}

function init(): void {
  const article = document.querySelector<HTMLElement>("[data-page-id]");
  const id = article?.dataset.pageId;
  if (id) {
    const sentinel = article!.querySelector("[data-read-sentinel]");
    if (sentinel && "IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          progress.markRead(id);
          io.disconnect();
        }
      });
      // Wait one frame so a short page isn't marked read before the reader
      // has seen it load; a page that fits the screen counts once scrolled or
      // after a brief look.
      setTimeout(() => io.observe(sentinel), 1500);
    }
  }

  document.querySelectorAll<HTMLButtonElement>("[data-done]").forEach((btn) => {
    btn.addEventListener("click", () => {
      progress.markRead(btn.dataset.done!);
      const next = btn.dataset.nextHref;
      if (next) window.location.href = next;
    });
  });

  document.addEventListener("ag:progress", paint);
  window.addEventListener("storage", paint);
  paint();
}

init();
