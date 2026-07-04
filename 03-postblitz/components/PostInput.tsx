"use client";

import {
  POST_FORMATS,
  STIL_PRESETS,
  type EmojiDichte,
  type GenerateOptions,
  type PostFormat,
  type PostStil,
  type Sprache,
} from "@/lib/prompt";

type Props = {
  thema: string;
  options: GenerateOptions;
  onChange: (value: string) => void;
  onOptionsChange: (patch: Partial<GenerateOptions>) => void;
  onSubmit: () => void;
  loading: boolean;
};

const FORMAT_ORDER: PostFormat[] = [
  "auto",
  "story",
  "insight",
  "howto",
  "announcement",
  "question",
];

const STIL_ORDER: PostStil[] = [
  "auto",
  "inspirierend",
  "kontrovers",
  "storytelling",
  "experte",
  "locker",
];

const EMOJI_ORDER: { value: EmojiDichte; label: string }[] = [
  { value: "keine", label: "Keine" },
  { value: "dezent", label: "Dezent" },
  { value: "viele", label: "Viele" },
];

const SPRACHE_ORDER: { value: Sprache; label: string }[] = [
  { value: "de", label: "DE" },
  { value: "en", label: "EN" },
];

export default function PostInput({
  thema,
  options,
  onChange,
  onOptionsChange,
  onSubmit,
  loading,
}: Props) {
  const canSubmit = !loading && thema.trim().length > 0;

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSubmit) {
      e.preventDefault();
      onSubmit();
    }
  }

  return (
    <section className="card">
      <div className="card-header">
        <h2 className="card-title">Worum geht&apos;s heute?</h2>
        <p className="card-subtitle">
          Stichworte, Anlass oder eine grobe Idee — Claude formuliert daraus
          zwei Varianten.
        </p>
      </div>

      <div className="field">
        <span className="field-label">Format</span>
        <div className="chips" role="group" aria-label="Post-Format">
          {FORMAT_ORDER.map((key) => (
            <button
              key={key}
              type="button"
              className="chip"
              data-active={options.format === key ? "true" : undefined}
              onClick={() => onOptionsChange({ format: key })}
              title={POST_FORMATS[key].hint}
            >
              {POST_FORMATS[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field-label">Stil</span>
        <div className="chips" role="group" aria-label="Schreibstil">
          {STIL_ORDER.map((key) => (
            <button
              key={key}
              type="button"
              className="chip"
              data-active={options.stil === key ? "true" : undefined}
              onClick={() => onOptionsChange({ stil: key })}
              title={STIL_PRESETS[key].hint}
            >
              {STIL_PRESETS[key].label}
            </button>
          ))}
        </div>
      </div>

      <div className="control-row">
        <div className="control">
          <span className="field-label">Emojis</span>
          <div className="seg" role="group" aria-label="Emoji-Dichte">
            {EMOJI_ORDER.map((e) => (
              <button
                key={e.value}
                type="button"
                className="seg-btn"
                data-active={options.emoji === e.value ? "true" : undefined}
                onClick={() => onOptionsChange({ emoji: e.value })}
              >
                {e.label}
              </button>
            ))}
          </div>
        </div>

        <div className="control">
          <span className="field-label">Sprache</span>
          <div className="seg" role="group" aria-label="Sprache">
            {SPRACHE_ORDER.map((s) => (
              <button
                key={s.value}
                type="button"
                className="seg-btn"
                data-active={options.sprache === s.value ? "true" : undefined}
                onClick={() => onOptionsChange({ sprache: s.value })}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="control">
          <span className="field-label">Abschluss</span>
          <button
            type="button"
            className="toggle"
            data-active={options.cta ? "true" : undefined}
            aria-pressed={options.cta}
            onClick={() => onOptionsChange({ cta: !options.cta })}
            title="Post mit Frage / Call-to-Action beenden — bringt Kommentare"
          >
            <span className="toggle-dot" aria-hidden="true" />
            Frage am Ende
          </button>
        </div>
      </div>

      <label className="field">
        <span className="field-label">Thema oder Anlass</span>
        <textarea
          value={thema}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Beispiel: Heute haben wir unsere neue Pricing-Seite gelauncht. Drei Erkenntnisse aus der Recherche möchte ich teilen."
        />
      </label>

      <div className="submit-row">
        <span className="submit-hint">
          <kbd>⌘</kbd> + <kbd>↵</kbd> zum Generieren
        </span>
        <button onClick={onSubmit} disabled={!canSubmit}>
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Generiere…
            </>
          ) : (
            <>
              <BoltIcon />2 Varianten generieren
            </>
          )}
        </button>
      </div>
    </section>
  );
}

function BoltIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
