Die Methodik hat **zwei Funktionen gleichzeitig**, aber eine davon ist klar wichtiger.

Kurz gesagt:

**Primär:** Struktur für Menschen
**Sekundär:** Optimierung für LLM-Arbeit

Wenn man es sauber trennt, sieht es so aus:

---

# 1. Die Methodik ist zuerst für Menschen

Die Blöcke

```
VISION
CONTEXT
STRUCTURE
PLAN
TASKS
```

erzwingen eine **logische Denkstruktur**.

Ein Mensch wird automatisch gezwungen zu klären:

1. Was bauen wir?
2. In welchem Kontext?
3. Wie ist es aufgebaut?
4. Wie setzen wir es um?
5. Was sind konkrete Aufgaben?

Das Problem vieler Dokumente heute:

* Ideen
* Architektur
* Aufgaben
* Kontext

stehen **durcheinander**.

Die Methodik verhindert das.

---

# 2. Der zweite Effekt: LLMs verstehen das Dokument sofort

LLMs arbeiten stark mit **semantischen Mustern**.

Wenn ein Modell sieht:

```
VISION
...
PLAN
...
TASKS
```

versteht es automatisch:

* PLAN → Strategie
* TASKS → konkrete Arbeit
* VISION → Ziel

Das bedeutet:

Du musst weniger Prompt schreiben.

Beispiel ohne Struktur:

```
Here is my document. Please find the plan and generate tasks.
```

Beispiel mit Struktur:

```
Generate tasks from PLAN.
```

Das Dokument **ist bereits der Kontext**.

---

# 3. Der entscheidende Punkt

Die Methodik ist **nicht dafür da, dass LLMs das Dokument erstellen**.

Das wäre zu kurz gedacht.

Die Methodik ist dafür da, dass:

**Menschen und LLMs gemeinsam an einem strukturierten Dokument arbeiten können.**

Workflow:

```
Human writes VISION
↓
LLM suggests STRUCTURE
↓
Human edits
↓
LLM generates PLAN
↓
Human adjusts
↓
LLM generates TASKS
```

Das ist **Co-Creation**.

---

# 4. Warum das wichtig ist

Viele AI-Workflows scheitern heute, weil:

* Dokumente unstrukturiert sind
* Kontext fehlt
* Prompts ständig neu geschrieben werden

Dein Ansatz löst das, indem:

**die Struktur dauerhaft im Dokument steckt.**

---

# 5. Deshalb sind beide Teile wichtig

| Element  | Rolle        |
| -------- | ------------ |
| Methodik | Denkstruktur |
| Datei    | Container    |
| LLM      | Assistenz    |

Wenn du nur die Methodik hast → ist es nur eine Arbeitsweise.

Wenn du nur das Format hast → ist es nur eine Datei.

Wenn du **beides kombinierst**, entsteht ein **AI-native Workflow**.

---

# 6. Ein guter Vergleich

Stell dir vor:

* Markdown ist für Text
* Git ist für Code

Dein System wäre:

**für AI-strukturierte Arbeit.**

Ein Dokument, das **denken, planen und arbeiten verbindet**.

---

Eine Sache ist dabei extrem wichtig und viele Projekte übersehen das:

**Die Methodik muss so einfach sein, dass Menschen sie freiwillig nutzen.**

Wenn sie zu kompliziert wird, passiert:

* Menschen ignorieren sie
* LLM-Vorteil verschwindet

Deshalb sind **5 Blöcke wahrscheinlich optimal**.