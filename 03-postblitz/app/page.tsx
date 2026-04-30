"use client";

import { useState } from "react";
import ProfileForm from "@/components/ProfileForm";
import PostInput from "@/components/PostInput";
import PostOutput from "@/components/PostOutput";
import { splitVariants, type Profile } from "@/lib/prompt";

export default function Page() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [thema, setThema] = useState("");
  const [varianten, setVarianten] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (!profile) return;
    setLoading(true);
    setError(null);
    setVarianten([]);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, thema }),
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

  return (
    <main>
      <header className="app-header">
        <h1 className="brand">PostBlitz</h1>
        <span className="brand-tag">LinkedIn-Posts in deinem Ton</span>
      </header>
      <ProfileForm onChange={setProfile} />
      <PostInput
        thema={thema}
        onChange={setThema}
        onSubmit={generate}
        loading={loading}
      />
      {error && <div className="alert">{error}</div>}
      <PostOutput varianten={varianten} />
    </main>
  );
}
