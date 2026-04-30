export type Profile = {
  name: string;
  rolle: string;
  zielgruppe: string;
  tonalitaet: string;
};

export type GenerateInput = {
  profile: Profile;
  thema: string;
};

export function buildSystemPrompt(profile: Profile): string {
  return `Du schreibst LinkedIn-Posts auf Deutsch für eine reale Person.

Profil:
- Name: ${profile.name}
- Rolle: ${profile.rolle}
- Zielgruppe: ${profile.zielgruppe}
- Tonalität: ${profile.tonalitaet}

Regeln:
- Erster Satz ist ein Hook — kein "Heute möchte ich...", kein "Ich freue mich..."
- Kurze Absätze, max. 2 Sätze pro Absatz
- Kein Corporate-Sprech
- 3-5 relevante Hashtags am Ende, keine mehr
- Jede Variante 80-120 Wörter
- Gib genau drei Varianten zurück, getrennt durch eine Zeile mit ---
- Keine Einleitung, keine Nummerierung außerhalb der Varianten`;
}

export function buildUserPrompt(thema: string): string {
  return `Thema/Anlass des heutigen Posts:\n\n${thema}`;
}

export function splitVariants(text: string): string[] {
  return text
    .split(/\n-{3,}\n/)
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, 3);
}
