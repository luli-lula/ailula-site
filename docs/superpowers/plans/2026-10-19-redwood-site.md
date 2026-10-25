# ailula.top Redwood Site — Plan 1 (Realism Test + Skeleton) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Two things. First, a photographic Three.js "climb the redwood" realism test (milestone 1) that lula reviews before anything is built on it. Second, the Astro skeleton (milestone 2): bilingual routing, the Hi-Fi/Lo-Fi switch, all Lo-Fi pages, the old posts migrated, and old-URL redirects.

**Architecture:** Astro static site with content collections (Markdown per language). Hi-Fi scenes are client-only islands written in vanilla Three.js and loaded only in Hi-Fi mode. Lo-Fi is plain server-rendered HTML for the same content. Pure logic (timeline mapping, ring geometry, mode detection, i18n fallback, redirects) lives in `src/lib/` and is unit tested.

**Tech Stack:** Astro 5, TypeScript, Three.js (+ `three/examples/jsm` postprocessing), GSAP ScrollTrigger + Lenis, Vitest, Playwright.

**Spec:** `docs/superpowers/specs/2026-10-19-redwood-site-design.md`

**Later plans (not this one):** Plan 2 builds the full Hi-Fi home on the approved scene (milestone 3). Plan 3 is the forest-floor writing page (milestone 4). Plan 4 is the tree hollow for movies and books (milestone 5). Plan 5 covers project pages, content fill and launch (milestones 6–7). Each one is written after lula reviews the previous one.

**Execution method (Claude's call, lula can change it):** Native. Tonight runs unattended, the tasks are sequential, and one fresh whole-branch review at the end is enough for a skeleton plus a throwaway-able spike.

## Global Constraints

- Repo root: `/Users/lu/Documents/Side-Projects/ailula-site`. `git init` here. Never push, never deploy, never touch `~/Documents/Side-Projects/luli-lula.github.io` or `~/Documents/Side-Projects/douban-data` (read-only sources).
- Default language English at `/`, Chinese at `/zh/`.
- Realism: photographic. Real bark PBR textures, real light and fog, no painterly or cartoon look.
- Assets: design assets (textures, models, HDRIs, fonts) must be CC0 or licensed for commercial use. Record each one in `ASSETS.md` (name, source URL, license). Poly Haven is the default source.
- Never invent content. Missing facts render as a visible placeholder `待补充 / TODO` and get listed in `CONTENT-TODO.md`.
- Google Analytics ID: `G-WMC06JHFDG` (included in the base layout, both modes).
- Timeline: 0 m = 2017, 115 m = now (2026). Big change years: 2024, 2025.
- Slogan: zh `耐心地，长成一棵大树。` / en `Growing slowly, like a redwood.`
- Every page offers a Hi-Fi/Lo-Fi toggle and a 中/EN toggle.

## Review Focus

1. A post that exists only in Chinese, opened on the English site → renders the Chinese original with an "Chinese only" label, never a 404. (Test in Task 5.)
2. An old URL whose slug is Chinese and percent-encoded (e.g. `/zh/posts/029-%E5%A5%BD.../`) → redirects to the right new page. (Test in Task 7.)
3. No WebGL, or `prefers-reduced-motion: reduce` → the page lands in Lo-Fi with a "switched you to Lo-Fi — try Hi-Fi" notice. (Test in Task 4.)
4. A stored manual preference beats auto-detection, except when WebGL is missing. (Test in Task 4.)
5. A 375px-wide phone in Lo-Fi → no horizontal scroll on any page. (Test in Task 6.)

---

### Task 1: Scaffold the project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `playwright.config.ts`, `.gitignore`, `README.md`, `ASSETS.md`, `CONTENT-TODO.md`

**Interfaces:**
- Produces: `npm run dev` (port 4321), `npm test` (vitest), `npm run e2e` (playwright against `astro preview`), `npm run build`.

- [ ] **Step 1:** `git init`, then `npm create astro@latest . -- --template minimal --typescript strict --no-install --no-git`. Then `npm i three gsap lenis` and `npm i -D vitest @playwright/test @types/three`.
- [ ] **Step 2:** In `astro.config.mjs`, configure `site: 'https://ailula.top'` and `i18n: { defaultLocale: 'en', locales: ['en','zh'], routing: { prefixDefaultLocale: false } }`.
- [ ] **Step 3:** Add `.claude/launch.json` with a `dev` entry (`npm run dev`, port 4321) so previews work.
- [ ] **Step 4:** Run `npm run build`. Expected: build succeeds.
- [ ] **Step 5:** Commit `chore: scaffold astro project`.

### Task 2: Timeline and tree-ring geometry

**Files:**
- Create: `src/lib/timeline.ts`, `src/lib/rings.ts`
- Test: `tests/unit/timeline.test.ts`, `tests/unit/rings.test.ts`

**Interfaces:**
- Produces:
  - `TIMELINE = { startYear: 2017, endYear: 2026, maxHeight: 115 }`
  - `yearToHeight(year: number): number`, linear, clamped to [0, 115]
  - `heightToYear(h: number): number`, the inverse, returning a fractional year
  - `RING_WIDTHS: Record<number, number>`: 2017:10, 2018:7, 2019:6, 2020:7, 2021:5, 2022:5, 2023:8, 2024:16, 2025:14, 2026:8
  - `ringPath(radius: number, wobble: number, phase: number, seed: number): string`, a closed SVG path, deterministic for the same seed
  - `ringRadii(scale: number): { year: number; radius: number }[]`, cumulative

- [ ] **Step 1: Write the failing tests**

```ts
expect(yearToHeight(2017)).toBe(0); expect(yearToHeight(2026)).toBe(115);
expect(yearToHeight(2030)).toBe(115); expect(heightToYear(yearToHeight(2024))).toBeCloseTo(2024);
expect(ringPath(50,2,0,7)).toBe(ringPath(50,2,0,7)); expect(ringPath(50,2,0,7)).toMatch(/^M.*Z$/);
const r = ringRadii(1); expect(r.at(-1)!.radius).toBe(86); // sum of widths
expect(r.find(x=>x.year===2024)!.radius - r.find(x=>x.year===2023)!.radius).toBe(16);
```

- [ ] **Step 2:** Run `npx vitest run tests/unit`. Expected: FAIL (modules missing).
- [ ] **Step 3:** Implement. `ringPath` uses the seeded LCG noise and the 3rd/5th-harmonic wobble from the approved mockup: 72 points, y squashed ×0.94.
- [ ] **Step 4:** Run `npx vitest run tests/unit`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: timeline mapping and ring geometry`.

### Task 3: Milestone 1 — photographic climb realism test

Spike. It gets smoke-level checks only, and **stops for lula's review**: nothing in later plans builds on it until she approves.

**Files:**
- Create: `src/scenes/climb/createClimbScene.ts`, `src/scenes/climb/trunk.ts`, `src/scenes/climb/atmosphere.ts`, `src/scenes/climb/foliage.ts`, `src/components/RingCompass.astro`, `src/pages/lab/climb.astro`, `public/assets/` (textures, HDRI)
- Test: `tests/e2e/climb.spec.ts`

**Interfaces:**
- Consumes: `yearToHeight`, `heightToYear`, `ringRadii`, `ringPath` (Task 2)
- Produces:
  - `type BranchSpec = { id: string; year: number; side: 'left'|'right'; kind: 'experience'|'project'|'post' }`
  - `createClimbScene(canvas: HTMLCanvasElement, branches: BranchSpec[]): { setHeight(m: number): void; anchor(id: string): { x: number; y: number; visible: boolean }; resize(): void; dispose(): void }`

- [ ] **Step 1: Assets.** Download CC0 assets from Poly Haven and record them in `ASSETS.md`: one redwood or pine bark PBR set at 2k (diffuse, normal, roughness), one overcast or forest HDRI at 1k–2k, and a fern model or fern alpha card if one is available (otherwise use a procedural fern and note it).
- [ ] **Step 2: Trunk.** Build `trunk.ts`. The trunk is a tapered cylinder: base radius ≈ 4.5 m, ≈ 1.2 m at 115 m, slight noise displacement and a flared root base. Bark is tiled vertically with triplanar-ish UVs, so the texture doesn't stretch.
- [ ] **Step 3: Atmosphere.** Build `atmosphere.ts`.
  - Height-dependent fog: light at 0 m (dawn mist), densest between 70 and 105 m, gone above the cloud layer at about 108 m.
  - Above the cloud layer: an HDRI sky, a sea-of-fog plane, and 4–6 distant crowns poking through.
  - Light shafts: additive volumetric cones or a god-ray pass. Plus 8–12 distant blurred trunks for depth.
- [ ] **Step 4: Foliage and branches.** Build `foliage.ts` with instanced branch sprays at each `BranchSpec` height, ferns on the forest floor, and an opening in the canopy at the top.
- [ ] **Step 5: Lab page.** Build `lab/climb.astro`.
  - A fixed full-screen canvas. Lenis + ScrollTrigger map scroll progress 0→1 to `setHeight(0→115)`.
  - The left altitude meter shows `NNm · YEAR`.
  - Four placeholder HTML cards (text `待补充 / TODO`) follow `anchor(id)`.
  - `RingCompass` (SVG built from Task 2) sits bottom-right, grows with `heightToYear`, highlights the current ring, and clicking a ring scrolls to that year.
  - Landing overlay: `lula`, the slogan, the scroll hint.
- [ ] **Step 6: Smoke test.**

```ts
test('climb renders and reaches the canopy', async ({ page }) => {
  await page.goto('/lab/climb'); await expect(page.locator('canvas')).toBeVisible();
  await page.mouse.wheel(0, 100000); await page.waitForTimeout(1500);
  await expect(page.getByTestId('altitude')).toContainText('115m');
});
```

Run `npm run e2e -- climb`. Expected: PASS, no console errors.
- [ ] **Step 7: Performance check.** Measure FPS on desktop and at 375×812 with a mobile UA. Targets: ≥ 55 fps desktop, ≥ 30 fps mobile emulation. If mobile misses, add a lower-quality preset (half resolution, no god-ray pass).
- [ ] **Step 8: Screenshots.** Save to `docs/progress/` at 0 m, 40 m, 80 m, 110 m and 115 m.
- [ ] **Step 9:** Commit `spike: photographic redwood climb realism test`.

### Task 4: Mode (Hi-Fi/Lo-Fi) and i18n logic

**Files:**
- Create: `src/lib/mode.ts`, `src/lib/i18n.ts`, `src/i18n/ui.ts` (all UI strings zh/en)
- Test: `tests/unit/mode.test.ts`, `tests/unit/i18n.test.ts`

**Interfaces:**
- Produces:
  - `type Mode = 'hifi' | 'lofi'`
  - `detectMode(env: { webgl: boolean; reducedMotion: boolean; lowPower: boolean; stored: Mode | null }): { mode: Mode; auto: boolean }`
  - `MODE_STORAGE_KEY = 'ailula-mode'`
  - `type Lang = 'en' | 'zh'`
  - `localizedPath(path: string, lang: Lang): string`: `/writing/x` ↔ `/zh/writing/x`
  - `pickTranslation<T extends { lang: Lang }>(entries: T[], lang: Lang): { entry: T; fallback: boolean }`
  - `t(lang: Lang, key: keyof typeof ui.en): string`

- [ ] **Step 1: Write the failing tests**

```ts
expect(detectMode({webgl:false,reducedMotion:false,lowPower:false,stored:'hifi'})).toEqual({mode:'lofi',auto:true});
expect(detectMode({webgl:true,reducedMotion:true,lowPower:false,stored:null})).toEqual({mode:'lofi',auto:true});
expect(detectMode({webgl:true,reducedMotion:true,lowPower:false,stored:'hifi'})).toEqual({mode:'hifi',auto:false});
expect(detectMode({webgl:true,reducedMotion:false,lowPower:false,stored:null})).toEqual({mode:'hifi',auto:false});
expect(localizedPath('/writing/a/','zh')).toBe('/zh/writing/a/'); expect(localizedPath('/zh/writing/a/','en')).toBe('/writing/a/');
expect(pickTranslation([{lang:'zh',id:1}],'en')).toEqual({entry:{lang:'zh',id:1},fallback:true});
```

- [ ] **Step 2:** Run `npx vitest run tests/unit`. Expected: FAIL.
- [ ] **Step 3:** Implement. Storage access is wrapped in try/catch. `ui.ts` holds every visible UI string in both languages, including `chineseOnly: 'Chinese only'` and `englishOnly: '仅英文'`.
- [ ] **Step 4:** Run `npx vitest run tests/unit`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: mode detection and i18n helpers`.

### Task 5: Content collections and post migration

**Files:**
- Create: `src/content.config.ts`, `scripts/migrate.ts`, `src/content/posts/**`, `src/content/projects/**`
- Test: `tests/unit/migrate.test.ts`

**Interfaces:**
- Produces:
  - Posts collection, one file per language at `src/content/posts/<slug>/<lang>.md`, with frontmatter `{ title: string; date: Date; lang: Lang; kind: 'essay'|'notes'|'weekly'|'old-notes'; maturity: 'seedling'|'growing'|'mature'; tags: string[]; legacyPaths: string[] }`
  - Projects collection, same layout, with frontmatter `{ title; date; lang; summary; status: 'live'|'wip'; links: {label:string; url:string}[]; legacyPaths: string[] }`
  - `migratePost(file: { name: string; raw: string }): { slug: string; lang: Lang; frontmatter; body }`
  - `classifyKind(title: string, tags: string[], date: Date): kind`. Rules:
    - 2017 course or SQL notes → `old-notes`
    - title starts with 📖 or 🎬 → `notes`
    - `Week`, `一周一记`, `小结`, or tagged Life → `weekly`
    - otherwise → `essay`
  - Maturity defaults: essay → `mature`, notes → `growing`, weekly → `seedling`, old-notes → `mature`.

- [ ] **Step 1: Write the failing tests.** Base them on real filenames:
  - `migratePost({name:'029-好的产品遍地都是.zh.md', raw})` gives slug `029-好的产品遍地都是`, lang `zh`, and `legacyPaths` containing `/zh/posts/029-好的产品遍地都是/`
  - `classifyKind('📖一间只属于自己的房间',[],2020)` → `notes`
  - `classifyKind('Week33 - 拿到驾照&MGV项目面试通过',[],2025)` → `weekly`
  - `classifyKind('SQL必知必会笔记',[],2017)` → `old-notes`
- [ ] **Step 2:** Run `npx vitest run tests/unit/migrate.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement. Hugo's legacy path is taken from the post's `slug`/`url` frontmatter if present, else the filename stem, lowercased the way Hugo does it. Cross-check every path against `luli-lula.github.io/public/sitemap.xml` and `public/zh/sitemap.xml`. Images referenced by posts are copied to `public/legacy/`.
- [ ] **Step 4:** Run `npx tsx scripts/migrate.ts` (reads `~/Documents/Side-Projects/luli-lula.github.io/content`, read-only). Then `npx vitest run`. Expected: PASS. `npm run build` passes schema validation.
- [ ] **Step 5:** Commit `feat: migrate posts and projects from hugo`.

### Task 6: Lo-Fi pages and base layout

**Files:**
- Create: `src/layouts/Base.astro` (head, GA, language and mode toggles, Lo-Fi notice), `src/components/Placeholder.astro`, and pages under `src/pages/` plus mirrored `src/pages/zh/`:
  - `index.astro`: Lo-Fi home, résumé style: name, slogan, one-liner, a timeline list grouped by year, projects, "now", contact
  - `writing/index.astro`, `writing/[slug].astro`
  - `projects/index.astro`, `projects/[slug].astro`
  - `cinema.astro`: placeholder for the top 10 plus a "coming in Plan 4" note
- Test: `tests/e2e/lofi.spec.ts`

**Interfaces:**
- Consumes: `detectMode`, `MODE_STORAGE_KEY`, `localizedPath`, `pickTranslation`, `t` (Task 4); collections (Task 5)
- Produces:
  - `<Base title lang>`. The page `<html data-mode>` is set by an inline head script before paint.
  - `<Placeholder note="...">` renders `待补充 / TODO` and is greppable by `data-todo`.

- [ ] **Step 1: Write the failing e2e tests.**
  - `/writing/029-好的产品遍地都是/` shows the Chinese title and the label `Chinese only`
  - The language toggle on `/projects/` leads to `/zh/projects/`
  - With an emulated reduced-motion context, `/` has `html[data-mode="lofi"]` and the notice is visible
  - At viewport 375×812, for each of `/`, `/writing/`, `/projects/`, `/zh/`: `document.documentElement.scrollWidth <= 375`
- [ ] **Step 2:** Run `npm run e2e -- lofi`. Expected: FAIL.
- [ ] **Step 3:** Implement the pages.
  - Quiet, warm, readable typography. Forest-toned CSS variables, light and dark.
  - Every unknown fact uses `<Placeholder>`. That covers timeline details beyond the known milestones, project details, "now" card, email, résumé PDF and the top 10.
  - Known milestones: 2017 learned product; 2018–23 big-tech PM; 2023 first gap; 2024 left big tech, taught myself Next.js, first indie product; 2025 moved to rural NY, Master Gardener.
- [ ] **Step 4:** Run `npm run e2e -- lofi`. Expected: PASS.
- [ ] **Step 5:** Run `grep -rl 'data-todo' dist` after build and regenerate `CONTENT-TODO.md` (page → what's missing).
- [ ] **Step 6:** Commit `feat: lo-fi pages, base layout, toggles`.

### Task 7: Old-URL redirects

**Files:**
- Create: `scripts/build-redirects.ts`, `src/redirects.json` (generated, committed)
- Modify: `astro.config.mjs` (import `redirects` from the JSON)
- Test: `tests/unit/redirects.test.ts`, `tests/e2e/redirects.spec.ts`

**Interfaces:**
- Consumes: `legacyPaths` from both collections (Task 5)
- Produces: `buildRedirects(entries: { legacyPaths: string[]; newPath: string }[], extras: Record<string,string>): Record<string,string>`. Keys are decoded paths with a trailing slash.

- [ ] **Step 1: Write the failing tests.**
  - Unit: the legacy path `/zh/posts/029-好的产品遍地都是/` maps to `/zh/writing/029-好的产品遍地都是/`.
  - Extras map to these targets:

    | Legacy path | New path |
    |---|---|
    | `/posts/` | `/writing/` |
    | `/zh/posts/` | `/zh/writing/` |
    | `/archives/` | `/writing/` |
    | `/movies/` | `/cinema/` |
    | `/books/` | `/cinema/` |
    | `/tags/` | `/writing/` |
    | `/about/` | `/` |

    Each also has a `/zh/` twin.
  - Unit: every `<loc>` in both old sitemaps resolves either to an existing new route or to a redirect key.
  - E2E: visiting the percent-encoded form of the 029 URL lands on the new page.
- [ ] **Step 2:** Run the tests. Expected: FAIL.
- [ ] **Step 3:** Implement. Also emit an RSS feed at `/index.xml` and `/zh/index.xml` (via `@astrojs/rss`) so old subscribers keep working.
- [ ] **Step 4:** Run `npx vitest run && npm run e2e -- redirects`. Expected: PASS.
- [ ] **Step 5:** Commit `feat: legacy redirects and rss`.

### Task 8: Morning summary

- [ ] **Step 1:** Write `docs/progress/2026-10-20-morning.md` in Chinese:
  - What was done
  - Screenshots (milestone 1, plus the Lo-Fi home)
  - How to view: `npm run dev` → `/lab/climb`, `/`
  - Open decisions for lula
  - Anything skipped or failed, with output
- [ ] **Step 2:** Run a fresh whole-branch review (one reviewer subagent). Fix confirmed issues and commit `docs: morning progress summary`.
