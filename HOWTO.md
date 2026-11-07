# How the App Works

The app models a real or example IT process scenario end-to-end. You start from raw evidence and work toward a structured process landscape, journey map, and BPMN export.

---

## The Intended Sequence

```
Home  →  Discover  →  Identify  →  Journey  →  Map
```

> **Why this order?** You need raw evidence before you can confidently name processes (Discover → Identify). You need identified processes before you can link journey steps to them (Identify → Journey). The process map is an output — it formalizes what you already know (Journey → Map).
>
> Scenarios come fully seeded so you can explore any workspace immediately. The sequence matters most when starting from a blank project.

---

## Workspaces

### 1. Home — Load or Create

Load one of the IT scenario packs (pre-filled with realistic data) or start a blank project. Each scenario comes with candidates, processes, journey, evidence, and graph relations already seeded.

---

### 2. Discover — Log Your Evidence

Where you record the raw inputs that justify your process model:

- **Interviews** — record what people said; tag items as claims, pain points, or observations
- **Observations** — timed field observations with notes
- **Storming** — assumption storming cards (what could be wrong with this model?)
- **Contradictions** — explicit flagging of conflicting claims between sources

---

### 3. Identify — Build the Process Landscape

The analytical core. Five sub-tabs:

| Tab | What it does |
|-----|-------------|
| **Landscape** | Swimlane view — 3 tiers: management (top), core (middle), support (bottom). Processes placed by tier label. |
| **Identify** | Left: candidates (accept / reject). Right: process charter — trigger, outcome, purpose, scope, parent. |
| **Graph** | Network view of processes as nodes and typed relations as edges. Display-only — clicking a node opens its charter. |
| **Coverage** | Matrix showing which processes support which services and capabilities. |
| **Scoring** | Priority scoring of process candidates by weighted criteria. |

**Deleting a process:** hover over any tile on the Landscape tab — a red × button appears in the top-right corner.

**How relations get created:** seeded by scenario data. The Graph tab is currently display-only — there is no drag-to-connect UI yet.

---

### 4. Journey — Model the User Experience

Build a journey map for the persona in the scenario:

- **Stages** — phases of the experience (e.g. "Awareness", "Waiting", "Resolution")
- **Steps** — discrete actions or moments from the persona's perspective
- **Touchpoints** — which channel and system each step uses
- **Sentiment** — −2 (severe frustration) to +2 (delight) at each step
- **Pain points** — symptom / hypothesized cause / intervention, linked to steps and processes

---

### 5. Map — Produce a Process Model

Two tools:

- **SIPOC** — one-page scope document: Suppliers → Inputs → Process → Outputs → Customers. No control flow.
- **Process map** — swimlane activity map with lanes, tasks, and edges. Exports as a BPMN starting point for Camunda or Signavio.
