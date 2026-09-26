# Award-winning references → improvements for The Upskilling Labs Ambassador site

Researched 2026-09-26. Every award below is verified against the awarding body's own page or a named third-party source (linked). Where I could not verify an award I say "no award claimed". Implementation observations such as "uses `position:sticky; top:24px`" come from reading each site's live HTML/CSS on the research date, not from guesses.

Current state, read from the repo (not modified):
- `/join/` header (`src/styles/join.css`, `.jp-head`): a solid ink sticky bar, 76px high, `max-width:1180px`. On phones (≤680px) the three anchor links are simply hidden, so phone visitors have no way to jump between sections, and nothing marks the current section.
- Guide (`src/styles/guide.css`): `.wrap` is capped at `--prose` (760px) plus padding. The app bar is capped at `--maxw` (1200px). `--pad` is 24px, stepping to 40px at a breakpoint rather than scaling smoothly. The app bar shows no progress.

---

## 1. Reference sites

| # | Site | What it is / why comparable | Recognition (verified) |
|---|------|-----------------------------|------------------------|
| 1 | **Readymag Ambassadors Program**: [readymag.com/readymag/ambassadors](https://readymag.com/readymag/ambassadors/) | An ambassador recruitment page. It is the closest match to `/join/` that I found. | Awwwards Honorable Mention, 25 Feb 2025 ([awwwards](https://www.awwwards.com/sites/readymag-ambassadors-program)) |
| 2 | **Why Zero (Zero University)**: [why.zero.university](https://why.zero.university/) | A cinematic single-page recruitment story for an education program, built with 3D and scroll storytelling (GSAP, Three.js, Blender). | Awwwards Site of the Day + Developer Award, 7 Sep 2026 ([awwwards](https://www.awwwards.com/sites/why-zero)) |
| 3 | **Obama Foundation**: [obama.org](https://www.obama.org/) and [Leaders program page](https://www.obama.org/programs/leaders/) | A civic nonprofit that recruits people into leadership programs. | 2025 Webby Award, Charitable Organizations/Non-Profit site ([Webby](https://winners.webbyawards.com/2025/websites-and-mobile-sites/general-desktop-mobile-sites/charitable-organizationsnon-profit/345121/obama-foundation); [Work & Co](https://www.work.co/news/work-co-webby-awards-2025/); [Numiko](https://numiko.com/insights/the-best-non-profit-websites-2026)) |
| 4 | **charity: water**: [charitywater.org](https://www.charitywater.org/) | A nonprofit that pairs proof with a single strong CTA. | Awwwards SOTD (2010) ([awwwards](https://www.awwwards.com/sites/charity-water)). Its current design is widely praised but has no recent award. |
| 5 | **Paul & Daisy Soros Fellowships for New Americans**: [pdsoros.org](https://pdsoros.org/) | A fellowship recruitment site, structurally very close to our join and eligibility needs. | Listed as a 2025 Webby nominee ([TheWrap nominee list](https://www.thewrap.com/2025-webby-awards-nominations-full-list/)) |
| 6 | **GitHub Stars**: [stars.github.com](https://stars.github.com/) | GitHub's community ambassador program. | No award claimed. It is a direct program comparable. |
| 7 | **Stripe Sessions**: [stripesessions.com](https://stripesessions.com/) | An event site with a registration CTA. | Awwwards HM 2023 and 2024 ([2024](https://www.awwwards.com/sites/stripe-sessions-2024), [2023](https://www.awwwards.com/sites/stripe-sessions-2023)) |
| 8 | **Vercel Ship**: [vercel.com/ship](https://vercel.com/ship) | An event and community site with a dark cinematic look. | Awwwards HM Mar 2024 and May 2025 ([2024](https://www.awwwards.com/sites/vercel-ship), [2025](https://www.awwwards.com/sites/vercel-ship-2025)) |
| 9 | **Readymag for educators**: [readymag.com/teachers](https://readymag.com/teachers) | An education program page. | Awwwards HM (Culture & Education) ([awwwards](https://www.awwwards.com/sites/readymag-for-educators)) |
| 10 | **Linear**: [linear.app](https://linear.app/) | The reference for nav state handling and restrained dark UI. | No award claimed. It is a widely cited design reference. |
| 11 | **Apple**: [apple.com](https://www.apple.com/) | The origin of the blurred global nav and the sticky product "local nav" with a Buy CTA. | No award claimed for this analysis. |
| 12 | **Duolingo / Khan Academy**: [duolingo.com](https://www.duolingo.com/), [khanacademy.org](https://www.khanacademy.org/) | The canonical patterns for a learning path, progress display and a celebratory "done" state. | Duolingo was a 2025 Webby nominee ([TheWrap](https://www.thewrap.com/2025-webby-awards-nominations-full-list/)). No award claimed for Khan Academy. |
| 13 | **Mozilla**: [mozilla.org](https://www.mozilla.org/) | A mission-driven organisation with an accessibility-first nav. | No award claimed. |

Other nonprofit and education winners worth browsing: [Big Thought (Awwwards nominee, nonprofit)](https://www.awwwards.com/sites/big-thought-nonprofit), [Larry Ellison Foundation (Awwwards HM, "Unusual Navigation", "Storytelling")](https://www.awwwards.com/sites/the-larry-ellison-foundation), the [Awwwards Culture & Education list](https://www.awwwards.com/websites/culture-education/), and the [Awwwards nonprofit collection](https://www.awwwards.com/awwwards/collections/nonprofit-websites/).

---

## 2. What each site does

### Navigation
- **Linear.** The header is transparent over the hero and becomes solid once the page scrolls. The CSS shows `[data-transparent-header] .header{--header-bg:transparent;--header-border:transparent}`, and `html[data-scrolled] … {--header-border:#ffffff14}` switches it to a background plus a hairline border (8% white). All of this is driven by one attribute and CSS custom properties, with no per-frame JavaScript styling. The nav is short: Product, Resources, Pricing, then Log in and a single primary "Sign up".
- **Apple.** The global nav uses `backdrop-filter: saturate(180%) blur(20px)` and is 44–48px high. Product pages add a sticky secondary "local nav": the product name on the left and one primary Buy button on the right. That is the model for a recruitment page: once you are past the hero, the bar should say what this page is and offer one action. Apple also turns the blur off with `backdrop-filter:none` in several contexts, which gives a solid fallback.
- **Stripe Sessions.** The nav floats as an inset bar (`position:sticky; top:24px`, `top:16px` below 768px) instead of running edge to edge. It has a `notSticky` variant that becomes `position:relative` on small screens, and it disables its transitions under `prefers-reduced-motion`. It uses 30 reduced-motion rules across the site.
- **Obama Foundation.** It uses `html{scroll-padding-top:var(--nav-height)}`, so anchor jumps never land under the sticky header, which is a small detail that is often missed. It has five top-level sections and a persistent Donate button, plus a skip link.
- **Soros Fellowship.** Recruitment is the top-level nav item "Become a Fellow", with sub-items Why Become a Fellow, Eligibility Requirements, Application Process and Application Resources. A separate "Apply" link sits at the far right. It also has a skip link.
- **GitHub Stars.** The nav has only four or five items (Program, Stars, Nominate, Alumni, FAQ) and a skip link, which fits a tiny program site.
- **Mozilla.** Its menu marks the current page with `aria-current`.
- **charity: water.** One CTA dominates ("Give now, matched 2x"), and in-page "GIVE TODAY" buttons smooth-scroll to the donate block.

### Full-width layout
- **GitHub Stars** defines one fluid page gutter token, `--spacing-page-x: clamp(1.5rem, 4vw, 4rem)`, and fluid display type (`clamp(3rem,7vw,7.5rem)`). Its content max-widths are 75rem and 105rem, and text measure is limited separately (a `65ch` rule is present).
- **Stripe Sessions** uses a named column grid with a variable column count (`repeat(var(--mobileGridColumns),1fr)` and an intermediate variant). Children use `grid-template-columns:subgrid` (about 20 uses), so nested cards align to the page columns. It sets `--pagePaddingInline:32px`, and its type scale is fully `clamp()`-based: eight steps from `clamp(18px,…,24px)` to `clamp(64px,…,100px)`.
- **Vercel Ship** lets backgrounds and media bleed full width while prose uses explicit measures: `max-w-[58ch]`, `60ch`, `62ch` and `max-w-prose` (65ch). It uses container-query type sizes (`clamp(1.75rem,8cqw,5.5rem)`), and 8 `scroll-margin` rules keep anchor targets clear of the sticky bar.
- **Obama Foundation** uses a split-screen section: a fixed left panel and a scrolling right panel ([Numiko](https://numiko.com/insights/the-best-non-profit-websites-2026)). This lets a full-width section still read comfortably.

### Other patterns
- **Proof next to the ask.** charity: water puts three large numbers (projects, countries, people) right before its "100%" promise and third-party badges. The Obama Leaders page pairs one participant quote with three outcome percentages, states eligibility (ages 24–45, regions) and a timeline ("applications open in November"), repeats "How to apply" three times, and offers "email me when applications open".
- **Scroll storytelling.** Why Zero (SOTD 2026) is a single page with 3D, gestures and sound. Readymag Ambassadors relies on scroll-triggered colour animation. Farm Africa (a 2025 Webby nominee per [Numiko](https://numiko.com/insights/the-best-non-profit-websites-2026)) uses a scroll-driven zoom into one word, "solution", to focus attention.
- **Learning paths.** Duolingo and Khan Academy always show where you are in the path, how much remains, and what comes next. Completing a step gets a distinct celebratory state and then sends you straight to the next step.

---

## 3. Recommendations

### (a) Nav bar

**`/join/` (dark, cinematic)**
1. **State machine, with no scroll listener doing styling.** Put a 1px sentinel at the top of the hero and an `IntersectionObserver` that toggles `html[data-scrolled]`, following Linear. Over the hero, the header background is transparent, there is no border, and the logo is full size. Once scrolled, the background becomes `color-mix(in srgb, var(--ink) 82%, transparent)` with `backdrop-filter: saturate(180%) blur(16px)` (following Apple), a 1px `var(--rule)` bottom border, and height shrinks from 76 to 60px. Fall back to solid ink when `@supports not (backdrop-filter: blur(1px))` or under `prefers-reduced-transparency`.
2. **Layout.** Left: logo, divider, "Ambassadors". Centre on desktop: three anchor text links. Right: the teal "Become an ambassador" button. Make the bar full width, with its inner edges on `--gutter` rather than 1180px.
3. **Active section.** A second `IntersectionObserver` on `#you`, `#path` and `#mentor` sets `aria-current="location"` on the matching link. Mark it with a 2px teal underline and full-white text, never a filled chip, so it doesn't read as a button or a pill.
4. **CTA handling.** When `#join` is in view, fade the header CTA to `visibility:hidden`, because the big CTA is already on screen. This follows the Apple local-nav logic of keeping one primary action visible.
5. **Mobile (≤680px).** Links are currently hidden. Keep logo plus a short CTA in a 56px bar. Add a thin second row of the three anchor links as plain underlined text (not chips) with `overflow-x:auto`. Alternatively, hide the bar on scroll-down and reveal it on scroll-up, disabled under reduced motion. Don't use a hamburger: three links don't justify one.
6. **Anchors.** Add `html{scroll-padding-top:var(--nav-h)}`, as Obama does. Respect reduced motion for smooth scroll; the page already does.
7. **Accessibility.** Keep the existing skip link. Use `<nav aria-label>`, make every hit target at least 44px, and give focus rings 3:1 contrast on both the transparent and solid states.

**Guide (light, 5 steps)**
1. **Full-bleed ink app bar**, with content inside `--gutter`. Left: logo, divider, "AMBASSADOR GUIDE". Right: "Present" as a text link with an icon, not a button.
2. **Progress in the bar.** Add a centred "Step 2 of 5 · The Labs" label (desktop) and a 3px teal progress line along the bar's bottom edge. The line is filled from `store.ts` completion data, with `role="progressbar"` and `aria-valuenow`/`aria-valuemax`. This follows the Duolingo and Khan Academy "always know where you are" pattern.
3. **Steps menu.** A `<button aria-expanded>` labelled "Steps" opens a sheet (mobile) or popover (desktop) listing the 5 steps. Each step shows done/current/todo (check, dot, ring), the current step has `aria-current="step"`, and the pin appears as the finish line. Esc closes it, focus is trapped while open, and focus returns to the button on close.
4. **Wide screens (≥1100px).** Replace the popover with a sticky left step rail, following Khan Academy's unit sidebar. This is what makes full width useful in the guide without stretching the prose.

### (b) Full-width layout system

```css
:root{
  --gutter: clamp(16px, 4vw, 64px);          /* GitHub Stars-style fluid gutter; 16px phone gutter */
  --measure: 68ch;                            /* prose cap, 65–75ch band */
  --measure-lede: 34ch;                       /* big lede / h2 blocks */
  --wide: 1440px;                             /* cap for card grids on ultra-wide only */
  --nav-h: 64px;
  --section-y: clamp(64px, 10vw, 160px);
}
.page{ display:grid;
  grid-template-columns:
    [full-start] var(--gutter)
    [wide-start] minmax(0,1fr)
    [wide-end] var(--gutter) [full-end]; }
.page > *{ grid-column: wide; }
.page > .bleed{ grid-column: full; }         /* hero, image panels, video, stats band */
.prose{ max-inline-size: var(--measure); }    /* left-aligned inside wide, not centred */
.cols{ display:grid; grid-template-columns: repeat(12, minmax(0,1fr)); gap: clamp(16px,2vw,32px); }
.cols > .cols{ grid-template-columns: subgrid; } /* Stripe Sessions */
@media (min-width:1600px){ .page{ grid-template-columns:[full-start] 1fr [wide-start] min(var(--wide),100% - 2*var(--gutter)) [wide-end] 1fr [full-end]; } }
```

- **Edge to edge on `/join/`:** the hero (wordmark and pin), the mission image panels, the ripple/orbit video, the launch-goal stats band, and the final join CTA band. Also the header and footer backgrounds.
- **Inside `wide` on the 12-column grid:** "Why join" (text in columns 1–6, media in 7–12), about the org, how it works, and the footer columns. Align text blocks to the left gutter on desktop rather than centring them at 1180px.
- **Guide:** `[rail 260px] [content minmax(0,1fr)]` at ≥1100px. Content prose stays at `--measure`, while cards, the practice deck and story cards may use the full content column. The app bar and footer go full bleed.
- Replace the fixed `--pad` 24/40px step with `--gutter`. Replace hard-coded `max-width:1180px` and the inline `style="max-width:900px"` values with `--measure`/`--measure-lede`.

### (c) Top improvements ranked by impact ÷ effort

| Rank | Improvement | Impact | Effort | Reference |
|---|---|---|---|---|
| 1 | Nav state machine on `/join/` (transparent → blurred solid, active section, `scroll-padding-top`, CTA hides at `#join`) | High | Low | Linear, Apple, Obama Foundation |
| 2 | Fluid full-width grid tokens (`--gutter` clamp, `--measure` 68ch, full/wide lines, bleed sections) | High | Med | GitHub Stars, Stripe Sessions, Vercel Ship |
| 3 | Guide progress in the app bar plus a Steps menu with done/current/todo | High | Med | Duolingo, Khan Academy |
| 4 | "What you'll commit to": time per month, who can join, what happens after you click. Stated plainly near the CTA, with a "what happens next" line | High | Low | Obama Leaders (eligibility and timeline), Soros (Eligibility and Application Process) |
| 5 | Pair the launch-goal stats with one ambassador quote and a named face; proof directly before the join CTA | High | Low–Med (content) | charity: water, Obama Leaders |
| 6 | Repeat the join CTA at decision points (after Why join, after How it works, final). Same label and style every time; only "Join The Labs" is red | Med–High | Low | Obama Leaders ("How to apply" ×3), charity: water |
| 7 | Short FAQ (5–6 questions) on `/join/` using `<details>` | Med–High | Low | GitHub Stars (FAQ in nav), Soros (Application Resources) |
| 8 | "How it works" as a sticky split: pin state fixed on the left (button → pin), steps scroll on the right. Stacks on mobile; no motion under reduced motion | Med–High | Med | Obama Foundation split-screen |
| 9 | Unified `clamp()` type scale, about 8 tokens, replacing ad-hoc clamps | Med | Low | Stripe Sessions |
| 10 | Scroll-scrubbed pin frames (48 frames tied to `animation-timeline: view()` or IO progress) in "The pin" section. Poster frame under reduced motion; preload frames lazily | Med | Med | Why Zero (SOTD 2026), Apple product pages |
| 11 | Guide "Done" becomes a completion moment: a brief check animation, then a "Next: Step 3" card, with the pin revealed at step 5 | Med | Low | Duolingo |
| 12 | Cross-document View Transitions between guide steps (`@view-transition{navigation:auto}`), off under reduced motion | Low–Med | Low | Vercel Ship / Next-era sites; progressive enhancement |

### Guardrails
- Keep to the brand rules throughout: one 14px radius, no pills (active states are underlines, not chips), and red only on "Join The Labs".
- Nothing that isn't a button looks like one. "Present" and the anchor links stay text links.
- Every motion item has a `prefers-reduced-motion` path. The blurred header has a solid fallback.
- Everything above is static-friendly: `IntersectionObserver` plus CSS, no backend. Progress reads the existing `store.ts` localStorage.
