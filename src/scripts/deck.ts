/* Deck controller for /present.
   Input: arrow keys / space / PageUp-PageDown / Home-End, click (left third
   goes back), swipe. F toggles full screen. Windows on the same device stay
   in sync over a BroadcastChannel, so ?notes on a laptop drives the
   audience window. */

import { u } from "../lib/url";

const W = 1920;
const H = 1080;

export function initDeck(): void {
  const q = new URLSearchParams(location.search);
  const short = q.has("short");
  const notes = q.has("notes");
  const practice = q.has("practice");
  const body = document.body;
  body.classList.toggle("mode-notes", notes);
  body.classList.toggle("mode-practice", practice);

  const shortSet: number[] = JSON.parse(body.dataset.shortSlides || "[]");
  const all = Array.from(document.querySelectorAll<HTMLElement>("[data-viewport=main] .slide"));
  all.forEach((s) => {
    if (short && !shortSet.includes(Number(s.dataset.n))) s.remove();
  });
  const slides = all.filter((s) => s.isConnected);

  // Notes view: a second, non-interactive copy of the deck for "next".
  const nextScaler = document.querySelector<HTMLElement>("[data-viewport=next] .scaler")!;
  if (notes) {
    const copy = document.querySelector<HTMLElement>("[data-viewport=main] .slides")!.cloneNode(true) as HTMLElement;
    copy.setAttribute("aria-hidden", "true");
    copy.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
    nextScaler.appendChild(copy);
    document.querySelector<HTMLElement>("[data-notes-pane]")!.hidden = false;
  }
  const nextSlides = Array.from(nextScaler.querySelectorAll<HTMLElement>(".slide"));

  if (practice) document.querySelector<HTMLElement>("[data-practice-cue]")!.hidden = false;

  // ── scaling: fit 1920×1080 into each viewport, letterboxed ──
  const fit = () => {
    document.querySelectorAll<HTMLElement>("[data-viewport]").forEach((vp) => {
      const scaler = vp.querySelector<HTMLElement>(".scaler")!;
      const r = vp.getBoundingClientRect();
      const k = Math.min(r.width / W, r.height / H);
      scaler.style.transform = `translate(${(r.width - W * k) / 2}px, ${(r.height - H * k) / 2}px) scale(${k})`;
    });
  };
  new ResizeObserver(fit).observe(document.querySelector(".deck-shell")!);
  window.addEventListener("resize", fit);
  fit();

  // ── navigation ──
  let i = 0;
  const fromHash = Number(location.hash.slice(1));
  if (fromHash) {
    const at = slides.findIndex((s) => Number(s.dataset.n) === fromHash);
    if (at >= 0) i = at;
  }
  const channel = "BroadcastChannel" in window ? new BroadcastChannel("ag-deck") : null;

  function show(n: number, broadcast = true): void {
    i = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach((s, k) => {
      s.classList.toggle("current", k === i);
      s.setAttribute("aria-hidden", String(k !== i));
    });
    const cur = slides[i];
    nextSlides.forEach((s) => s.classList.toggle("current", s.dataset.n === slides[i + 1]?.dataset.n));
    const empty = document.querySelector<HTMLElement>("[data-next-empty]");
    if (empty) empty.hidden = Boolean(slides[i + 1]);
    document.querySelectorAll<HTMLElement>("[data-cue-text]").forEach((el) => (el.textContent = cur.dataset.cue ?? ""));
    document.querySelectorAll<HTMLElement>("[data-notes-text]").forEach((el) => (el.textContent = cur.dataset.notes ?? ""));
    document.querySelectorAll<HTMLElement>("[data-counter]").forEach((el) => (el.textContent = `${i + 1} / ${slides.length}`));
    history.replaceState(null, "", `${location.pathname}${location.search}#${cur.dataset.n}`);
    if (broadcast) channel?.postMessage({ type: "go", n: Number(cur.dataset.n) });
  }
  const next = () => show(i + 1);
  const prev = () => show(i - 1);

  channel?.addEventListener("message", (e: MessageEvent) => {
    if (e.data?.type !== "go") return;
    const at = slides.findIndex((s) => Number(s.dataset.n) === e.data.n);
    // A ?short window ignores slides it doesn't have.
    if (at >= 0) show(at, false);
  });

  // ── controls ──
  const controls = document.querySelector<HTMLElement>("[data-controls]")!;
  let idle: number | undefined;
  const wake = () => {
    body.classList.add("controls-on");
    clearTimeout(idle);
    idle = window.setTimeout(() => body.classList.remove("controls-on"), 2500);
  };

  const fsBtn = document.querySelector<HTMLButtonElement>("[data-fullscreen]")!;
  const canFs = Boolean(document.fullscreenEnabled);
  if (!canFs) fsBtn.hidden = true;
  const toggleFs = () => {
    if (!canFs) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else document.documentElement.requestFullscreen().catch(() => {});
  };
  fsBtn.addEventListener("click", toggleFs);

  const cueBtn = document.querySelector<HTMLButtonElement>("[data-toggle-cues]")!;
  const sheet = document.querySelector<HTMLElement>("[data-cue-sheet]")!;
  cueBtn.addEventListener("click", () => {
    sheet.hidden = !sheet.hidden;
    cueBtn.setAttribute("aria-pressed", String(!sheet.hidden));
  });

  controls.addEventListener("click", (e) => e.stopPropagation());
  controls.addEventListener("pointerdown", (e) => e.stopPropagation());
  document.querySelector("[data-prev]")?.addEventListener("click", prev);
  document.querySelector("[data-next]")?.addEventListener("click", next);

  document.querySelector<HTMLAnchorElement>("[data-open-audience]")?.addEventListener("click", (e) => {
    e.preventDefault();
    window.open(u(`/present/${short ? "?short" : ""}#${slides[i].dataset.n}`), "ag-audience");
  });

  // Timer (notes view): click to reset.
  const timer = document.querySelector<HTMLButtonElement>("[data-timer]");
  if (timer && notes) {
    let start = Date.now();
    timer.addEventListener("click", () => (start = Date.now()));
    setInterval(() => {
      const s = Math.floor((Date.now() - start) / 1000);
      timer.textContent = `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
    }, 500);
  }

  // ── input ──
  document.addEventListener("keydown", (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const k = e.key;
    if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(k)) {
      if (k === "Enter" && (e.target as HTMLElement).closest("button, a")) return;
      e.preventDefault(); next();
    } else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(k)) {
      e.preventDefault(); prev();
    } else if (k === "Home") { e.preventDefault(); show(0); }
    else if (k === "End") { e.preventDefault(); show(slides.length - 1); }
    else if (k === "f" || k === "F") toggleFs();
    wake();
  });

  const stage = document.querySelector<HTMLElement>("[data-viewport=main]")!;
  let sx = 0, sy = 0, st = 0, swiped = false;
  stage.addEventListener("pointerdown", (e) => { sx = e.clientX; sy = e.clientY; st = Date.now(); swiped = false; });
  stage.addEventListener("pointerup", (e) => {
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) && Date.now() - st < 800) {
      swiped = true;
      if (dx < 0) next(); else prev();
    }
  });
  stage.addEventListener("click", (e) => {
    wake();
    if (swiped) return;
    const r = stage.getBoundingClientRect();
    if (e.clientX - r.left < r.width / 3) prev(); else next();
  });
  document.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") wake(); });

  show(i, false);
  wake();
}
