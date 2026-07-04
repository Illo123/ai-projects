"use client";

import { Fragment, useState } from "react";
import {
  FOLD_LIMIT,
  LINKEDIN_LIMIT,
  foldSplit,
  hookLength,
  type Profile,
} from "@/lib/prompt";
import { scorePost, type PostScore } from "@/lib/score";

type Props = {
  varianten: string[];
  profile: Profile | null;
  loading: boolean;
};

export default function PostOutput({ varianten, profile, loading }: Props) {
  const showSkeleton = loading && varianten.length === 0;
  if (varianten.length === 0 && !showSkeleton) return null;

  const name = profile?.name?.trim() || "Dein Name";
  const rolle = profile?.rolle?.trim() || "Deine Rolle · Branche";
  const initials = toInitials(name);

  return (
    <section className="variants">
      <h2 className="variants-title">
        {showSkeleton ? "Vorschau wird geschrieben…" : "Deine 2 Varianten"}
      </h2>

      {showSkeleton
        ? [0, 1].map((i) => <SkeletonCard key={i} />)
        : varianten.map((text, i) => (
            <PostCard
              key={i}
              text={text}
              index={i}
              name={name}
              rolle={rolle}
              initials={initials}
            />
          ))}
    </section>
  );
}

// Eine Variante = eine echte, interaktive LinkedIn-Feed-Karte.
function PostCard({
  text,
  index,
  name,
  rolle,
  initials,
}: {
  text: string;
  index: number;
  name: string;
  rolle: string;
  initials: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const chars = text.length;
  const { head } = foldSplit(text);
  const truncated = chars > head.length;
  const hook = hookLength(text);
  const s = scorePost(text);
  const countState =
    chars > LINKEDIN_LIMIT
      ? "over"
      : chars > LINKEDIN_LIMIT * 0.85
        ? "near"
        : "ok";

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <article className="post-card">
      <header className="post-top">
        <span className="post-avatar" aria-hidden="true">
          {initials}
        </span>
        <div className="post-ident">
          <span className="post-name">{name}</span>
          <span className="post-role">{rolle}</span>
          <span className="post-meta">
            Jetzt · <GlobeIcon />
          </span>
        </div>
        <span className="variant-pill">Variante {index + 1}</span>
      </header>

      <div className="post-body">
        {truncated && !expanded ? (
          <>
            {renderInline(head.replace(/\s+$/, ""))}
            <button
              type="button"
              className="li-more"
              onClick={() => setExpanded(true)}
            >
              …mehr
            </button>
          </>
        ) : (
          renderInline(text)
        )}
      </div>

      {truncated && expanded && (
        <button
          type="button"
          className="li-less"
          onClick={() => setExpanded(false)}
        >
          weniger anzeigen
        </button>
      )}

      <div className="post-insights">
        <span className="score-badge" data-level={s.level} title={scoreTitle(s)}>
          <span className="score-dot" aria-hidden="true" />
          Score {s.score} · {s.label}
        </span>
        <span
          className="insight"
          data-warn={hook > FOLD_LIMIT ? "true" : undefined}
          title="Länge der ersten Zeile — sie muss vor der Faltung überzeugen"
        >
          <BoltMini /> Hook {hook} Z.
        </span>
        <span
          className="insight count"
          data-state={countState}
          title="Gesamtlänge gegen das LinkedIn-Limit von 3.000 Zeichen"
        >
          {chars} / {LINKEDIN_LIMIT.toLocaleString("de-DE")}
        </span>
      </div>

      <div className="post-stats">
        <button
          className="btn-secondary btn-copy"
          data-state={copied ? "copied" : undefined}
          onClick={copy}
        >
          {copied ? (
            <>
              <CheckIcon /> Kopiert
            </>
          ) : (
            <>
              <CopyIcon /> Kopieren
            </>
          )}
        </button>
      </div>

      <div className="post-actions" aria-hidden="true">
        <span className="post-action">
          <ThumbIcon /> Gefällt mir
        </span>
        <span className="post-action">
          <CommentIcon /> Kommentieren
        </span>
        <span className="post-action">
          <RepostIcon /> Teilen
        </span>
        <span className="post-action">
          <SendIcon /> Senden
        </span>
      </div>
    </article>
  );
}

function SkeletonCard() {
  return (
    <article className="post-card is-skeleton" aria-hidden="true">
      <header className="post-top">
        <span className="post-avatar sk sk-avatar" />
        <div className="post-ident">
          <span className="sk sk-line sk-w40" />
          <span className="sk sk-line sk-w60" />
        </div>
      </header>
      <div className="post-body">
        <span className="sk sk-line sk-w90" />
        <span className="sk sk-line sk-w80" />
        <span className="sk sk-line sk-w70" />
        <span className="sk sk-line sk-w40" />
      </div>
    </article>
  );
}

// Highlightet #hashtags; der Container rendert Umbrüche via white-space: pre-wrap.
function renderInline(text: string) {
  return text.split(/(#[\wäöüÄÖÜß]+)/g).map((part, i) =>
    part.startsWith("#") ? (
      <span key={i} className="hashtag">
        {part}
      </span>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    ),
  );
}

// Tooltip-Text mit der Score-Aufschlüsselung.
function scoreTitle(s: PostScore): string {
  const sym: Record<string, string> = { ok: "✓", warn: "~", bad: "✗" };
  return (
    `Post-Score ${s.score}/100 — ${s.label}\n` +
    s.checks.map((c) => `${sym[c.state]} ${c.label} (${c.hint})`).join("\n")
  );
}

function toInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "DU";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/* ---- Icons ---- */
function BoltMini() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm6.9 6h-2.6a15.7 15.7 0 00-1.2-3.3A8 8 0 0118.9 8zM12 4c.8 1.1 1.4 2.5 1.8 4h-3.6c.4-1.5 1-2.9 1.8-4zM4.3 14a8 8 0 010-4h3a17.7 17.7 0 000 4h-3zm.8 2h2.6c.3 1.2.7 2.3 1.2 3.3A8 8 0 015.1 16zm2.6-8H5.1a8 8 0 013.8-3.3C8.4 5.7 8 6.8 7.7 8zM12 20c-.8-1.1-1.4-2.5-1.8-4h3.6c-.4 1.5-1 2.9-1.8 4zm2.2-6H9.8a15.9 15.9 0 010-4h4.4a15.9 15.9 0 010 4zm.7 5.3c.5-1 .9-2.1 1.2-3.3h2.6a8 8 0 01-3.8 3.3zM16.7 14a17.7 17.7 0 000-4h3a8 8 0 010 4h-3z" />
    </svg>
  );
}
function ThumbIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M7 10v11M2 21h4V10H2v11zm18-8.5a2.5 2.5 0 00-2.5-2.5H14l.7-4a2 2 0 00-3.6-1.4L7 10v11h10.3a2 2 0 002-1.6l1.6-6.4a2.5 2.5 0 00.1-.5z" />
    </svg>
  );
}
function CommentIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M21 11.5a8.4 8.4 0 01-8.5 8.5A8.4 8.4 0 018 19L3 20l1.3-4.5A8.4 8.4 0 013.5 11.5 8.4 8.4 0 0112 3a8.4 8.4 0 019 8.5z" />
    </svg>
  );
}
function RepostIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" />
    </svg>
  );
}
function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}
function CopyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}
function CheckIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
