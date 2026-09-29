# CareerSphere AI — Career Intelligence & Personal Growth Platform

🌐 **Live Demo:** [https://vijaymahes9080.github.io/careersphere-AI/](https://vijaymahes9080.github.io/careersphere-AI/)

A data-first, **local-only** single-page application that ingests your career data
(XML / JSON / CSV / TXT / resume), normalizes it into one profile, extracts entities
with evidence, and turns it into interactive analytics you can explore.

No build step. No CDN. No API keys. No server-side storage — everything runs in
your browser and stays there.

---

## 🚀 Live Hosting & Deployment

The application is fully hosted and accessible worldwide at:
👉 **[https://vijaymahes9080.github.io/careersphere-AI/](https://vijaymahes9080.github.io/careersphere-AI/)**

Continuous deployment is configured via GitHub Actions (`.github/workflows/deploy.yml`), automatically updating the live site on every commit to `main`.

## Quick start

```bash
node server.js
```

Then open **http://localhost:8080**

> The bundled `server.js` is a zero-dependency Node static server (no npm install
> needed). Serving over HTTP rather than opening `index.html` directly lets the app
> `fetch()` the demo datasets. Your own data never leaves the browser.

Any static server works equally well:

```bash
npx serve .        # alternative
python -m http.server 8080
```

**First run?** Go to **Data Center → Load DEMO data** to explore with a labeled
sample profile, or import your own files immediately.

---

## The pipeline

Every view is built on the same mandatory, inspectable pipeline:

```
INGESTION → PARSING → NORMALIZATION → ENTITY EXTRACTION
    → RELATIONSHIP BUILDING → ANALYSIS → VISUALIZATION
```

Stage timings are visible in **Settings → Pipeline log** (per-stage milliseconds),
so you can see exactly what ran and how long it took.

| Stage | Service |
|---|---|
| Ingestion (file / paste / demo) | `DataIngestionService` |
| Parsing (XML, JSON, CSV, TXT/resume) | `XMLParser`, `JSONParser`, `CSVParser`, `TextExtraction` |
| Normalization → unified schema | `NormalizationService` |
| Entity extraction (+ evidence context) | `EntityService`, `TextExtractionService` |
| Relationship building (graph) | `RelationshipService` |
| Evidence & traceability | `EvidenceService` |
| Analysis (skill / career / project / quality) | `SkillAnalysis`, `CareerAnalysis`, `ProjectAnalysis`, `DataQuality` |
| Visualization (SVG) | `VisualizationService` + `cs-*` components |
| Reports (print-ready HTML) | `ReportService` |

---

## The 10 views

| View | What it does |
|---|---|
| **Overview** | Profile hero, readiness ring, intelligence cards, central **Career Intelligence Map** |
| **Skill Intelligence** | Skill matrix with search/filters/sort, radar chart, status chips, **skill-gap table vs. a target role** |
| **Career Map** | Career journey stages, pathway cards, radial intelligence map, relationship network |
| **Projects** | Per-project documentation strength, skills demonstrated, role links, project→skill network |
| **Learning** | Roadmap generated **from your actual gaps**, with progress tracking |
| **Opportunities** | Match analysis against imported opportunities only — matched / partial / missing / unknown |
| **Evidence** | Audit trail: every claim → its source document, weights and multi-source warnings |
| **Data Center** | Import (file/paste/note), inspect, reprocess, remove; data-quality warnings; demo management |
| **Reports** | 5 print-ready report types with live preview, **Print / Save as PDF** and **Download HTML** |
| **Settings** | Theme, target role, pipeline log, demo load/remove, delete-all-data |

Plus the global **⚡ Analyze My Career** button — runs the full pipeline and opens a
transparent report (readiness factors, strengths, evidence highlights, gaps,
incomplete information, learning priorities).

---

## Data & evidence rules

- **Traceable** — every claim links back to a source dataset; skills carry
  `detectedIn` context snippets.
- **Confidence levels** — `Confirmed` · `Detected` · `Needs verification`.
- **Never invents** — no fabricated data, no fabricated job requirements.
  Opportunities are analyzed strictly against what you imported.
- **Scores are estimates** — every score is labeled *"CareerSphere analytical
  estimate"* with its contributing factors shown.
- **Evidence weights** — Project 3 · Internship 4 · Experience 4 · Certificate 2.
- **Coverage statuses** — STRONG / FOUND / PARTIAL / UNVERIFIED / MISSING.
- **Data-quality warnings** — parse errors, missing fields, multi-source
  contradictions surfaced in Data Center and Evidence.
- **Graceful failures** — a malformed file produces an inline error row and a
  toast; it never breaks the app.
- **DEMO DATA is labeled** — demo datasets carry a `DEMO DATA` badge, can be
  removed in one click, and are never silently mixed with your own data.

---

## Import formats

| Format | Notes |
|---|---|
| **XML** | `<skill>`, `<project>`, `<certificate>`, education, experience nodes |
| **JSON** | Skills, projects, roles, opportunities, learning history |
| **CSV** | `skill,category,level` (and similar tabular layouts) |
| **TXT / resume** | Regex + knowledge-base extraction (skills, education, certs, achievements, goals) |
| **Note** | Free text saved as a first-class source |

Use **Data Center → Inspect** on any row to see its parsed records, extraction
results, and original content.

---

## Export

- **Reports → Print / Save as PDF** — opens a print-ready rendering (browser
  print dialog → Save as PDF).
- **Reports → Download HTML** — standalone print-ready HTML file.
- The `@media print` stylesheet strips navigation and chrome automatically.

---

## Tech & structure

- **AngularJS 1.8.3** + `ngRoute`, vendored locally in `vendor/` (no CDN).
- **HTML5 / CSS3 / vanilla JS**, hand-rolled **SVG** visualizations
  (`cs-intel-map`, `cs-radar`, `cs-network`, `cs-ring`, `cs-node-detail`).
- **Responsive** — desktop / tablet / mobile breakpoints, tables restack into
  cards on small screens; `prefers-reduced-motion` and `@media print` supported.
- **Accessible** — Lighthouse Accessibility **100**, Best Practices **100**, SEO **100**.
  Skip link, landmarks, `aria-current` navigation, focusable graph nodes
  (`role="button"`, Enter to activate), labeled controls.

```
careersphere/
├── index.html            app shell, script order, report modal, toasts
├── server.js             zero-dependency static server
├── css/styles.css        design system, dark/light themes, responsive, print
├── views/*.html          10 route templates
├── js/
│   ├── app.js            modules, routes, hash prefix, theme watcher
│   ├── models/           CareerProfileModel (schema + IDs)
│   ├── services/         18 services (pipeline, storage, notifications, orchestration)
│   ├── components/       SVG directives
│   └── controllers/      11 controllers
├── data/demo/            6 labeled sample datasets
└── vendor/               AngularJS 1.8.3 (local)
```

---

## Privacy

All processing happens locally in your browser (`localStorage` only).
**No uploads, no tracking, no API keys, no external requests** at runtime.

---

## Browser support

Modern evergreen browsers (Chrome, Edge, Firefox, Safari) with ES5 + CSS
Grid/`color-mix()` support.
