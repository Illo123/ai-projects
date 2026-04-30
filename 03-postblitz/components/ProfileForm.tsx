"use client";

import { useEffect, useState } from "react";
import type { Profile } from "@/lib/prompt";

const STORAGE_KEY = "postblitz.profile";

const EMPTY: Profile = {
  name: "",
  rolle: "",
  zielgruppe: "",
  tonalitaet: "professionell, aber nahbar",
};

type Props = {
  onChange: (profile: Profile) => void;
};

export default function ProfileForm({ onChange }: Props) {
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Profile;
      setProfile(parsed);
      onChange(parsed);
    }
    setLoaded(true);
  }, [onChange]);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    const next = { ...profile, [key]: value };
    setProfile(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    onChange(next);
  }

  if (!loaded) return null;

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">Dein Profil</h2>
        <p className="card-subtitle">
          Damit Claude in deinem Ton schreibt — wird nur in deinem Browser
          gespeichert.
        </p>
      </div>
      <div className="grid-2">
        <label className="field">
          <span className="field-label">Name</span>
          <input
            value={profile.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="z. B. Anna Becker"
          />
        </label>
        <label className="field">
          <span className="field-label">Rolle / Branche</span>
          <input
            value={profile.rolle}
            onChange={(e) => update("rolle", e.target.value)}
            placeholder="z. B. Produktmanagerin im SaaS-Umfeld"
          />
        </label>
        <label className="field">
          <span className="field-label">Zielgruppe</span>
          <input
            value={profile.zielgruppe}
            onChange={(e) => update("zielgruppe", e.target.value)}
            placeholder="z. B. Gründer:innen und Tech-Leads"
          />
        </label>
        <label className="field">
          <span className="field-label">Tonalität</span>
          <input
            value={profile.tonalitaet}
            onChange={(e) => update("tonalitaet", e.target.value)}
            placeholder="z. B. nahbar, mit klarer Haltung"
          />
        </label>
      </div>
    </section>
  );
}
