Nachfolgend ist eine **vollständige Spezifikation v1** für das vorgeschlagene `.kdoc`-Format. Sie ist so formuliert, dass Entwickler sofort mit Implementierung beginnen können. Ziel ist ein **offener, AI-freundlicher Dokumentstandard**, der gleichzeitig einfach zu implementieren ist.

---

# KDOC Specification v1.0

## 1. Überblick

**KDOC** ist ein strukturiertes Dokumentformat für projektorientierte Inhalte.
Es kombiniert:

* menschenlesbaren Text
* semantische Projektstruktur
* maschinenlesbare Abschnitte
* Kompatibilität mit LLM-Workflows

Das Format basiert auf Klartext und orientiert sich syntaktisch an Markdown.

Primäre Ziele:

1. Standardisierte Projektstruktur
2. LLM-kompatible Dokumente
3. einfache Versionierung über Git
4. einfache Tool-Implementierung
5. Erweiterbarkeit

---

# 2. Grundprinzipien

KDOC folgt fünf Kernprinzipien.

### 2.1 Human First

Dokumente müssen ohne spezielle Software lesbar sein.

### 2.2 Structured Semantics

Jeder Abschnitt hat eine klar definierte Bedeutung.

### 2.3 AI Compatibility

Abschnitte sind so definiert, dass LLMs sie eindeutig interpretieren können.

### 2.4 Tool Simplicity

Parser sollen in wenigen hundert Zeilen implementierbar sein.

### 2.5 Extensibility

Das Format muss erweiterbar sein, ohne bestehende Dokumente zu brechen.

---

# 3. Dateiformat

### Dateiendung

```
.kdoc
```

Beispiel:

```
project.kdoc
```

---

# 4. Dokumentstruktur

Eine KDOC-Datei besteht aus drei Hauptteilen:

```
metadata
sections
assets (optional)
```

---

# 5. Metadata Block

Metadaten befinden sich am Anfang der Datei.

Format: YAML-ähnlicher Header.

```
---
title: AI Knowledge Platform
version: 1.0
author: Team Alpha
created: 2026-03-12
updated: 2026-03-12
tags:
  - ai
  - documentation
status: draft
---
```

---

## 5.1 Pflichtfelder

| Feld    | Beschreibung     |
| ------- | ---------------- |
| title   | Dokumenttitel    |
| version | Dokumentversion  |
| created | Erstellungsdatum |

---

## 5.2 optionale Felder

| Feld    | Beschreibung              |
| ------- | ------------------------- |
| author  | Autor                     |
| updated | letztes Update            |
| tags    | Liste von Tags            |
| status  | draft / active / archived |
| license | Dokumentlizenz            |

---

# 6. Standard Sections

KDOC definiert fünf Standardabschnitte.

```
VISION
CONTEXT
STRUCTURE
PLAN
TASKS
```

Diese werden als Markdown-Level-1-Header geschrieben.

Beispiel:

```
# VISION
...

# CONTEXT
...

# STRUCTURE
...

# PLAN
...

# TASKS
...
```

---

# 7. Section Semantics

## 7.1 VISION

Beschreibt das Ziel des Projekts.

Inhalt:

* Problem
* Ziel
* Nutzen
* Erfolgskriterien

Beispiel:

```
# VISION

Create a structured document system that allows
humans and AI to collaborate on project planning.
```

---

## 7.2 CONTEXT

Beschreibt Rahmenbedingungen.

Typische Inhalte:

* Zielgruppe
* technische Umgebung
* Constraints
* Marktumfeld

---

## 7.3 STRUCTURE

Beschreibt Aufbau der Lösung.

Beispiele:

Software:

* Systemarchitektur
* Module
* Datenmodell

Content-Projekt:

* Kapitelstruktur
* Themen

---

## 7.4 PLAN

Strategie und Roadmap.

Typische Inhalte:

* Phasen
* Meilensteine
* Releases

---

## 7.5 TASKS

Konkrete Arbeitseinheiten.

Standardformat:

```
- [ ] task description
- [x] completed task
```

---

# 8. Nested Sections

Unterabschnitte werden mit Markdown-Headern definiert.

```
# STRUCTURE

## System Architecture

### API Layer
...
```

---

# 9. Task Format

Tasks verwenden Markdown-Checkboxen.

```
- [ ] implement parser
- [ ] build editor
- [x] define document spec
```

Optional:

```
- [ ] implement parser
  owner: dev1
  priority: high
```

Parser dürfen diese Metadaten optional unterstützen.

---

# 10. Assets

Assets sind externe Dateien.

Ordnerstruktur:

```
project/
  project.kdoc
  assets/
     architecture.png
     diagram.svg
```

Referenz im Dokument:

```
![architecture](assets/architecture.png)
```

---

# 11. Document Model (Internal)

Parser sollen KDOC in ein internes Datenmodell überführen.

Minimalstruktur:

```
Document
 ├ metadata
 ├ sections[]
 └ assets[]
```

Section Model:

```
Section
 ├ name
 ├ content
 └ subsections[]
```

---

# 12. Parsing Rules

Parser müssen folgende Regeln beachten.

### 12.1 Section Detection

Sections beginnen mit:

```
# SECTION_NAME
```

SECTION_NAME muss:

* großgeschrieben sein
* ein gültiger Standardname sein

---

### 12.2 Unknown Sections

Unbekannte Sections sind erlaubt.

Parser sollen sie als **custom sections** behandeln.

---

# 13. Validation Rules

Ein gültiges KDOC Dokument:

muss enthalten:

```
VISION
CONTEXT
STRUCTURE
PLAN
TASKS
```

Optional können zusätzliche Sections existieren.

---

# 14. Versioning

KDOC nutzt semantische Versionierung.

```
major.minor
```

Beispiel:

```
1.0
```

Regeln:

| Änderung        | Version |
| --------------- | ------- |
| Breaking change | major   |
| Neue Features   | minor   |

---

# 15. AI Interaction Model

LLMs sollen Abschnitte gezielt verwenden können.

Beispiel:

Prompt:

```
Generate TASKS based on PLAN and STRUCTURE.
```

Kontext:

```
VISION
CONTEXT
STRUCTURE
PLAN
```

---

# 16. Rendering Targets

KDOC kann in mehrere Formate gerendert werden.

### Dokument

Standardleseansicht.

### Präsentation

Mapping:

| Section   | Slide        |
| --------- | ------------ |
| VISION    | Intro        |
| CONTEXT   | Problem      |
| STRUCTURE | Architecture |
| PLAN      | Roadmap      |
| TASKS     | Next Steps   |

---

### Website

Jede Section wird eine Seite.

Ähnliches Prinzip wie bei MkDocs oder Docusaurus.

---

# 17. Example Document

```
---
title: AI Knowledge Platform
version: 1.0
created: 2026-03-12
---

# VISION

Build a platform where developers can collaborate
on structured knowledge with AI.

# CONTEXT

Target users: developers and architects.

# STRUCTURE

## System

Editor
AI Service
Document Engine

# PLAN

Phase 1 Prototype
Phase 2 AI Integration

# TASKS

- [ ] implement parser
- [ ] build editor
- [ ] connect AI
```

---

# 18. Security Considerations

KDOC Dokumente können Code enthalten.

Tools sollten:

* keine Scripts automatisch ausführen
* Assets validieren
* externe Links prüfen

---

# 19. Future Extensions

Mögliche Erweiterungen:

```
DECISIONS
RISKS
METRICS
RESULTS
```

Diese bleiben optional.

---

# 20. Reference Tools

Editoren können Plugins entwickeln für:

* Visual Studio Code
* Obsidian

Versionierung über:

* Git

---

# 21. Compliance Level

Tools können unterschiedliche Supportlevels implementieren.

| Level    | Beschreibung        |
| -------- | ------------------- |
| Basic    | Lesen               |
| Standard | Parser + Validation |
| Advanced | AI Integration      |

---

# 22. Licensing

Die KDOC Spezifikation sollte als **offener Standard** veröffentlicht werden.

Empfohlen:

```
MIT
oder
Creative Commons
```

---

# Wichtig für euch als Team

Die **erste Implementierung sollte nur diese Teile enthalten**:

1. `.kdoc` Parser
2. Section Validation
3. VS Code Support
4. Basic Renderer

Alles andere kommt später.
