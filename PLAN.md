# Plan: features ported from BPMN Studio

Source of the ports: `../BPMN-studio/src/features/{modeler,token-simulation,library,learning}`.
Only planning, no code changed yet.

## Findings that shape the plan

- The BPMN draft is generated in `src/features/derivation/bpmnGenerator.ts` (`generateBpmnXml`) and shown read-only in `BpmnViewer.tsx` inside `BpmnExportWizard.tsx` (989 lines). The user cannot fix a draft before exporting.
- bpmn-js is already a dependency (18.31.1) and is lazy-loaded. `bpmn-js-properties-panel` and `bpmn-js-token-simulation` are **not** installed here.
- Scenarios are built in memory by `buildITxxScenario()` and returned as a `ScenarioBundle` (processes, candidates, journeys/stages/steps/cells, process maps, SIPOC). They are listed in `HomeScreen.tsx` (`SCENARIO_PACKS`, a plain table). Loading goes through `loadScenario` / `loadScenarioById.ts`.
- Learn (`LearnWorkspace.tsx`) has three tabs: Concepts, Units (`curriculum.ts`, 12 units), Challenges (`challenges.ts`). Nothing is quizzed or tracked.
- Small cleanup spotted: `SCENARIO_PACKS` lists `IT-01` with the IT-03 builder, so IT-01 and IT-03 load the same data. Fix while touching the scenario cards.

---

## 1. Editable modeler and token simulation for generated drafts

Goal: correct the BPMN before exporting it.

### 1.1 Dependencies
- Add `bpmn-js-properties-panel` and `bpmn-js-token-simulation` (same versions as BPMN-studio) plus the `@bpmn-io/properties-panel` peer if required. Check the Vite build and the bundle size. Both stay in a lazy chunk, loaded only when the modeler opens.

### 1.2 New feature folder `src/features/modeler/`
Port from BPMN-studio and trim:
- `bpmnConfig.ts`, `fit.ts`: copy as is.
- `ModelerToolbar.tsx`: keep undo/redo, zoom, fit, export XML/SVG, shortcuts, and a toggle for the properties panel. Drop anything about BPMN-studio's diagram library, so the toolbar only has modeler actions.
- `ShortcutsDialog.tsx`: copy as is.
- `ExplainPanel.tsx`: explains the selected element. Add Process Insight context: for an element created by the generator, show its origin (journey step, map activity, lane) from the trace data.
- `BpmnModeler.tsx` (new, adapted from `ModelerPage.tsx`, 477 lines): a **component**, not a routed page. Props: `xml`, `onChange(xml)`, `onClose`. No dependency on BPMN-studio's router, storage or progress.

### 1.3 Wiring into the export wizard
- In `BpmnExportWizard.tsx`, add an "Edit draft" action next to the viewer. It opens the modeler (full-screen dialog, or a modeler step in the wizard) with the generated XML.
- Keep the edited XML in wizard state as `editedXml`. The export step uses `editedXml ?? generatedXml`.
- Keep the original draft so "Reset to generated" works. If the user changes inputs and regenerates after editing, ask before discarding edits.
- The trace manifest (`TraceManifest`) references generated element ids. After editing, mark the manifest as "draft was edited" and keep ids for unchanged elements. Do not claim full traceability for new elements.
- Mobile: properties panel hidden by default below 820px, toolbar scrolls horizontally.

### 1.4 Validation before export (cheap, high value)
- Port `features/validation` (`IssueList.tsx`, `overlays.ts`) and its rules. Run on the edited XML. Show issues in the export step and block, or warn on, "Export" when there are errors (start/end events missing, dangling flows, gateways without defaults, and so on).
- Rule details need reading in BPMN-studio first. Not yet reviewed.

### 1.5 Token simulation
- `src/features/token-simulation/`: port `controller.ts` (604 lines) and `TokenSimulationPanel.tsx` (373 lines), or use the `bpmn-js-token-simulation` module directly if the BPMN-studio controller is only a wrapper. Check which first.
- Offer "Simulate" in the modeler toolbar and as a read-only mode in the wizard viewer, so a draft can be walked through even without editing.
- Gateways: let the user pick the path at each exclusive gateway while stepping.

### 1.6 Tests and acceptance
- Unit: `generateBpmnXml` output imports into the modeler without errors for every scenario IT-02..IT-12 (loop over `BUILDERS`).
- Unit: validation rules on known good and bad XML.
- Manual: generate, edit, export, and re-import the exported file in BPMN-studio.
- Done when: a user can open any generated draft, change it, run a token through it, see validation results, and export the corrected file.

Estimate: modeler 2-3 days, validation 1-2 days, token simulation 1-2 days.

---

## 2. Scenario cards with previews

Goal: replace the scenario table on the Home screen with cards. Each card has a small previewer for the scenario's landscape, journey and map. Left/right arrows move between the previews.

### 2.1 Data
- Previews must work **without loading the scenario into the database**. `buildITxxScenario()` already returns the full `ScenarioBundle` in memory, so the previewer only reads from it.
- Move `SCENARIO_PACKS` out of `HomeScreen.tsx` into `features/scenarios/registry.ts` with `{ id, label, level, summary, build }`. It becomes the single source for Home, `loadScenarioById.ts` and the Learn links. Fix the IT-01 duplicate (decide: remove, or write the real IT-01).
- Build each bundle lazily, cache it (`Map<id, ScenarioBundle>`), and build when the card scrolls into view (IntersectionObserver). This avoids building 12 bundles on page load.

### 2.2 Preview renderers (read-only, thumbnail scale)
Three small components that take a `ScenarioBundle`:
- **Landscape**: reuse the layout logic of `ProcessLandscapeView.tsx` / `hierarchy.ts`. Extract a pure `<LandscapeThumb candidates relations />` (SVG, no interaction).
- **Journey**: reuse `JourneyCanvas.tsx` data shape. Render stages as columns and steps as dots or short bars, with the emotion row as a line. A simplified SVG is enough.
- **Map**: render the first `ProcessMap` (lanes and activities) as an SVG. Optionally pass `generateBpmnXml` output to the existing `BpmnViewer` for a real BPMN preview. This is heavier, so use it only for the enlarged preview.
- Shared `fitToBox` helper so all three scale to the card.

### 2.3 Card UI (`ScenarioCard.tsx`, `ScenarioPreview.tsx`)
- Grid of cards (1 column on mobile, 2-3 on desktop). Card: id, title, level badge, one-line summary, counts (processes, journeys, activities), the preview area, and the Load and Guided buttons.
- Preview area: slides = Landscape / Journey / Map, with left and right arrow buttons, dot indicators, and the slide title. Keyboard (arrow keys when focused) and swipe on touch.
- Click on the preview opens a larger dialog with the same carousel at full size and the Load/Guided actions.
- Respect dark mode via tokens; no new colors.

### 2.4 Tests and acceptance
- Unit: each thumb renders for every scenario without throwing (including empty journeys or maps).
- Check: no DB writes while browsing previews; build time of previews on a mid-range phone.
- Done when: Home shows cards with a working carousel for all scenarios, and loading still works from both the card and the enlarged dialog.

Estimate: 2-3 days (thumbnails are the main work).

---

## 3. Learn additions: encyclopedia, quizzes, exercises, tutorial, progress

Goal: extend the Learn workspace, keeping its tab structure.

### 3.1 Structure
`LearnWorkspace.tsx` is already 525 lines with the Concepts content inline. First split it:
- Move the Concepts tab to `learn/ConceptsTab.tsx` and the Units and Challenges tabs into their own files. No behavior change.
- Tabs become: Concepts, Units, Challenges, **Encyclopedia**, **Quizzes**, **Exercises**, plus a persistent **Progress** header. Use a horizontally scrollable tab bar on mobile. Alternatively fold Quizzes and Exercises into each unit (preferred, see 3.3) and keep only Encyclopedia as a new tab.

### 3.2 Encyclopedia (from `EncyclopediaPage.tsx`, `EntryDetail.tsx`)
- New data file `learn/encyclopedia.ts`: terms such as process, process landscape, SIPOC, swimlane, journey stage, touchpoint, pain point, moment of truth, evidence vs assumption, KPI, gateway, handoff, and so on. Fields: `id`, `term`, `category`, `definition`, `example`, `related[]`, `appearsIn` (workspace or unit).
- Search box plus category filter. Entries link to related entries and to the relevant Unit or workspace.
- Cross-link: in workspaces, an info icon next to key terms opens the entry in a side sheet (second phase).

### 3.3 Quizzes and exercises (from `QuizView.tsx`, `ExerciseView.tsx`)
- Attach to existing units: extend `CurriculumUnit` with `quiz: QuizQuestion[]` (single choice, multiple choice, true/false; each with an explanation) and `exercises: Exercise[]`. The existing `exercise` and `reflection` strings become the first exercise and a free-text one.
- Quiz: one question at a time, immediate feedback with explanation, final score, retry. Pass mark per unit (for example 70%).
- Exercises: step-by-step tasks tied to a scenario (`relatedScenarios`), with a "check" that is self-assessed against a checklist at first. Automated checks against the project data (for example "journey has at least 3 stages") can come later and would reuse the idea in BPMN-studio's `challenges/assess.ts`.
- Content effort: about 5 questions for each of the 12 units, so around 60 questions. This is the biggest cost of the whole item.

### 3.4 Tutorial panel (from `TutorialPanel.tsx`, `data/tutorials.ts`)
- The app already has a guided tour. Do not build a second one. Instead, expose the existing tour steps as a "Tutorials" list in Learn (replay a tour per workspace), and port only what is missing from `TutorialPanel`, for example a side panel that stays open while working.
- Decide after reading `GuidedPathBanner.tsx` how much overlaps.

### 3.5 Progress and badges (from `app/progress.tsx`, `BadgeGrid.tsx`, `data/badges.ts`)
- Persist progress in Dexie: new table `learnProgress` (db version bump + migration) with `{ id, kind: 'unit'|'quiz'|'exercise'|'challenge', refId, status, score, updatedAt }`. Progress belongs to the user, not to a project, so keep it outside project export and delete.
- Show progress bars on the Units list, a completed check on quizzes and exercises, and a small badge grid (for example "First quiz", "All units read", "Capstone done").
- Add toasts for "badge earned" (port `app/toast.tsx`, which is small).

### 3.6 Tests and acceptance
- Unit: quiz scoring, progress reducer, encyclopedia search.
- Data check: every `related` and `relatedScenarios` id resolves.
- Done when: a learner can read a unit, take its quiz, do its exercise, look up terms, and see progress after a reload.

Estimate: refactor 0.5 day, encyclopedia 1-2 days, quizzes/exercises 3-4 days (mostly content), progress/badges 1-2 days.

---

## 4. Library (stored diagrams) – optional, not requested yet

The request mentioned the Library only in the context of scenarios and Learn. A diagram library fits naturally after item 1: a Dexie table `bpmnDrafts` with `{ id, projectId, title, xml, updatedAt }` so edited drafts can be saved, reopened and exported later, listed per project on the Home screen. Not planned in detail.

## Suggested order

1. Learn refactor (3.1), because it is cheap and de-risks later work.
2. Modeler + export wizard integration (1.1-1.3), then validation (1.4), then token simulation (1.5).
3. Scenario registry and cards (2).
4. Encyclopedia, quizzes, progress (3.2-3.5).

## Open questions

- Block export on validation errors, or only warn?
- Should edited drafts be saved (section 4) or live only in the wizard session?
- IT-01: remove it, or write a real scenario?
- Quiz content: write it by hand, or have it drafted and then reviewed?
