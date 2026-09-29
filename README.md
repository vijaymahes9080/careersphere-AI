# CareerSphere AI — Career Intelligence & Personal Growth Platform

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Online-success?style=for-the-badge&logo=githubpages&logoColor=white)](https://vijaymahes9080.github.io/careersphere-AI/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![GitHub Actions](https://img.shields.io/badge/Deploy-GitHub%20Pages-2ea44f?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/vijaymahes9080/careersphere-AI/actions)
[![Zero Dependency](https://img.shields.io/badge/Dependencies-Zero-informational?style=for-the-badge)](package.json)
[![Privacy First](https://img.shields.io/badge/Privacy-100%25%20Local-purple?style=for-the-badge)](README.md#privacy--security)

A data-first, **local-only** career intelligence single-page application that ingests multi-format career records (XML, JSON, CSV, TXT resumes, notes), normalizes them into a unified profile schema, extracts verifiable entities with direct evidence, and produces interactive visual analytics.

🌐 **Try it Live:** [https://vijaymahes9080.github.io/careersphere-AI/](https://vijaymahes9080.github.io/careersphere-AI/)

---

## ⚡ Highlights

- **100% Local & Private:** Runs entirely inside your browser. No server-side databases, no external API keys, and no telemetry.
- **Multi-Format Ingestion:** Ingests XML, JSON, tabular CSV, plain text resumes, and notes simultaneously.
- **Traceable Evidence:** Every skill, project link, and analytical score links directly to source document citations.
- **Zero-Dependency Core:** Pure client-side architecture with built-in SVG visualizations (radar charts, intelligence radial maps, relationship networks, readiness rings).
- **Print-Ready Reports:** Generates 5 distinct printable executive career reports and HTML downloads with clean `@media print` styling.
- **Dark & Light Mode:** Seamlessly toggles theme with persistent user preferences in `localStorage`.

---

## 🚀 Live Hosting & Quick Start

### 1. Instant Online Access
The application is continuously deployed via GitHub Actions:
👉 **[https://vijaymahes9080.github.io/careersphere-AI/](https://vijaymahes9080.github.io/careersphere-AI/)**

### 2. Run Locally with Node.js
Clone the repository and run the built-in zero-dependency static server:

```bash
git clone https://github.com/vijaymahes9080/careersphere-AI.git
cd careersphere-AI
node server.js
```
Open **[http://localhost:8080](http://localhost:8080)** in your browser.

### 3. Alternative Local Servers
```bash
# Using npx
npx serve .

# Using Python 3
python -m http.server 8080

# Using Docker
docker build -t careersphere-ai .
docker run -p 8080:8080 careersphere-ai
```

> **First run?** Navigate to **Data Center → Load DEMO data** to immediately populate the workspace with labeled sample profiles, projects, skills, and target roles.

---

## 🔄 The Intelligence Pipeline

Every analytical view is powered by an inspectable, deterministic data pipeline:

```
INGESTION ➔ PARSING ➔ NORMALIZATION ➔ ENTITY EXTRACTION ➔ RELATIONSHIPS ➔ ANALYSIS ➔ VISUALIZATION
```

Performance timings for each stage are inspectable in real-time under **Settings → Pipeline log**.

| Stage | Responsible Engine | Key Deliverables |
|---|---|---|
| **Ingestion** | `DataIngestionService` | Multi-file uploads, clipboard paste, inline text notes, DEMO datasets |
| **Parsing** | `XMLParser`, `JSONParser`, `CSVParser`, `TextExtraction` | Schema discovery, syntax validation, record extraction |
| **Normalization** | `NormalizationService` | Deduplication, unified profile schema mapping, date alignment |
| **Entity Extraction** | `EntityService`, `TextExtractionService` | Skill identification, role detection, contextual evidence extraction |
| **Relationships** | `RelationshipService` | Skill-to-project graphs, experience-to-role associations |
| **Evidence & Audit** | `EvidenceService` | Weighted citations (Projects: 3, Experience: 4, Certificates: 2) |
| **Analytics** | `SkillAnalysis`, `CareerAnalysis`, `ProjectAnalysis`, `DataQuality` | Readiness scoring, gap identification, multi-source contradiction audits |
| **Visualization** | `VisualizationService` + Directives | Handcrafted dynamic SVG components (`cs-radar`, `cs-intel-map`, `cs-network`) |
| **Reporting** | `ReportService` | High-fidelity executive printable dossiers and downloadable summaries |

---

## 📊 The 10 Specialized Views

| View | Purpose & Functionality |
|---|---|
| **1. Overview** | Profile hero, career readiness ring, fast intelligence metrics, and central radial map. |
| **2. Skill Intelligence** | Filterable skill matrix, competency levels, SVG radar chart, and target role gap table. |
| **3. Career Map** | Chronological career journey, transition milestones, and relationship network. |
| **4. Projects** | Project catalog, documentation strength ratings, skills utilized, and skill-link graphs. |
| **5. Learning** | Gap-driven learning roadmap prioritized by target career aspirations. |
| **6. Opportunities** | Match scoring against imported job descriptions (matched / partial / missing requirements). |
| **7. Evidence** | Comprehensive provenance audit trail showing source documents and confidence levels. |
| **8. Data Center** | File importer, JSON/XML inspector, re-parser, and demo dataset manager. |
| **9. Reports** | 5 printable executive career reports with live preview, print-to-PDF, and HTML export. |
| **10. Settings** | Theme toggle, target role selector, execution pipeline logs, and storage wipe. |

---

## 📁 Supported Data Formats

| Format | Supported Entities & Features |
|---|---|
| **XML** | Structured `<skill>`, `<project>`, `<certificate>`, `<education>`, `<experience>` nodes |
| **JSON** | Arrays or objects of profiles, skills, projects, employment history, target roles |
| **CSV** | Tabular matrices with column auto-detection (`skill,category,level,years`) |
| **TXT / Resume** | Unstructured resume text processed via regex and keyword entity matching |
| **Notes** | Freeform text entries stored as first-class verifiable sources |

---

## 🌐 Deployment Options

Configuration files are included for all major platforms:

- **GitHub Pages:** Pre-configured with [deploy.yml](.github/workflows/deploy.yml) and `.nojekyll`.
- **Vercel:** Configured via [vercel.json](vercel.json).
- **Netlify:** Configured via [netlify.toml](netlify.toml).
- **Docker / Containers:** Configured via [Dockerfile](Dockerfile) and [.dockerignore](.dockerignore).

---

## 🔒 Privacy & Security

- **Zero Network Transmission:** All data remains strictly inside browser memory and `localStorage`.
- **No Third-Party Scripts:** AngularJS and icons are vendored locally in `vendor/`.
- **Transparent Evidence:** No hallucinated or fabricated job criteria; analytics strictly reflect imported datasets.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — see the [LICENSE](LICENSE) file for details.

Developed with ❤️ by **[Vijay Mahes](https://github.com/vijaymahes9080)**.
