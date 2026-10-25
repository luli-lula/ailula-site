# Plan 3 — Content, plants and launch readiness

> Executor: superpowers:executing-plans (native, unattended overnight). Ledger: `.superpowers/sdd/2026-10-24-content-launch/progress.md`.

**Goal:** Turn the valley into a launch-ready site within two days:
- subtle rings
- a real timeline from lula's CV
- real projects from the project catalog
- a new Greenhouse place for plants and Floradex
- launch basics (SEO, 404, reduced motion, pnpm)
- one HTML report with every question for lula, asked at once

**Sources of truth (facts only from these; anything else is 待补充):**
- **CV:** the Claude Doc "Lu Li · CV (general draft)", https://claude.ai/artifact/P2fVXkg61zHRK2tK9jkZGb. Do not publish the phone number or the street address.
- **Project catalog:** `python3 ~/ai-context/scripts/projects-catalog.py OUT.json` (fields: name, category, status, summary, url, site_pick, next).
- **Old blog posts:** already migrated.
- **Floradex:** `~/Documents/Wildcard/Floradex/` and the project board entry. The app is unreleased: show it as "in progress", with no App Store claims.

**Rules:**
- No deploy, no push, no repo creation, no DNS change, no spending.
- Commits use author `luli-lula@users.noreply.github.com` and no Claude attribution line.
- Do not modify other projects' folders. Reading them and running them locally for screenshots is OK.
- Live sites may be screenshotted (read-only).

## Tasks

1. **Subtle rings.**
   - The trunk rings are invisible by default and never shown in the home view (lula: the rings looked abrupt).
   - When the tree story opens, thin warm rings fade in with their year tags.
   - Test: an e2e check that ring opacity is 0 until the tree is focused.
2. **CV timeline.**
   - `src/data/timeline.ts` becomes CV-based, bilingual, 2011 → now. Entries: B.S. GIS SYSU + Esri China competition first prize (2014); M.S. Cartography & GIS + thesis; Esri intern; DiDi; Shopee; Trip.com; independent AI product consultant; Wild Ones; Master Gardener; WildCard. Each entry has a short detail line taken from the CV.
   - The tree's year range becomes 2011–2026. Roots = GIS education, crown = now.
   - Update the tests.
3. **Projects from the catalog.**
   - Add every `site_pick = 候选` project with its catalog summary, live URL and status. The project pages use the existing layout. Narrative sections stay 待补充.
   - Screenshot each live URL (desktop, 1280×800) to `public/assets/projects/<slug>.webp`. Show the screenshot on the cards and the project page.
   - Projects that are `待定` are left out and listed in the report for lula's decision.
   - The existing `native-plant-cards` stub becomes `plant-care-signs` (same project). `floating-thoughts` (待定) is kept as a draft and not listed.
4. **Greenhouse (plants).**
   - A new valley place, "温室 · 植物 / Greenhouse · Plants": a larger glasshouse at the back-left of the island.
   - Its panel features Floradex (in progress), then WildCard, plant-care-signs, the Wild Ones guide and Master Gardener.
   - It has a photo strip ready for lula's botanical-garden photos. Use the 3 Mariposa photos for now, captioned as giant sequoias.
   - The Lo-Fi home and the projects index group the plant projects together.
5. **Floradex visuals.**
   - Try a local simulator build of `~/Documents/Wildcard/Floradex` and take 3–4 screenshots. Do not commit or edit in that repo.
   - If the build needs secrets or fails, use a 待补充 placeholder and note it in the report.
6. **Launch basics:**
   - `@astrojs/sitemap`, `robots.txt`
   - `noindex` on `/lab/*`
   - OG image (a valley screenshot) and a favicon (a small sequoia)
   - a custom 404 inside the valley style
   - reduced motion in Hi-Fi: no auto-rotate, instant camera cuts, particles off
   - label overlap on 320–375px screens
   - switch to pnpm
   - Run the full test suite.
7. **Final review** by a fresh subagent, then fixes.
8. **The report (HTML Artifact, private)**, in Chinese:
   - what changed, with screenshots embedded small
   - every question for lula in one list
   - a launch plan for next week (repo → Vercel preview → her approval → DNS switch of the root domain from GitHub Pages, with the exact DNS records)
   - Then append `NIGHT DONE` to the ledger.
