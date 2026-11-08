# Process Insight

An educational React application for university Business Process Management (BPM) courses. Students identify and organise process landscapes, collect discovery evidence, model customer and employee journeys, and generate traceable BPMN drafts for editing in BPMN Studio.

## Workspaces

| Workspace | What students do |
|-----------|-----------------|
| **Learn** | 12-unit BPM curriculum, concept explorer, 36 practice challenges, 12 IT scenario packs |
| **Discover** | Interview synthesis, observation timelines, event storming board, contradiction log |
| **Identify** | Build a process landscape: candidates, hierarchy tree, charters, typed relationships, service/capability coverage, prioritisation |
| **Journey** | Author multi-stage journey matrices with stages, steps, typed rows, sentiments, touchpoints, pain points and evidence |
| **Map** | SIPOC, role-swimlane process maps, BPMN 2.0 export wizard with traceability sidecar |

All data lives in the browser (IndexedDB via Dexie). No backend or authentication required.

## Tech stack

- **React 19** + TypeScript strict mode
- **Vite 8** (ES modules, fast HMR)
- **Dexie v4** over IndexedDB — versioned schema, 38 tables, tab-ownership write guard
- **@xyflow/react** — process landscape graph
- **bpmn-js** (read-only viewer) + **bpmn-moddle** — BPMN 2.0 generation and preview
- **recharts** — KPI charts
- **lucide-react** — icons
- **@dnd-kit** — drag-and-drop reordering
- **@tanstack/react-virtual** — virtualised large lists
- **zod** — runtime schema validation at import/export boundaries
- **elkjs** — automatic graph layout

## Getting started

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
# → http://localhost:5173
```

### Other commands

```bash
npm run build        # TypeScript check + production bundle → dist/
npm run preview      # Preview the production build locally
npm run lint         # Run oxlint
npm test             # Run vitest (once)
npm run test:watch   # Run vitest in watch mode
npm start            # Serve dist/ (used by Railway web service)
```

## Deployment

### Netlify

Deploy from GitHub (auto-detected as a Vite project). The included `netlify.toml` sets the build command, publish directory, and SPA redirect rule.

Alternatively, configure manually in the Netlify dashboard:
- Build command: `npm run build`
- Publish directory: `dist`
- Add a redirect: `/* → /index.html` (HTTP 200)

### Railway

#### Option 1 — Static Site (recommended)

1. New Project → **Deploy from GitHub**
2. Choose **Static Site** deployment type
3. Set **Build command**: `npm run build`
4. Set **Publish directory**: `dist`
5. Enable SPA routing (serve `index.html` for all paths)

#### Option 2 — Web Service

Railway will auto-detect Nixpacks and run `npm start`, which serves `dist/` using the `serve` package:

```bash
npm start  # → npx serve dist -l $PORT
```

The included `railway.toml` configures the build and start command for this mode.

## Project structure

```
src/
├── app/                    AppShell — shell, navigation, tab ownership
├── components/             Shared UI primitives (WorkspaceGuide, WorkspacePath, …)
├── domain/
│   ├── contracts/
│   │   ├── types.ts        All entity interfaces
│   │   └── ids.ts          ID generator
│   ├── commands/           Typed domain operations
│   └── metrics/            Pure coverage and scoring functions
├── storage/
│   └── db.ts               Dexie database (38 tables, versioned migrations, write guard)
├── features/
│   ├── home/               HomeScreen — project list, example loader, quick actions
│   ├── learn/              Curriculum, challenges, concept explorer
│   ├── identify/           Landscape tree, process charters, candidates, scoring
│   ├── discover/           Interview synthesis, observations, event storming, contradictions
│   ├── journey/            Journey matrix — stages, steps, typed rows, sentiment, pain points
│   ├── map/                SIPOC, process map, BPMN export hub
│   ├── derivation/         BpmnExportWizard, bpmnGenerator, BpmnViewer
│   ├── dictionary/         Dictionary panel (personas, systems, channels, touchpoints), opened from Journey
│   ├── guided/             GuidedPathBanner
│   └── scenarios/          IT scenario fixture builders (IT-02 … IT-12) + large fixture
├── data/
│   ├── glossary/           English/Croatian term glossary
│   └── scenarios/          Scenario JSON data
└── styles/                 CSS design tokens and component styles
```

## Scenario packs

| ID | Scenario | Level |
|----|----------|-------|
| IT-02 | SaaS customer completing onboarding | Beginner |
| IT-03 | Employee reporting a hardware incident | Beginner |
| IT-04 | Developer requesting cloud resources | Intermediate |
| IT-05 | New employee requesting system access | Intermediate |
| IT-06 | Enterprise customer during a major incident | Intermediate |
| IT-07 | Product team releasing software | Advanced |
| IT-08 | Developer integrating a public API | Advanced |
| IT-09 | SaaS administrator handling renewal/cancellation | Intermediate |
| IT-10 | Team procuring an IT service | Advanced |
| IT-11 | Customer migrating to cloud hosting | Advanced |
| IT-12 | Enterprise onboarding a managed-service provider | Capstone |

## BPMN export

The Map workspace generates a BPMN 2.0 XML file you can open in [bpmn.io](https://bpmn.io), Camunda Modeler, Signavio, or any compliant BPMN Studio. The export includes:

- A pool with optional swimlanes
- Sequential task flow (start → tasks → end)
- BPMNDI interchange data for graphical positioning
- An XML comment identifying the source tool
- A `.trace.json` sidecar with journey-to-BPMN traceability

Decisions, parallel gateways, loops, timers, and cross-pool message flows require manual editing in BPMN Studio after export.

## License

Educational use. See individual dependency licenses in `node_modules`. The bpmn-js viewer includes the [bpmn.io watermark](https://bpmn.io/license/) per the bpmn-js license terms.
