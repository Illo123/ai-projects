"use client";

import { useState } from "react";

type Props = {
  varianten: string[];
};

export default function PostOutput({ varianten }: Props) {
  const [kopiert, setKopiert] = useState<number | null>(null);

  if (varianten.length === 0) return null;

  async function copy(text: string, index: number) {
    await navigator.clipboard.writeText(text);
    setKopiert(index);
    setTimeout(() => setKopiert(null), 1500);
  }

  return (
    <section className="variants">
      <h2 className="variants-title">Drei Varianten</h2>
      {varianten.map((text, i) => (
        <article key={i} className="variant">
          <header className="variant-header">
            <span className="variant-pill">Variante {i + 1}</span>
            <button
              className="btn-secondary"
              data-state={kopiert === i ? "copied" : undefined}
              onClick={() => copy(text, i)}
            >
              {kopiert === i ? "Kopiert" : "Kopieren"}
            </button>
          </header>
          <div className="variant-body">{text}</div>
        </article>
      ))}
    </section>
  );
}
