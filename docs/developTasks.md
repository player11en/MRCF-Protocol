Unten ist ein **komplettes Start-Backlog für 4 Entwickler**, strukturiert wie in einem echten Produktprojekt.
Es ist in **Epics → User Stories → Tasks** gegliedert, sodass ihr es direkt in Tools wie Jira, GitHub oder Linear übernehmen könnt.

Die Aufgaben sind bewusst so aufgeteilt, dass **jeder Entwickler einen klaren Verantwortungsbereich** hat:

* **Dev 1 – Core Format & Parser**
* **Dev 2 – Editor / VS Code Extension**
* **Dev 3 – AI Integration**
* **Dev 4 – Renderer & Views**

---

# Projekt: AI-Native Structured Document (.kdoc)

Ziel:

Ein Dokumentformat + Tooling entwickeln, das strukturierte Projektarbeit ermöglicht und optimal mit LLMs funktioniert.

Kernstruktur:

```
VISION
CONTEXT
STRUCTURE
PLAN
TASKS
```

---

# Gesamtarchitektur

Systemkomponenten:

```
.kdoc File
     ↓
Parser Engine
     ↓
Document Model
     ↓
Services
 ├ AI Assistant
 ├ Render Engine
 └ Editor Integration
```

Technologievorschlag:

| Bereich        | Technologie           |
| -------------- | --------------------- |
| Core Parser    | TypeScript / Node     |
| Editor         | VS Code Extension     |
| AI Integration | API Layer             |
| Renderer       | Static HTML Generator |
| Testing        | Jest / Playwright     |

Editorbasis:

Visual Studio Code

Versionierung:

Git

---

# DEVELOPER 1

# Core Format & Parser

Verantwortung:

* `.kdoc` Format
* Parser
* Dokumentmodell
* Validierung

---

# EPIC 1

KDOC Format Specification

### User Story

Als Entwickler möchte ich eine klare `.kdoc` Spezifikation, damit Tools das Dokument korrekt lesen können.

#### Tasks

* definieren der `.kdoc` Syntax
* definieren der Metadata Struktur
* definieren der Sections
* definieren der Asset Referenzen
* definieren der Versionierung

Deliverable:

```
kdoc-spec.md
```

---

# EPIC 2

Document Parser

### User Story

Als Tool möchte ich `.kdoc` Dateien in ein internes Datenmodell umwandeln können.

#### Tasks

* Parser Projekt erstellen
* Markdown Section Parser
* Metadata Parser
* Asset Resolver
* Error Handling
* Validation Rules

Output:

```
Document {
  metadata
  sections[]
}
```

---

# EPIC 3

Document Model

### User Story

Als Entwickler möchte ich eine strukturierte Repräsentation eines Dokuments.

#### Tasks

Model definieren:

```
Document
Section
ContentBlock
Task
Metadata
```

Implementierung:

* TypeScript Interfaces
* JSON Serialization
* Section Indexing

---

# EPIC 4

Validation Engine

### User Story

Als Nutzer möchte ich wissen, ob mein Dokument der Methodik entspricht.

Tasks:

* Pflichtsection prüfen
* Section Reihenfolge prüfen
* Syntaxprüfung
* Asset Existenz prüfen

---

# DEVELOPER 2

# VS Code Extension

Verantwortung:

Editor-Integration.

---

# EPIC 1

KDOC Editor Extension

### User Story

Als Nutzer möchte ich `.kdoc` Dateien komfortabel im Editor bearbeiten.

Tasks:

* VS Code Extension erstellen
* `.kdoc` File Recognition
* Syntax Highlighting
* Section Folding
* Outline View

---

# EPIC 2

Document Navigation

### User Story

Als Nutzer möchte ich schnell zwischen VISION, PLAN und TASKS navigieren.

Tasks:

* Sidebar Navigation
* Section Jump
* Section Status Indicator

---

# EPIC 3

Inline Task Management

### User Story

Als Nutzer möchte ich Tasks direkt im Dokument verwalten.

Tasks:

* Task Checkbox Parsing
* Task Progress Indicator
* Task Filter

---

# EPIC 4

AI Panel Integration

### User Story

Als Nutzer möchte ich AI auf einzelne Sections anwenden.

Tasks:

* AI Sidebar Panel
* Section Selection
* Prompt Builder

---

# DEVELOPER 3

# AI Integration

Verantwortung:

LLM Workflow.

---

# EPIC 1

AI Service Layer

### User Story

Als System möchte ich LLM APIs ansprechen können.

Tasks:

* API Client
* Prompt Templates
* Response Parser
* Rate Limiting

Provider kompatibel mit:

* OpenAI
* Anthropic
* Google

---

# EPIC 2

AI Document Analysis

### User Story

Als Nutzer möchte ich ein Dokument analysieren lassen.

Tasks:

* Context Builder
* Section Extraction
* Consistency Check

Outputs:

* Warnings
* Suggestions

---

# EPIC 3

AI Generation

### User Story

Als Nutzer möchte ich PLAN und TASKS automatisch generieren.

Features:

Generate PLAN from VISION.

Generate TASKS from PLAN.

Tasks:

* Prompt Engineering
* Output Structuring
* Section Injection

---

# EPIC 4

AI Diff & Safety

### User Story

Als Nutzer möchte ich AI Änderungen prüfen können.

Tasks:

* Diff View
* Accept/Reject Changes
* Section Versioning

---

# DEVELOPER 4

# Renderer & Views
* Single Source of Truth aus dem Document Model bereitstellen.
* Konsistente Section-Semantik (`VISION`, `CONTEXT`, `STRUCTURE`, `PLAN`, `TASKS`) in allen Ausgabeformaten erhalten.
* MVP-konforme Rendering-Pipeline für Phase 1 liefern, danach iterativ erweitern.

Technischer Fokus:

* Input: Parser Output (`Document { metadata, sections[], assets[] }`)
* Core: Render Pipeline + View Abstraction
* Output: HTML, Slides, Static Website, Exports

Abhängigkeiten:

* Dev 1 liefert stabiles Document Model + Validation.
* Dev 2 liefert Editor-Trigger/Commands für Render-Aktionen.
* Dev 3 liefert AI-generierte Inhalte, die renderer-kompatibel sein müssen.

Definition of Done (Dev 4, global):

* Jede View kann ein valides `.kdoc` ohne manuelle Nacharbeit rendern.
* Pflichtsections sind visuell konsistent und eindeutig erkennbar.
* Assets werden robust aufgelöst (inkl. Fehlerzustand/Fallback).
* Snapshot-/Golden-Tests für zentrale Render-Ausgaben sind vorhanden.

Verantwortung:

Mehrere Darstellungen aus `.kdoc`.

Renderer Foundation & HTML Document View

# EPIC 1

Document Renderer

### User Story

* Render-Core anlegen (Input: Document Model, Output: normalisierte Render Nodes)
* HTML Renderer implementieren (Server/CLI-fähig)
* Markdown-zu-HTML Transformation mit sicherer Sanitization
* Standard-Layout für Metadata + Pflichtsections entwerfen
* Section Anchors generieren (`#vision`, `#context`, ...)
* TOC (Table of Contents) aus Sections/Subsections erzeugen
* Asset Resolver anbinden (`assets/...`) inkl. Broken-Asset Placeholder
* Theme-Basis (light) + semantische CSS-Klassen für Sections
* Error Rendering (z. B. ungültige Struktur) als sichtbare Warnbox

Acceptance Criteria:

* Ein valides KDOC wird ohne Fehler zu einer vollständigen HTML-Seite gerendert.
* Reihenfolge der Pflichtsections bleibt erhalten.
* Markdown-Elemente (Listen, Tabellen, Codeblöcke, Links, Bilder) werden korrekt dargestellt.
* Fehlende Assets brechen den Build nicht, sondern werden als Warnung visualisiert.

Deliverables:

* `render-core` Modul
* `html-renderer` Modul
* Basis-CSS + Template
* Snapshot Tests für 3 Referenzdokumente

* HTML Renderer
* Markdown Transformation
* Section Styling

Presentation Generator (Slides View)

# EPIC 2

Presentation Generator

### User Story

Als Nutzer möchte ich aus meinem Dokument automatisch Slides erzeugen.

Mapping:

```
VISION → Intro Slides
CONTEXT → Problem Slides
STRUCTURE → Architecture Slides
PLAN → Roadmap
TASKS → Next Steps
```

Tasks:

* Slide Mapping Engine implementieren (Section → Slide Type)
* Slide Datenmodell definieren (`Slide`, `SlideDeck`, `SpeakerNotes`)
* Layout Templates für Intro, Problem, Architecture, Roadmap, Next Steps
* Regeln für Chunking langer Inhalte in mehrere Slides
* Auto-Titel + Subtitle-Generierung aus Section Content
* Speaker Notes aus Originaltext ableiten (optional)
* Export nach HTML-Slides (MVP) + JSON Deck Representation
* Bilder/Diagramme in Slides skalieren inkl. Fallback bei fehlenden Assets

Acceptance Criteria:

* Jede Pflichtsection erzeugt mindestens eine Slide.
* Lange PLAN/TASKS Inhalte werden in mehrere lesbare Slides aufgeteilt.
* Ein Standard-Theme wird konsistent auf alle Slides angewendet.
* Exportiertes Deck ist im Browser direkt präsentierbar.

Deliverables:

* `slides-generator` Modul
* Standard-Slide-Templates
* Beispiel-Deck aus `example.kdoc`

---

# EPIC 3

Static Website Generator (Docs Site)

### User Story

Als Nutzer möchte ich eine Dokumentationsseite generieren.

Tasks:

* Site-Build Pipeline implementieren (single command build)
* Routing Engine pro Section + optional pro Subsection
* Navigation Builder (Sidebar + Prev/Next)
* Landing Page aus Metadata + VISION Summary erzeugen
* Search Index (client-side, JSON) aus Sections/Subsections aufbauen
* Canonical URLs und Dateinamen-Konvention definieren
* Cross-linking zwischen PLAN und TASKS automatisieren
* Error Page + 404 für statische Ausgabe bereitstellen
* Basis SEO Metadaten (title, description) pro Seite setzen

Ähnlich wie:

* MkDocs
* Docusaurus

Acceptance Criteria:

* Aus einem KDOC entsteht eine navigierbare statische Website.
* Alle Pflichtsections sind als eigene Seiten erreichbar.
* Suchindex findet Begriffe aus Titel und Inhalt.
* Build ist reproduzierbar und CI-fähig.

Deliverables:

* `site-generator` Modul
* Build Command (`kdoc build-site` oder äquivalent)
* Beispielausgabe in `dist/site`

---

# EPIC 4

Export System & Packaging

### User Story

Als Nutzer möchte ich mein Dokument exportieren.

Exports:

* PDF
* HTML
* Slides

Tasks:

* Export Orchestrator bauen (einheitliche API für alle Exportziele)
* PDF Export aus HTML View (print CSS + pagination rules)
* Single-file HTML Export (embedded CSS, optional embedded assets)
* Slides Export (HTML deck + optional PDF Handout)
* Output Packaging als ZIP (inkl. assets, manifest)
* Export Manifest erstellen (version, timestamp, source hash)
* Fehler- und Warnmodell für Exporte standardisieren
* CLI-Befehle für `export html|pdf|slides|all`

Acceptance Criteria:

* Alle drei Exportziele laufen über denselben Orchestrator.
* Export enthält nachvollziehbare Metadaten (Manifest).
* PDF ist druckbar und visuell konsistent mit HTML Grundlayout.
* Fehler werden verständlich ausgegeben und beenden den Prozess kontrolliert.

Deliverables:

* `export-service` Modul
* CLI Export Commands
* Golden Files für Export-Regressionstests

---

# EPIC 5

Rendering Quality, Accessibility & Security

### User Story

Als Nutzer möchte ich, dass gerenderte Ausgaben robust, barrierearm und sicher sind.

Tasks:

* HTML Sanitization Policy definieren und implementieren
* XSS-relevante Inhalte in Markdown/Links/Bildern absichern
* Accessibility Basis umsetzen (Semantik, Kontrast, Headings, Alt-Texte)
* Keyboard-Navigation für Website/Slides sicherstellen
* Performance Budget für große Dokumente definieren (z. B. 500+ Tasks)
* Rendering Benchmarks + Profiling für große Dateien
* Fallback-Verhalten für unbekannte/custom Sections spezifizieren

Acceptance Criteria:

* Kein ungefiltertes Script-Rendering aus KDOC-Inhalten.
* Lighthouse/A11y Basiswerte für statische Seiten werden erreicht.
* Rendering bleibt innerhalb definierter Zeitgrenzen für große Dateien.
* Custom Sections werden stabil und ohne Layout-Bruch angezeigt.

Deliverables:

* Security Guidelines für Renderer
* A11y Checklist + Testergebnisse
* Benchmark Report

---

# EPIC 6

Test Automation & CI for Renderer Stack

### User Story

Als Team möchte ich Rendering-Änderungen sicher deployen können, ohne bestehende Views zu brechen.

Tasks:

* Unit Tests für Mapping-, Routing- und Exportlogik schreiben
* Snapshot-/Golden-Tests für HTML, Slides und Site-Ausgabe
* Integrationstests Parser→Renderer mit Referenz-KDOCs
* Visual Regression Tests für zentrale Templates einführen
* CI Pipeline mit Testmatrix (Node Versionen, OS optional) aufsetzen
* Release Checks (build + tests + sample export) automatisieren

Acceptance Criteria:

* Jeder Merge triggert automatische Renderer-Tests.
* Breaking UI/Output Änderungen werden via Regression Tests erkannt.
* Referenz-KDOCs decken Pflichtsections + Nested + Custom + Asset-Fehler ab.

Deliverables:

* CI Workflow für Renderer-Pakete
* Test Fixtures (`/fixtures/kdoc`)
* Dokumentierte Release-Checkliste

---

# TESTING

Teststrategie:

---

### Unit Tests

Testen:

* Parser
* Section Detection
* Metadata Parsing

Tools:

* Jest

---

### Integration Tests

Testen:

* Parser + AI
* Renderer + Document

---

### End-to-End Tests

Testen:

Workflow:

```
create doc
edit doc
generate plan
render website
export pdf
```

Tools:

* Playwright

---

# RELEASE PLAN

Phase 1
Prototype

Deliverables:

* `.kdoc` Spec
* Parser
* Basic Renderer

---

Phase 2
Editor

Deliverables:

* VS Code Extension
* Document Navigation

---

Phase 3
AI

Deliverables:

* Plan Generation
* Task Generation

---

Phase 4
Public Release

Deliverables:

* Docs Website
* Example Projects
* Templates

---

# MVP Ziel

Nach ca. **8–10 Wochen** sollte möglich sein:

* `.kdoc` Dokument erstellen
* im Editor bearbeiten
* PLAN automatisch generieren
* TASKS automatisch generieren
* Dokument rendern

---

# Wichtigster nächster Schritt

Bevor Entwicklung startet, sollte ein Dokument entstehen:

```
kdoc-spec-v1.md
```

Das verhindert **90 % aller späteren Architekturprobleme**.

