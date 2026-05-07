# AI Projects by Ilyas

Production-ready web applications integrated with AI, built using Flask, Next.js, and the Anthropic API. Each project demonstrates a specific use case, featuring live streaming, rate-limiting, and real-world utility.

---

## Setup Instructions

### Prerequisites
- Python 3.x
- Node.js & npm
- `ANTHROPIC_API_KEY` set as an environment variable.

### Project-Specific Setup

#### 01-chatbot (Mathewes Coffee & Deli)
1. Navigate to the directory: `cd 01-chatbot`
2. Install dependencies: `pip install -r requirements.txt`
3. Initialize the database: `python setup_db.py`
4. Run the app: `python app.py` (Default port: 5000)

#### 02-textgenerator (LehrerBrief)
1. Navigate to the directory: `cd 02-textgenerator`
2. Install dependencies: `pip install -r requirements.txt`
3. Run the app: `python app.py` (Default port: 5001)

#### 03-postblitz (PostBlitz)
1. Navigate to the directory: `cd 03-postblitz`
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev` (Default port: 3000)

---

## Tasks

### 🟢 Mathewes Coffee & Deli — Gastro Website with AI Assistant
**Directory:** [`01-chatbot/`](./01-chatbot)

A full landing page for a Hamburg-based catering business featuring an embedded chat assistant. Claude retrieves opening hours, prices, and FAQs directly from a SQLite database.

- **Stack:** Flask, Anthropic SDK, SQLite, flask-limiter, GSAP, Lenis Smooth Scroll
- **Model:** Claude Haiku

### 🟢 LehrerBrief — AI Writing Assistant for Teachers
**Directory:** [`02-textgenerator/`](./02-textgenerator)

Enables teachers to generate professional letters to parents, administration, or colleagues in seconds. Features live text streaming via Server-Sent Events.

- **Stack:** Flask, Anthropic SDK, flask-limiter, Vanilla JS/CSS
- **Model:** Claude Haiku

### 🟢 PostBlitz — LinkedIn Posts at the Touch of a Button
**Directory:** [`03-postblitz/`](./03-postblitz)

Generates three LinkedIn post variants based on user role, target audience, and topic. Fully stateless on the server with user profiles stored locally in the browser.

- **Stack:** Next.js, React 19, TypeScript, Anthropic SDK
- **Model:** Claude Sonnet 4.6

---

## About
Built by Ilyas, an AI Developer based in Hamburg, focused on creating fast-to-deploy LLM integrations that solve real problems.

---

[Deutsche Version (German Version)](./README.de.md)
