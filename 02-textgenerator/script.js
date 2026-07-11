// ===========================
// LEHRERBRIEF — INTERACTIONS
// ===========================

const generateBtn   = document.getElementById('generateBtn');
const resultBox     = document.getElementById('resultBox');
const resultText    = document.getElementById('resultText');
const resultMeta    = document.getElementById('resultMeta');
const resultActions = document.getElementById('resultActions');
const emptyState    = document.getElementById('emptyState');
const wordCount     = document.getElementById('wordCount');
const copyBtn       = document.getElementById('copyBtn');
const downloadBtn   = document.getElementById('downloadBtn');
const printBtn      = document.getElementById('printBtn');
const newBtn        = document.getElementById('newBtn');
const typeList      = document.getElementById('typeList');
const laengeSeg     = document.getElementById('laengeSeg');
const detailsInput  = document.getElementById('details');
const detailsCount  = document.getElementById('detailsCount');

let selectedEmpfänger = 'eltern';
let selectedType      = '';
let selectedLaenge    = 'mittel';
let fullText          = '';

// ===========================
// AUTH — WER IST EINGELOGGT?
// ===========================
(async function checkAuth() {
  try {
    const res = await fetch('/me');
    if (!res.ok) { window.location.href = '/login'; return; }
    const { email } = await res.json();
    document.getElementById('userEmail').textContent = email;
  } catch {
    window.location.href = '/login';
  }
})();

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await fetch('/api/logout', { method: 'POST' });
  window.location.href = '/login';
});

// Vorlagen pro Empfänger
const VORLAGEN = {
  eltern: [
    { value: 'elternbrief',            label: 'Allgemeiner Elternbrief' },
    { value: 'elterngespräch',         label: 'Einladung zum Elterngespräch' },
    { value: 'verhaltensauffälligkeit',label: 'Verhaltensauffälligkeit' },
    { value: 'leistungsrückgang',      label: 'Leistungsrückgang' },
    { value: 'klassenfahrt',           label: 'Klassenfahrt / Schulausflug' },
    { value: 'fehlzeiten',             label: 'Unentschuldigte Fehlzeiten' },
    { value: 'lob',                    label: 'Lob & positive Rückmeldung' },
  ],
  schulleitung: [
    { value: 'krankmeldung',       label: 'Krankmeldung' },
    { value: 'urlaubsantrag',      label: 'Urlaubsantrag' },
    { value: 'vorfallsbericht',    label: 'Vorfallsbericht' },
    { value: 'anschaffungsantrag', label: 'Anschaffungsantrag' },
    { value: 'bericht',            label: 'Allgemeiner Bericht' },
  ],
  kollegen: [
    { value: 'vertretung',      label: 'Vertretungsanfrage' },
    { value: 'besprechung',     label: 'Einladung zur Besprechung' },
    { value: 'info',            label: 'Information ans Kollegium' },
    { value: 'aufgabenübergabe',label: 'Aufgabenübergabe bei Abwesenheit' },
    { value: 'danke',           label: 'Dankesnachricht' },
  ],
};

// ===========================
// EMPFÄNGER WECHSELN
// ===========================
document.querySelectorAll('.recipient-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.recipient-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedEmpfänger = btn.dataset.value;
    renderTypeList();
  });
});

function renderTypeList() {
  const vorlagen = VORLAGEN[selectedEmpfänger] || [];
  typeList.innerHTML = '';
  selectedType = vorlagen[0]?.value || '';

  vorlagen.forEach((v, i) => {
    const btn = document.createElement('button');
    btn.className = 'type-btn' + (i === 0 ? ' active' : '');
    btn.dataset.value = v.value;
    btn.textContent = v.label;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedType = v.value;
    });
    typeList.appendChild(btn);
  });
}

// Initial rendern
renderTypeList();

// ===========================
// LÄNGE (segmented control)
// ===========================
laengeSeg.querySelectorAll('.seg-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    laengeSeg.querySelectorAll('.seg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedLaenge = btn.dataset.value;
  });
});

// ===========================
// ZEICHENZÄHLER
// ===========================
function updateCount() {
  const n = detailsInput.value.length;
  detailsCount.textContent = `${n} Zeichen`;
}
detailsInput.addEventListener('input', updateCount);
updateCount();

// ===========================
// TASTENKÜRZEL — ⌘/Strg + Enter
// ===========================
detailsInput.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && !generateBtn.disabled) {
    e.preventDefault();
    generieren();
  }
});

// ===========================
// GENERIEREN
// ===========================
generateBtn.addEventListener('click', generieren);

async function generieren() {
  const details  = document.getElementById('details').value.trim();
  const klasse   = document.getElementById('klasse').value.trim();
  const ton      = document.getElementById('ton').value;
  const absender = document.getElementById('absender').value.trim();

  if (!details) {
    const ta = document.getElementById('details');
    ta.style.borderColor = 'rgba(134,44,53,0.7)';
    ta.focus();
    setTimeout(() => ta.style.borderColor = '', 1800);
    return;
  }

  // UI: Laden
  generateBtn.disabled = true;
  generateBtn.classList.add('loading');
  generateBtn.querySelector('.btn-text').textContent = 'Wird geschrieben…';

  emptyState.style.display   = 'none';
  resultActions.style.display = 'none';
  resultBox.style.display    = 'flex';
  resultText.className       = 'result-text streaming';
  resultText.textContent     = '';
  wordCount.textContent      = '';

  // Meta-Tags
  const empfängerLabel = { eltern: '👨‍👩‍👧 Eltern', schulleitung: '🏫 Schulleitung', kollegen: '👥 Kollegen' };
  const tonLabel       = { freundlich: '😊 Freundlich', formell: '🎩 Formell', sachlich: '📋 Sachlich' };
  const typLabel       = VORLAGEN[selectedEmpfänger]?.find(v => v.value === selectedType)?.label || '';

  resultMeta.innerHTML = `
    <span class="meta-tag highlight">${empfängerLabel[selectedEmpfänger]}</span>
    <span class="meta-tag">${typLabel}</span>
    <span class="meta-tag">${tonLabel[ton]}</span>
  `;

  // API-Anfrage
  try {
    const response = await fetch('/generieren', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empfänger: selectedEmpfänger, texttyp: selectedType, details, ton, absender, klasse, laenge: selectedLaenge }),
    });

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6);
        if (payload === '[DONE]') break;
        try {
          const { text } = JSON.parse(payload);
          fullText += text;
          resultText.textContent = fullText;
        } catch {}
      }
    }

    resultText.className = 'result-text';
    const wörter = fullText.trim().split(/\s+/).length;
    wordCount.textContent   = `${wörter} Wörter · Direkt kopieren und anpassen`;
    resultActions.style.display = 'flex';

  } catch {
    resultText.className   = 'result-text';
    resultText.textContent = '⚠️ Fehler. Ist der Server gestartet?';
  }

  generateBtn.disabled = false;
  generateBtn.classList.remove('loading');
  generateBtn.querySelector('.btn-text').textContent = 'Brief generieren';
}

// ===========================
// KOPIEREN
// ===========================
copyBtn.addEventListener('click', async () => {
  if (!fullText) return;
  await navigator.clipboard.writeText(fullText);
  copyBtn.classList.add('copied');
  copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:13px;height:13px"><path d="M20 6L9 17l-5-5"/></svg> Kopiert!`;
  setTimeout(() => {
    copyBtn.classList.remove('copied');
    copyBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:13px;height:13px"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Kopieren`;
  }, 2500);
});

// ===========================
// ALS .TXT HERUNTERLADEN
// ===========================
downloadBtn.addEventListener('click', () => {
  if (!fullText) return;
  const stamp = new Date().toISOString().slice(0, 10);
  const blob  = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
  const url   = URL.createObjectURL(blob);
  const a     = document.createElement('a');
  a.href = url;
  a.download = `lehrerbrief-${selectedType || 'brief'}-${stamp}.txt`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

// ===========================
// DRUCKEN / ALS PDF
// ===========================
printBtn.addEventListener('click', () => {
  if (!fullText) return;
  const win = window.open('', '_blank');
  if (!win) return;
  const safe = fullText
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  win.document.write(`<!DOCTYPE html><html lang="de"><head><meta charset="utf-8">
    <title>LehrerBrief</title>
    <style>
      body { font-family: Georgia, 'Times New Roman', serif; max-width: 640px;
             margin: 3rem auto; padding: 0 1.5rem; line-height: 1.7; color: #1a1a1a;
             white-space: pre-wrap; }
      @media print { body { margin: 1.5cm auto; } }
    </style></head><body>${safe}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 300);
});

// ===========================
// NEU GENERIEREN
// ===========================
newBtn.addEventListener('click', generieren);
