# Valley rooms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the valley's places worth exploring: a glass panel style, a real project showcase, a writing garden with topics and English translations, an immersive tree-hollow cinema (films and books from douban-data), a livelier island (creek, crops, walking DouDou), and a tree timeline told by the places lula has lived, with a route map and a footprint map.

**Architecture:** Astro static pages stay the single source of content; the Hi-Fi valley panels and the Lo-Fi pages render the same components. New data comes in through build-time scripts that write committed JSON/WebP (douban posters, map paths), so builds never need the network. Valley scene changes stay inside `src/scenes/valley/*` parts.

**Tech Stack:** Astro 7, TypeScript, Three.js r186 + GSAP, Vitest, Playwright, pnpm. New dev dependencies: `d3-geo`, `topojson-client`, `world-atlas`, `us-atlas` (all free, ISC/MIT; Natural Earth and US Census data are public domain).

**Spec:** `docs/superpowers/specs/2026-10-25-valley-rooms-design.md` (read it first; section numbers below refer to it).

## Global Constraints

- Free only. No deploy, no DNS. Push to `origin main` after each task.
- Commit author `lula <luli-lula@users.noreply.github.com>`; no Claude attribution line.
- Never modify `~/Documents/Side-Projects/douban-data` or the old Hugo repo; read only.
- Never publish anything from lula's private Obsidian notes. Candidate lists from them go only into the private morning report.
- Never invent content: missing facts use `<Placeholder note=…>` (visible in dev, hidden in the build).
- Every feature works in Lo-Fi, in both languages, at 375px, and with reduced motion (no movement).
- Icon-first (app-shell rule): an icon where it is clear, with `aria-label` and `title`.
- Verify for real: build, run the e2e suite, and look at a screenshot of each changed view.

## Review Focus

1. A poster or book cover that failed to download must show a text tile (title + stars), never a broken image. Owned by Task 6.
2. The full-screen cinema must trap focus, close on Esc, and return focus to the hollow label; the wall must be usable by keyboard. Owned by Task 6.
3. Wide panels (workshop ~680px) and the full-screen cinema/map at 375px: no horizontal scroll, close button reachable. Owned by Tasks 2, 6, 9.
4. Reduced motion: DouDou does not walk, the creek does not shimmer, the hollow entry is a cut, not an animation. Owned by Tasks 7, 8, 6.
5. English site with Chinese-only data (film titles, comments): the page says so once, the layout does not break on long CJK strings. Owned by Task 6.

---

### Task 1: Glass panels and list rows (spec §4)

**Files:** Modify `src/components/Valley.astro` (style block, list markup); Test `tests/e2e/panels.spec.ts`.

**Interfaces:** Produces CSS classes used later: `.vpanel` (glass), `.vlist` (two-column rows: `time` + `.title`), `.zh-badge` (small "中" badge, `title="Chinese only"`/`"仅中文"` on the zh site the badge reads "EN"), `.vpanel.wide` (desktop width `min(680px, calc(100vw - 24px))`).

- [ ] Write `tests/e2e/panels.spec.ts`:
  - `panel is frosted glass`: computed `backdrop-filter` contains `blur`, background alpha < 0.9 (parse rgba).
  - `rows keep date and title side by side`: open garden on 1280×800; for every `.vlist li`, the `time` box top equals the title box top ±2px.
  - `night panel is dark glass`: set `ailula-night=1`, background luminance < 0.3, text luminance > 0.7.
  - `English list uses a small badge, not the words "Chinese only"`: garden panel text has no "Chinese only"; at least one `.zh-badge`.
  - `contrast`: sample text color vs panel background at 1280 and 375 meets 4.5:1 (compute from computed colors assuming the background alpha over white and over #3d6a3c; take the worse).
- [ ] Run, expect FAIL.
- [ ] Implement: background `rgba(252,249,242,0.78)`, `backdrop-filter: blur(18px) saturate(1.2)`, 1px `rgba(255,255,255,.6)` border, lighter shadow; `html[data-night='true'] .vpanel` dark glass `rgba(28,32,52,0.74)` with light text; sticky header (`h2` row + close) and bottom fade; links dark ink, no underline until hover; accent only on hover and section heads. Replace every panel list with `.vlist`.
- [ ] Run panels + full e2e, screenshot garden panel day/night at 1280 and 375. Commit `feat: frosted glass panels with steady rows`.

### Task 2: Project cards and the workshop showcase (spec §9)

**Files:** Create `src/components/ProjectCard.astro`; Modify `src/content.config.ts` (projects: `facts`), `src/components/Valley.astro` (workshop + greenhouse panels), `src/views/ProjectsIndex.astro`, project titles in `src/content/projects/{celpip12,adhd-focus}/*.md`; Test `tests/e2e/projects.spec.ts`.

**Interfaces:**
- `ProjectCard` props `{ lang: Lang; slug: string; entry: CollectionEntry<'projects'>; fallback: boolean; size?: 'large' | 'normal' | 'compact' }`. Renders one `<a class="pcard" data-category=… href=…>` with cover (`img` 16:10, or a `.pcover` with the first letter on the category colour), `h3` title, tagline (`summary`, 2-line clamp), meta: `.pstatus[data-status]` dot + label, year from `date`.
- Schema: `facts: z.array(z.object({ value: z.string(), label: z.string() })).default([])` (bilingual per file).
- Workshop panel gets class `wide`, lists ALL projects (featured first, `size="large"`), filter chips `button[data-cat="all|plants|learning|tools"]` with `aria-pressed`.

- [ ] Tests: workshop panel shows 9 cards (current non-draft count), Floradex first and large; clicking chip "plants" leaves only `data-category="plants"` cards visible; every card has an image or `.pcover` (no broken images: `naturalWidth > 0`); titles have no " – " long subtitles; at 375 the workshop panel has no horizontal overflow; `/projects/` uses the same `.pcard`.
- [ ] FAIL → implement → PASS. Workshop flight inset uses the wider panel automatically (`setInset` from the panel rect).
- [ ] Screenshot workshop 1280 + 375. Commit `feat: project cards and a workshop showcase`.

### Task 3: Project page framework + native plant care signs case study (spec §9)

**Files:** Modify `src/views/Article.astro` (project header, facts row, icon links), `src/content/projects/plant-care-signs/{zh,en}.md`; Create `src/content/projects/research-workbench/{zh,en}.md` (`draft: true`); assets from `/Users/lu/Documents/WildOnes/Native_Plant_Care_Sign/plant-care-signs/` (read only: copy a card image and a page screenshot, WebP ≤ 200 KB); Test `tests/e2e/projects.spec.ts`.

- [ ] Tests: `/projects/plant-care-signs/` shows a facts row containing "151", h2s appear in the fixed order (为什么做/我做了什么/怎么做的/结果/学到了什么/下一步 or English: Why / What I made / How / Result / What I learned / Next) for those present; external link is an icon button with `aria-label`; `/projects/research-workbench/` is 404.
- [ ] Write the case study only from facts in that repo's README.md, WORKFLOW.md, PLANT_WORKFLOW.md and `node tools/pipeline.js status`; anything not written there becomes a `todo` item. Titles: zh "本土植物养护卡片", en "Native Plant Care Signs".
- [ ] PASS, screenshot, commit `content: native plant care signs case study; project page framework`.

### Task 4: Writing garden (spec §3, §4)

**Files:** Modify `src/content.config.ts` (posts: `topics`, `titleEn`, `translatedFrom`, kind `travel`, `places`), all `src/content/posts/*/zh.md` (add `topics` from the mapping in spec §3; `titleEn` English titles), `src/views/WritingIndex.astro`, Valley garden panel; Create `src/lib/topics.ts`, `src/scenes/valley/hut.ts` (or replace the garden glasshouse in `structures.ts`); Test `tests/e2e/writing.spec.ts`, `tests/unit/topics.test.ts`.

**Interfaces:** `TOPICS = ['product','books','movies','life','projects','tools','travel'] as const`; `topicLabel(t, lang)`. Garden panel and `/writing/` have `button[data-topic]` filters (`aria-pressed`). English lists: translated posts (has `en.md`) first; other posts under `h3` "More in Chinese" showing `titleEn` + `.zh-badge`, linking to the zh page. English garden panel shows only translated posts + a "More in Chinese →" link.

- [ ] Tests: every zh post has 1–2 topics from TOPICS (unit, reads frontmatter); topic filter "books" shows only books posts; English `/writing/` has a "More in Chinese" section and no "Chinese only" text; no growth emoji anywhere; the garden glasshouse is replaced (scene has no transparent mesh at the garden anchor: `__valley.scene` traverse, garden group materials all `transparent === false`).
- [ ] Hut: opaque wood walls, door, a window with a desk visible, warm window glow at night. One line in `gardenIntro`: Virginia Woolf wrote in a small lodge at the end of her garden.
- [ ] PASS, screenshots, commit `feat: writing hut, topics and English list`.

### Task 5: English translations (spec §3)

**Files:** Create `src/content/posts/{009,010,011,013,015,020,021,022,024,025,026}-*/en.md`.

- [ ] Translate with parallel subagents (one per post), each told: keep structure, headings, images and links; front matter copies the zh one with `lang: en`, English `title`, `translatedFrom: zh`; quotes from books with an English original (Justice, A Room of One's Own, etc.) use the original wording only when certain, otherwise translate; no additions.
- [ ] Article shows "Translated from Chinese" under the title when `translatedFrom` is set (test in `writing.spec.ts`).
- [ ] Build passes; spot-read two translations; commit `content: English translations of 11 posts`.

### Task 6: Tree-hollow cinema (spec §2)

**Files:** Create `scripts/sync-douban.mjs`, `src/data/douban/{movies,books,hidden}.json`, `public/posters/{movies,books}/*.webp`, `src/components/CinemaWall.astro`, `src/scripts/cinema.ts`; Modify `src/views/Cinema.astro`, `src/components/Valley.astro` (hollow opens the full-screen cinema instead of a side panel), `src/scenes/valley/createValley.ts` (hollow entry flight); Test `tests/unit/douban.test.ts`, `tests/e2e/cinema.spec.ts`.

**Interfaces:**
- `sync-douban.mjs` writes compact arrays: movies `{ id, t, y, r (0–5, 0 = unrated), d ('YYYY-MM-DD'), c, dir }`, books `{ id, t, y, r, d, c, a }`; only `status === 'done'`, minus `hidden.json` ids; downloads missing covers with `Referer: https://movie.douban.com/` (books: book.douban.com), ≤ 3/s, 160px WebP q70; logs failures, never throws on one item.
- `CinemaWall` props `{ lang: Lang; kind: 'movies' | 'books' }`: stats line, top-10 row (hidden while `topTen` empty), year sections (newest first) of `.tile` buttons (`img` or `.tile-text`), detail `dialog` (title, year, director/author, stars, date, comment, Douban link), filters `all | five | commented`, year jump, search.
- `/cinema/` (and zh) has tabs Movies / Books (`role="tablist"`).

- [ ] Unit: compact rows have the five fields; ratings map `'unrated'→0`; hidden ids are removed.
- [ ] E2E: `/cinema/` shows the stats line with 2753 (or the current count) and year headings in descending order; clicking a tile opens the dialog with a date; filter "five" shows only 5-star tiles; a tile whose image 404s shows `.tile-text` (route a poster to 404 in the test); Books tab shows book tiles; Hi-Fi: selecting the hollow opens `.cinema-overlay` full screen, focus inside, Esc closes and focus returns to the hollow label; reduced motion: overlay appears with no transition; 375: no horizontal scroll.
- [ ] Run the sync once (record counts and failures in the ledger). Collect 20 top-10 candidates (5★, with a comment, newest first) into the ledger for the morning report — not into the site.
- [ ] PASS, screenshots (overlay 1280 + 375), commit `feat: tree-hollow cinema with films and books`.

### Task 7: Creek and crops (spec §10)

**Files:** Modify `src/scenes/valley/island.ts` (creek path, bridge, bank stones, shimmer in `update`), `src/scenes/valley/structures.ts` (garden beds crops by season), `src/scenes/valley/palette.ts` if new colours are needed; Test `tests/e2e/valley-fixes.spec.ts`.

- [ ] Tests: draw calls stay ≤ 120 (existing `drawCalls()`); creek mesh exists and reaches the island edge (expose `__valley.scene` lookup by name `creek`); garden crop groups change with `setSeason` (name `crops-<season>` visible only for the current season); reduced motion: creek material time uniform does not change.
- [ ] Screenshot garden + creek in four seasons. Commit `feat: a creek with a bridge, and crops that follow the seasons`.

### Task 8: DouDou walks and sleeps (spec §1)

**Files:** Modify `src/scenes/valley/structures.ts` (dog rig: legs separate, walk loop path, sniff/sit states, night sleep pose), `src/scenes/valley/createValley.ts` (Part gains `anchors?: Partial<Record<ZoneId, () => THREE.Vector3>>`; labels and `focus('dog')` read the live anchor), Valley dog panel (lists posts tagged/topic DouDou when they exist); Test `tests/e2e/valley-fixes.spec.ts`.

- [ ] Tests: day: dog position changes over 2 s; select dog: it stops (position stable over 1 s) and the camera target is within 2 units of it; night: position stable and pose `sleep` (`__valley.dogState()`); reduced motion: stable.
- [ ] Commit `feat: DouDou walks the path by day and sleeps by the lantern at night`.

### Task 9: Lookout, tree chapters, route map, footprint map (spec §6–8, §11)

**Files:** Modify `src/data/profile.ts` (now text), `src/data/timeline.ts` → replace with `src/data/places.ts` (chapters), Valley tree + lookout panels, `src/views/Home.astro`; Create `scripts/build-map.mjs`, `src/data/map/*.json`, `src/components/RouteMap.astro`, `src/components/FootprintMap.astro`, `src/pages/map.astro`, `src/pages/zh/map.astro`, `src/data/visited.ts`; Modify post 014 (`kind: travel`, `places`); Test `tests/e2e/timeline.spec.ts`, `tests/e2e/map.spec.ts`, update `tests/unit/timeline-data.test.ts`.

**Interfaces:** `interface Chapter { id: string; city: Record<Lang, string>; region: 'cn' | 'us'; coords?: [lon: number, lat: number]; years: string; start: number; work: Record<Lang, string>; life: Record<Lang, string> }`, `chapters: Chapter[]` newest first; ring years still come from chapter `start`. Known cities only: Guangzhou (SYSU), Beijing (Esri Beijing R&D), Albany County NY (Master Gardener); every other city is a Placeholder and has no coords. Roots chapter: Henan, city Placeholder.

- [ ] Tests: lookout panel shows the §11 now text and a "projects" link that opens the workshop panel (Hi-Fi) / links to `/projects/` (Lo-Fi); no mention of her current company anywhere in the build; tree panel has work and life columns with two toggles (`aria-pressed`), newest chapter first, last chapter is the roots; route map draws one dot per chapter with coords and clicking a dot scrolls its chapter into view; `/map/` shows lived route + visited points, Xinjiang point opens a card linking to post 014; views World / China / US switch.
- [ ] `build-map.mjs` writes projected SVG path strings for three fixed views (world: Equal Earth; China: Albers centred 105°E; US: Albers USA) from `world-atlas/countries-50m.json` and `us-atlas/states-10m.json`.
- [ ] Commit per part: `feat: lookout now and a way to the projects`, `feat: tree chapters by places lived`, `feat: route map and footprint map`.

### Task 10: Morning report

- [ ] Private Chinese HTML artifact, written in the scratchpad (never committed: it lists candidates from private journals). Contents: what changed, with small screenshots; what is not done; 20 top-10 film candidates; travel place candidates from the private journals; one place to start organizing materials today.
- [ ] Append `NIGHT DONE` to the ledger.
