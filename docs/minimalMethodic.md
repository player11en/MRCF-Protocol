Minimal-Methodik + Document


## 1. Technisches `.kdoc`-Dateiformat

Das Format sollte drei Anforderungen erfüllen:

1. **für Menschen lesbar**
2. **für LLMs eindeutig strukturiert**
3. **für Tools leicht zu parsen**

Deshalb ist die sinnvollste Basis **Plain-Text mit strukturierter Semantik**, ähnlich wie bei Markdown.

### Grundprinzip

Eine `.kdoc` Datei besteht aus:

1. **Metadata**
2. **Sections**
3. **Assets**

---

# Struktur einer `.kdoc` Datei

Minimaler Aufbau:

```id="p4snw2"
---
title: AI Knowledge Platform
version: 0.1
author: Team Alpha
created: 2026-03-12
---

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

Das ist absichtlich **extrem simpel**.

Vorteile:

* LLM erkennt Abschnitte sofort
* Parser ist trivial
* funktioniert direkt in Editoren wie Visual Studio Code

---

# Erweiterbare Struktur

Fortgeschrittene `.kdoc` Dateien können Module enthalten.

```id="sxygqg"
---
title: AI Knowledge Platform
version: 0.2
tags: ai, platform
---

# VISION
...

# CONTEXT
...

# STRUCTURE
...

## System Architecture
...

## Data Model
...

# PLAN
...

# TASKS

- [ ] build parser
- [ ] implement editor
- [ ] integrate AI
```

Die **Hierarchie** ist absichtlich Markdown-kompatibel.

---

# Assets (Bilder, Diagramme)

Zwei Möglichkeiten:

### Variante A – Ordnerstruktur

```id="k8cwhb"
project.kdoc
assets/
  diagram1.png
  architecture.svg
```

Referenz im Dokument:

```id="1qye1y"
![architecture](assets/architecture.svg)
```

---

### Variante B – Container (ZIP)

```id="id5ls0"
project.kdoc
```

intern:

```id="sqxqgr"
document.kdoc
assets/
```

Das erlaubt:

* einfache Weitergabe
* Git-Versionierung nach Entpacken

---

# Maschinell lesbare Semantik

Ein Parser erkennt:

```id="5tqntd"
Section:
VISION

Content:
text block
```

Intern kann das z. B. so dargestellt werden:

```id="dpg0y6"
{
  "section": "VISION",
  "content": "Build a platform..."
}
```

Damit können Tools automatisch:

* Aufgaben extrahieren
* Architektur analysieren
* Plan erweitern

---

# Vergleich zu bestehenden Formaten

| Format   | Problem                          |
| -------- | -------------------------------- |
| PDF      | kaum maschinell interpretierbar  |
| DOCX     | komplexes XML                    |
| Markdown | keine semantischen Projektblöcke |

`.kdoc` kombiniert:

* Lesbarkeit
* Struktur
* AI-Kompatibilität

---

# 3. Automatische Views (Docs, Slides, Websites)

Der zweite große Vorteil deines Systems:

**Ein Dokument → mehrere Darstellungen**

---

# Konzept: Render Engine

Eine Engine liest `.kdoc` und erzeugt verschiedene Ansichten.

Beispiel Pipeline:

```id="46s7gw"
.kdoc
 ↓
Parser
 ↓
Document Model
 ↓
Renderer
 ↓
Views
```

---

# View 1 – Dokument

klassische Darstellung.

```id="mdng1f"
VISION
Text

CONTEXT
Text

STRUCTURE
Text
```

Ideal für:

* Spezifikation
* Dokumentation
* Wissensbasis

---

# View 2 – Präsentation

Slides werden automatisch generiert.

Mapping:

| Section   | Slide            |
| --------- | ---------------- |
| VISION    | Problem + Ziel   |
| CONTEXT   | Markt / Nutzer   |
| STRUCTURE | Architektur      |
| PLAN      | Roadmap          |
| TASKS     | nächste Schritte |

Beispiel Slide:

```id="0vcr3u"
Slide 1
AI Knowledge Platform

Slide 2
Problem
Developers struggle to maintain structured knowledge.

Slide 3
Solution
AI-assisted knowledge documents.
```

---

# View 3 – Projektübersicht

Nur operative Inhalte:

```id="nfwujf"
PLAN
TASKS
```

Das wird praktisch ein leichtes Projektmanagement-Board.

---

# View 4 – Website

Der Renderer erzeugt statische Seiten ähnlich wie bei Docusaurus oder MkDocs.

Beispiel Struktur:

```id="7qnyfd"
/
vision
context
architecture
plan
tasks
```

Ideal für:

* Projektseiten
* Produktdokumentation
* Wissensplattformen

---

# View 5 – AI Workspace

Spezielle Ansicht für LLM-Interaktion.

Beispiel:

```
Ask AI about this section
[ STRUCTURE ]
```

AI kann dann:

* PLAN erweitern
* TASKS generieren
* Inkonsistenzen finden

---

# Warum dieses Konzept stark ist

Du kombinierst:

### 1. Struktur

klare Projektsemantik

### 2. Format

leichtes, universelles Dokument

### 3. Rendering

mehrere Ansichten aus einer Quelle

---

Das entspricht der Idee von **Single Source of Truth**.

Ein ähnliches Prinzip nutzen Systeme wie:

* LaTeX
* Notion
* Obsidian

Aber **keines davon ist explizit für LLM-Workflows gebaut**.

---

## Eine strategisch sehr wichtige Frage

Die entscheidet später über Erfolg oder Scheitern deines Projekts:

**Soll `.kdoc`**

A) ein **offener Standard** werden
oder
B) ein **Produktformat einer Plattform**

Das hat enorme Auswirkungen auf:

* Adoption
* Ecosystem
* Business Model