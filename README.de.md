# AI Projects by Ilyas

Produktionsreife Web-Apps mit KI-Integration — gebaut mit Flask, Next.js und der Anthropic API.
Jedes Projekt ist live deployed, rate-limited und zeigt einen konkreten Anwendungsfall.
Drei Web-Apps die ich gebaut habe um zu zeigen, was mit der Anthropic API
in kurzer Zeit möglich ist — von der Idee bis live deployed.

Jedes Projekt löst ein echtes Problem, hat Rate-Limiting, läuft in Production
und wurde von einer Person gebaut: mir.

---

## Projekte

### 🟢 LehrerBrief — KI-Schreibassistent für Lehrkräfte
**[Live-Demo](https://lehrerbrief.onrender.com)** · [`02-textgenerator/`](./02-textgenerator)

Lehrkräfte generieren in Sekunden professionelle Briefe an Eltern, Schulleitung oder Kollegen — mit passendem Ton, Anrede und Grußformel. Der Text wird per Server-Sent Events live in die UI gestreamt.

| Stack | Details |
|-------|---------|
| Backend | Flask, Anthropic SDK, flask-limiter |
| Frontend | Vanilla JS/CSS, SSE Streaming |
| Modell | Claude Haiku (kosteneffizient, < €0.01 pro Brief) |
| Schutz | 5 Briefe/h · 20/d pro IP + Spending-Limit |

---

### 🟢 Mathewes Coffee & Deli — Gastro-Website mit KI-Assistent
**[Live-Demo](https://mathewes.onrender.com)** · [`01-chatbot/`](./01-chatbot)

Vollständige Landing-Page für einen Hamburger Gastro-Betrieb mit eingebettetem Chat-Assistenten. Claude erhält Öffnungszeiten, Preise und FAQs per Request direkt aus einer SQLite-DB — Änderungen wirken sofort ohne Redeploy.

| Stack | Details |
|-------|---------|
| Backend | Flask, Anthropic SDK, SQLite, flask-limiter |
| Frontend | Vanilla JS/CSS, GSAP, Lenis Smooth Scroll |
| Modell | Claude Haiku |
| Schutz | 10 Nachrichten/h · 40/d pro IP + Spending-Limit |

---

### 🟢 PostBlitz — LinkedIn-Posts auf Knopfdruck
**[Live-Demo](https://postblitz.onrender.com)** · [`03-postblitz/`](./03-postblitz)

Aus Rolle, Zielgruppe und einem Tagesthema generiert Claude drei fertige Post-Varianten — direkt zum Kopieren. Der Server ist zustandslos, das Nutzerprofil liegt im Browser.

| Stack | Details |
|-------|---------|
| Backend | Next.js API Routes, Anthropic SDK |
| Frontend | React 19, TypeScript, App Router |
| Modell | Claude Sonnet 4.6 |
| Schutz | 10 Anfragen/h · 30/d pro IP + Spending-Limit |

---

## Lokale Entwicklung

Voraussetzung: `ANTHROPIC_API_KEY` als Umgebungsvariable gesetzt.

```bash
# LehrerBrief (http://localhost:5001)
cd 02-textgenerator
pip install -r requirements.txt
python app.py

# Mathewes Chatbot (http://localhost:5000)
cd 01-chatbot
python setup_db.py   # SQLite-DB initialisieren
python app.py

# PostBlitz (http://localhost:3000)
cd 03-postblitz
npm install
npm run dev
```

> **Hinweis:** Alle drei Apps laufen auf Render Free Tier. Nach 15 Min Inaktivität schläft der Service — der erste Request kann ~30 Sekunden dauern.

---

## Über mich

Ich bin Ilyas — AI Developer aus Hamburg. Ich baue Web-Apps und LLM-Integrationen die schnell live gehen und echte Probleme lösen.
