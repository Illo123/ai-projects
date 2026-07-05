import { FOLD_LIMIT, LINKEDIN_LIMIT, hookLength } from "@/lib/prompt";

export type Ampel = "gruen" | "gelb" | "rot";

export type CheckState = "ok" | "warn" | "bad";

export type ScoreCheck = { label: string; state: CheckState; hint: string };

export type PostScore = {
  score: number; // 0..100
  level: Ampel;
  label: string; // Stark | Okay | Schwach
  checks: ScoreCheck[];
};

// Floskel-Opener, die einen Hook schwach machen.
const WEAK_OPENERS = [
  "heute möchte",
  "heute will",
  "ich möchte euch",
  "ich möchte mit euch",
  "ich freue mich",
  "ich freue mich sehr",
  "in diesem post",
  "in diesem beitrag",
  "wie ihr wisst",
  "wie ihr alle wisst",
  "ich bin stolz",
  "ich bin froh",
  "es ist mir eine",
];

// Bewertet einen fertigen Post-Text nach LinkedIn-Best-Practices (0–100).
export function scorePost(raw: string): PostScore {
  const text = raw.trim();
  const chars = text.length;
  const hook = hookLength(text);
  const firstLine = text.split("\n")[0].trim().toLowerCase();
  const hashtags = (text.match(/#[\wäöüÄÖÜß]+/g) ?? []).length;
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const longestPara = paragraphs.reduce((m, p) => Math.max(m, p.length), 0);
  const hasQuestion = /\?/.test(text);
  const hasLink = /(https?:\/\/|www\.)/i.test(text);

  const checks: ScoreCheck[] = [];
  let score = 0;

  // 1) Hook-Länge (20)
  if (hook >= 20 && hook <= 150) {
    score += 20;
    checks.push({ label: "Knackiger Hook", state: "ok", hint: `Erste Zeile ${hook} Zeichen` });
  } else if (hook > 0 && hook <= FOLD_LIMIT) {
    score += 10;
    checks.push({ label: "Hook grenzwertig lang", state: "warn", hint: `Erste Zeile ${hook} Zeichen — kürzer zieht besser` });
  } else {
    checks.push({ label: "Hook zu lang", state: "bad", hint: `Erste Zeile ${hook} Zeichen — über der 210-Faltung` });
  }

  // 2) Starker Aufhänger (18)
  const weak = WEAK_OPENERS.find((w) => firstLine.startsWith(w));
  if (!weak) {
    score += 18;
    checks.push({ label: "Starker Einstieg", state: "ok", hint: "Kein Floskel-Opener" });
  } else {
    checks.push({ label: "Schwacher Opener", state: "bad", hint: `Beginnt mit „${weak}…"` });
  }

  // 3) Lesbarkeit / Absätze (18)
  if (paragraphs.length >= 3 && longestPara <= 320) {
    score += 18;
    checks.push({ label: "Gut portioniert", state: "ok", hint: `${paragraphs.length} Absätze, mobil lesbar` });
  } else if (paragraphs.length >= 2 && longestPara <= 480) {
    score += 10;
    checks.push({ label: "Okay portioniert", state: "warn", hint: "Mehr Absätze/Leerzeilen helfen" });
  } else {
    checks.push({ label: "Textwand", state: "bad", hint: "Zu wenige Absätze — mobil schwer lesbar" });
  }

  // 4) Gesamtlänge (14)
  if (chars >= 350 && chars <= 1600) {
    score += 14;
    checks.push({ label: "Ideale Länge", state: "ok", hint: `${chars} Zeichen` });
  } else if (chars < 350) {
    score += 6;
    checks.push({ label: "Etwas kurz", state: "warn", hint: `${chars} Zeichen — mehr Substanz möglich` });
  } else if (chars <= LINKEDIN_LIMIT) {
    score += 8;
    checks.push({ label: "Recht lang", state: "warn", hint: `${chars} Zeichen` });
  } else {
    checks.push({ label: "Über 3.000 Zeichen", state: "bad", hint: "Über dem LinkedIn-Limit" });
  }

  // 5) Hashtags (15)
  if (hashtags >= 3 && hashtags <= 5) {
    score += 15;
    checks.push({ label: "3–5 Hashtags", state: "ok", hint: `${hashtags} Hashtags` });
  } else if (hashtags >= 1) {
    score += 8;
    checks.push({ label: "Hashtags justieren", state: "warn", hint: `${hashtags} — ideal sind 3–5` });
  } else {
    checks.push({ label: "Keine Hashtags", state: "bad", hint: "3–5 relevante ergänzen" });
  }

  // 6) CTA / Frage (15)
  if (hasQuestion) {
    score += 15;
    checks.push({ label: "Frage/CTA vorhanden", state: "ok", hint: "Lädt zu Kommentaren ein" });
  } else {
    checks.push({ label: "Kein Gesprächsanstoß", state: "bad", hint: "Frage am Ende bringt Kommentare" });
  }

  // Penalty: externer Link im Text
  if (hasLink) {
    score -= 20;
    checks.push({ label: "Externer Link im Text", state: "bad", hint: "Link besser in den ersten Kommentar" });
  }

  score = Math.max(0, Math.min(100, score));

  let level: Ampel;
  let label: string;
  if (score >= 75) {
    level = "gruen";
    label = "Stark";
  } else if (score >= 50) {
    level = "gelb";
    label = "Okay";
  } else {
    level = "rot";
    label = "Schwach";
  }

  return { score, level, label, checks };
}
