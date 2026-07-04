"use client";

import { useState } from "react";
import ProfileForm from "@/components/ProfileForm";
import PostInput from "@/components/PostInput";
import PostOutput from "@/components/PostOutput";
import {
  DEFAULT_OPTIONS,
  splitVariants,
  type GenerateOptions,
  type Profile,
} from "@/lib/prompt";

export default function Page() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [thema, setThema] = useState("");
  const [options, setOptions] = useState<GenerateOptions>(DEFAULT_OPTIONS);
  const [varianten, setVarianten] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patchOptions = (patch: Partial<GenerateOptions>) =>
    setOptions((o) => ({ ...o, ...patch }));

  async function generate() {
    if (!profile || !thema.trim()) return;
    setLoading(true);
    setError(null);
    setVarianten([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, thema, options }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") continue;
          const parsed = JSON.parse(payload) as {
            text?: string;
            error?: string;
          };
          if (parsed.error) throw new Error(parsed.error);
          if (parsed.text) {
            accumulated += parsed.text;
            setVarianten(splitVariants(accumulated));
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler");
    } finally {
      setLoading(false);
    }
  }

  const showEmpty = !loading && !error && varianten.length === 0;

  return (
    <main>
      <header className="app-header">
        <div className="brand-row">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <h1 className="brand">
            Post<span className="brand-acc">Blitz</span>
          </h1>
        </div>
        <p className="brand-tag">
          Aus einer Idee werden zwei fertige LinkedIn-Posts in deinem Ton —
          gestreamt in Echtzeit, als interaktive Feed-Vorschau.
        </p>
        <ul className="brand-badges" aria-hidden="true">
          <li>⚡ Live-Streaming</li>
          <li>🎭 Dein Profil, dein Ton</li>
          <li>🔒 Profil bleibt lokal</li>
        </ul>
      </header>

      <ProfileForm onChange={setProfile} />
      <PostInput
        thema={thema}
        options={options}
        onChange={setThema}
        onOptionsChange={patchOptions}
        onSubmit={generate}
        loading={loading}
      />

      {error && (
        <div className="alert" role="alert">
          {error}
        </div>
      )}

      {showEmpty && (
        <div className="empty">
          <div className="empty-mark" aria-hidden="true">
            ✍️
          </div>
          <p className="empty-title">Deine Post-Vorschau erscheint hier</p>
          <p className="empty-sub">
            Fülle dein Profil aus, gib ein Thema ein und wähle ein Format —
            Claude schreibt zwei Varianten, jede als interaktive LinkedIn-Karte
            mit klickbarem „…mehr".
          </p>
        </div>
      )}

      <PostOutput varianten={varianten} profile={profile} loading={loading} />

      <footer className="app-footer">
        Gebaut mit Next.js & Claude Haiku · Varianten sind KI-generiert, vor dem
        Posten kurz prüfen.
      </footer>
    </main>
  );
}
