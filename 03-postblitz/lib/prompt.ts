export type Profile = {
  name: string;
  rolle: string;
  zielgruppe: string;
  tonalitaet: string;
};

export type PostFormat =
  | "auto"
  | "story"
  | "insight"
  | "howto"
  | "announcement"
  | "question";

export type PostStil =
  | "auto"
  | "inspirierend"
  | "kontrovers"
  | "storytelling"
  | "experte"
  | "locker";

export type EmojiDichte = "keine" | "dezent" | "viele";
export type Sprache = "de" | "en";

export type GenerateOptions = {
  format: PostFormat;
  stil: PostStil;
  emoji: EmojiDichte;
  sprache: Sprache;
  cta: boolean;
};

export const DEFAULT_OPTIONS: GenerateOptions = {
  format: "auto",
  stil: "auto",
  emoji: "dezent",
  sprache: "de",
  cta: true,
};

export type GenerateInput = {
  profile: Profile;
  thema: string;
  options?: Partial<GenerateOptions>;
};

// LinkedIn blendet den Feed-Text nach ~210 Zeichen hinter "…mehr" ein,
// die harte Obergrenze eines Posts liegt bei 3.000 Zeichen.
export const FOLD_LIMIT = 210;
export const LINKEDIN_LIMIT = 3000;

type Meta = { label: string; hint: string; instruction: string };

export const POST_FORMATS: Record<PostFormat, Meta> = {
  auto: {
    label: "Automatisch",
    hint: "Claude wählt das passende Format",
    instruction: "Wähle selbst das wirkungsvollste Format für das Thema.",
  },
  story: {
    label: "Story",
    hint: "Persönliche Anekdote mit Learning",
    instruction:
      "Erzähle eine kurze, persönliche Anekdote, die in einer konkreten Erkenntnis mündet.",
  },
  insight: {
    label: "Insight",
    hint: "Eine steile These, klar begründet",
    instruction:
      "Formuliere eine steile, aber begründete These und untermauere sie in zwei bis drei Punkten.",
  },
  howto: {
    label: "How-to",
    hint: "Konkrete Schritte zum Nachmachen",
    instruction:
      "Gib eine kompakte, umsetzbare Schritt-für-Schritt-Anleitung mit einer kurzen Liste.",
  },
  announcement: {
    label: "Ankündigung",
    hint: "Launch, Meilenstein, News",
    instruction:
      "Verkünde die Neuigkeit mit echter Begeisterung, ohne in Marketing-Floskeln zu kippen.",
  },
  question: {
    label: "Frage",
    hint: "Startet eine Diskussion",
    instruction:
      "Baue den Post um eine offene Frage herum, die zur Diskussion in den Kommentaren einlädt.",
  },
};

export const STIL_PRESETS: Record<PostStil, Meta> = {
  auto: {
    label: "Automatisch",
    hint: "Stil passend zum Thema",
    instruction: "Wähle den passenden Stil für Thema und Zielgruppe.",
  },
  inspirierend: {
    label: "Inspirierend",
    hint: "motivierend, positiv",
    instruction:
      "Schreibe inspirierend und motivierend, mit einer positiven, aufbauenden Note.",
  },
  kontrovers: {
    label: "Kontrovers",
    hint: "steile Meinung, Debatte",
    instruction:
      "Nimm eine klare, leicht provokante Haltung ein, die zum Widerspruch reizt — pointiert, aber niemals beleidigend.",
  },
  storytelling: {
    label: "Storytelling",
    hint: "Erzählung mit Spannungsbogen",
    instruction:
      "Nutze eine erzählerische Struktur mit Szene, Wendepunkt und Auflösung.",
  },
  experte: {
    label: "Experte",
    hint: "fundiert, Fachautorität",
    instruction:
      "Schreibe fundiert und fachlich präzise, wie eine anerkannte Autorität — konkret, mit Substanz statt Buzzwords.",
  },
  locker: {
    label: "Locker",
    hint: "nahbar, Umgangston",
    instruction:
      "Schreibe locker und nahbar, wie im Gespräch, gerne mit einer Prise Humor.",
  },
};

const EMOJI_INSTRUCTION: Record<EmojiDichte, string> = {
  keine: "Verwende keine Emojis.",
  dezent:
    "Setze Emojis nur sehr dezent als vereinzelte visuelle Anker ein (wenige, gezielt).",
  viele:
    "Nutze Emojis großzügig zur Auflockerung und als visuelle Anker vor Absätzen.",
};

export function buildSystemPrompt(
  profile: Profile,
  options?: Partial<GenerateOptions>,
): string {
  const o = { ...DEFAULT_OPTIONS, ...options };
  const fmt = POST_FORMATS[o.format] ?? POST_FORMATS.auto;
  const stil = STIL_PRESETS[o.stil] ?? STIL_PRESETS.auto;
  const emoji = EMOJI_INSTRUCTION[o.emoji] ?? EMOJI_INSTRUCTION.dezent;

  const spracheZeile =
    o.sprache === "en"
      ? "Sprache: Schreibe den gesamten Post inklusive Hashtags auf Englisch."
      : "Sprache: Schreibe den gesamten Post auf Deutsch.";

  const ctaZeile = o.cta
    ? "Beende jeden Post mit einer offenen Frage oder einem klaren Call-to-Action, der zum Kommentieren einlädt."
    : "Verzichte auf einen aufgesetzten Call-to-Action am Ende.";

  return `Du schreibst LinkedIn-Posts für eine reale Person.

Profil:
- Name: ${profile.name || "(nicht angegeben)"}
- Rolle: ${profile.rolle || "(nicht angegeben)"}
- Zielgruppe: ${profile.zielgruppe || "(nicht angegeben)"}
- Grundtonalität: ${profile.tonalitaet || "professionell, aber nahbar"}

Format: ${fmt.label} — ${fmt.instruction}
Stil: ${stil.label} — ${stil.instruction}
${spracheZeile}
Emojis: ${emoji}
${ctaZeile}

Regeln:
- Die ersten ~210 Zeichen sind der Hook — danach kürzt LinkedIn mit "…mehr". Mach die erste Zeile so stark, dass man weiterlesen MUSS.
- Erster Satz ist der Aufhänger — kein "Heute möchte ich...", kein "Ich freue mich..."
- Kurze Absätze (max. 2 Sätze), großzügige Leerzeilen — der Post wird vor allem mobil gelesen.
- Kein Corporate-Sprech, keine leeren Buzzwords.
- Keine externen Links im Text (die drücken die Reichweite).
- 3-5 relevante Hashtags am Ende, keine mehr.
- Jede Variante 80-140 Wörter, deutlich unter dem 3.000-Zeichen-Limit.
- Gib genau zwei klar unterschiedliche Varianten zurück, getrennt durch eine Zeile mit ---
- Keine Einleitung, keine Nummerierung, keine Überschriften außerhalb der Varianten.`;
}

export function buildUserPrompt(thema: string): string {
  return `Thema/Anlass des heutigen Posts:\n\n${thema}`;
}

export function splitVariants(text: string): string[] {
  return text
    .split(/\n-{3,}\n/)
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 2);
}

// Teilt den Text an der "…mehr"-Faltgrenze, ohne ein Wort zu zerschneiden.
export function foldSplit(
  text: string,
  limit = FOLD_LIMIT,
): { head: string; tail: string } {
  if (text.length <= limit) return { head: text, tail: "" };
  const window = text.slice(0, limit);
  const brk = Math.max(window.lastIndexOf(" "), window.lastIndexOf("\n"));
  const cut = brk > limit * 0.5 ? brk : limit;
  return { head: text.slice(0, cut), tail: text.slice(cut) };
}

export function hookLength(text: string): number {
  return text.split("\n")[0].trim().length;
}
