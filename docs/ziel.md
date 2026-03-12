Idee aus drei klar getrennten Ebenen:

1. **Dateiformat**
2. **Methodik (Struktur)**
3. **LLM-Workflow**

Erst **die Kombination dieser drei Dinge** macht das System besonders.

---

# 1. Ziel des Formats

Das Ziel ist nicht nur ein neues Dokumentformat zu bauen.

Das Ziel ist:

**Ein Dokument zu schaffen, das gleichzeitig**

* für Menschen gut lesbar ist
* für LLMs eindeutig strukturierbar ist
* für Tools automatisierbar ist

Also im Grunde ein **semantisches Dokument**.

Ein normales PDF oder DOCX enthält zwar Text, aber keine klare Bedeutung für AI.

Dein Ansatz wäre eher:

```
VISION
CONTEXT
ARCHITECTURE
PLAN
TASKS
RESULTS
```

Ein LLM erkennt dadurch sofort:

* was Idee ist
* was Planung ist
* was konkrete Arbeit ist

Das reduziert massiv **Prompt Engineering**.

---

# 2. Rolle der Methodik

Die Methodik ist der **eigentliche Kern**.

Das Format ist nur der Container.

Die Methodik sorgt dafür, dass:

1. Nutzer strukturierter denken
2. LLMs automatisch weiterarbeiten können

Beispiel:

User schreibt nur:

```
VISION
Build a platform for community learning.

CONTEXT
Target audience: developers and students.
```

Dann kann ein LLM automatisch:

* eine **ARCHITECTURE** generieren
* daraus einen **PLAN**
* daraus **TASKS**

Ohne dass der Nutzer komplizierte Prompts schreiben muss.

Die Struktur selbst ist der Prompt.

---

# 3. Warum das mit generellen LLMs funktioniert

Du willst bewusst **kein proprietäres AI-System**.

Stattdessen soll jedes große Modell damit arbeiten können:

* OpenAI Modelle
* Anthropic Modelle
* Google Modelle
* Meta Modelle

Warum?

Weil die Struktur extrem einfach ist:

```
SECTION: TEXT
SECTION: TEXT
SECTION: TEXT
```

LLMs sind sehr gut darin, solche **semantischen Abschnitte zu erkennen**.

Du brauchst also **keine spezielle KI**.

---

# 4. Warum das mehr ist als nur ein Dokument

Wenn du es richtig aufziehst, wird es eigentlich ein:

**AI-native Knowledge Container**

Der Unterschied zu klassischen Formaten:

| Klassisches Dokument | Dein Konzept           |
| -------------------- | ---------------------- |
| Text                 | strukturierte Semantik |
| passiv               | AI-interaktiv          |
| nur lesen            | weiterentwickeln       |
| statisch             | iterativ               |

Das Dokument wird damit **Teil des Workflows**.

---

# 5. Warum das auch außerhalb von Software funktioniert

Das ist einer der stärksten Punkte deiner Idee.

Die Struktur kann für viele Bereiche funktionieren.

### Software

```
VISION
CONTEXT
ARCHITECTURE
PLAN
TASKS
```

### Buch schreiben

```
VISION
CONTEXT
STRUCTURE
PLAN
CHAPTER TASKS
```

### Forschung

```
VISION
CONTEXT
HYPOTHESIS
METHODOLOGY
EXPERIMENTS
RESULTS
```

Die Grundlogik bleibt identisch.

---

# 6. Warum diese Kombination skalierbar ist

Du erschaffst eigentlich drei Ebenen:

### Ebene 1 — Format

Container

Beispiel:

```
.kdoc
.kplan
.aidoc
```

---

### Ebene 2 — Methodik

Die Struktur

Minimal:

```
VISION
CONTEXT
STRUCTURE
PLAN
TASKS
```

---

### Ebene 3 — Tools

Editoren, Plugins, AI Assistants.

Zum Beispiel:

* Plugin für Visual Studio Code
* Plugin für Obsidian
* Git Integration über Git

---

# 7. Der wichtigste Designgrundsatz

Damit das funktioniert, muss die Methodik **extrem leicht** bleiben.

Wenn sie zu komplex wird:

* Menschen nutzen sie nicht
* LLMs werden unpräziser

Optimal wäre:

```
VISION
CONTEXT
STRUCTURE
PLAN
TASKS
```

Maximal **5 Blöcke**.

---

# 8. Das eigentliche Ziel

Nicht:

„Ein neues Dokumentformat.“

Sondern:

**Der Standard für AI-verständliche Projekte.**

So etwas wie:

* Markdown für Text
* Git für Code
* aber **für AI-strukturierte Arbeit**

---

✅ **Deine Hypothese ist also korrekt:**

> Eine einfache Struktur + ein standardisiertes Dokumentformat ermöglicht es generellen LLMs, automatisch weiterzuarbeiten.
