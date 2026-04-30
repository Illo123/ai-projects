"use client";

type Props = {
  thema: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
};

export default function PostInput({
  thema,
  onChange,
  onSubmit,
  loading,
}: Props) {
  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">Worum geht&apos;s heute?</h2>
        <p className="card-subtitle">
          Stichworte, Anlass oder eine grobe Idee — Claude formuliert daraus
          drei Varianten.
        </p>
      </div>
      <label className="field">
        <span className="field-label">Thema oder Anlass</span>
        <textarea
          value={thema}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Beispiel: Heute haben wir unsere neue Pricing-Seite gelauncht. Drei Erkenntnisse aus der Recherche möchte ich teilen."
        />
      </label>
      <div className="submit-row">
        <button onClick={onSubmit} disabled={loading || !thema.trim()}>
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Generiere…
            </>
          ) : (
            "3 Varianten generieren"
          )}
        </button>
      </div>
    </section>
  );
}
