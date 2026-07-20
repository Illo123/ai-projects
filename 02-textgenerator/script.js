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

// Profil-Modal
const profileBtn        = document.getElementById('profileBtn');
const profileOverlay    = document.getElementById('profileOverlay');
const profileName       = document.getElementById('profileName');
const profileSchule     = document.getElementById('profileSchule');
const profileTon        = document.getElementById('profileTon');
const profileLaenge     = document.getElementById('profileLaenge');
const profileSaveBtn    = document.getElementById('profileSaveBtn');
const profileCancelBtn  = document.getElementById('profileCancelBtn');

// Verlauf-Panel
const historyBtn       = document.getElementById('historyBtn');
const historyOverlay   = document.getElementById('historyOverlay');
const historyList      = document.getElementById('historyList');
const historyCloseBtn  = document.getElementById('historyCloseBtn');
const historyClearBtn  = document.getElementById('historyClearBtn');

let selectedEmpfänger = 'eltern';
let selectedType      = '';
let selectedLaenge    = 'mittel';
let fullText          = '';

// ===========================
// LABELS (für Ergebnis-Meta UND Verlauf — eine Quelle der Wahrheit)
// ===========================
const EMPFÄNGER_LABEL = { eltern: '👨‍👩‍👧 Eltern', schulleitung: '🏫 Schulleitung', kollegen: '👥 Kollegen' };
const TON_LABEL       = { freundlich: '😊 Freundlich', formell: '🎩 Formell', sachlich: '📋 Sachlich' };

function typLabelFor(empfänger, texttyp) {
  return VORLAGEN[empfänger]?.find(v => v.value === texttyp)?.label || '';
}

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

function renderTypeList(preselect) {
  const vorlagen = VORLAGEN[selectedEmpfänger] || [];
  typeList.innerHTML = '';
  const preselectIndex = preselect ? vorlagen.findIndex(v => v.value === preselect) : -1;
  const activeIndex    = preselectIndex >= 0 ? preselectIndex : 0;
  selectedType = vorlagen[activeIndex]?.value || '';

  vorlagen.forEach((v, i) => {
    const btn = document.createElement('button');
    btn.className = 'type-btn' + (i === activeIndex ? ' active' : '');
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
  const schule   = (loadProfile().schule || '').trim();

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
  const typLabel = typLabelFor(selectedEmpfänger, selectedType);

  resultMeta.innerHTML = `
    <span class="meta-tag highlight">${EMPFÄNGER_LABEL[selectedEmpfänger]}</span>
    <span class="meta-tag">${typLabel}</span>
    <span class="meta-tag">${TON_LABEL[ton]}</span>
  `;

  // API-Anfrage
  try {
    const response = await fetch('/generieren', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ empfänger: selectedEmpfänger, texttyp: selectedType, details, ton, absender, klasse, laenge: selectedLaenge, schule }),
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

    if (fullText.trim()) {
      saveToHistory({
        id: crypto.randomUUID(),
        ts: Date.now(),
        empfänger: selectedEmpfänger,
        texttyp: selectedType,
        ton, laenge: selectedLaenge, klasse, details,
        fullText,
      });
    }

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

// ===========================
// PROFIL — lokale Defaults (localStorage)
// ===========================
const PROFILE_KEY = 'lehrerbrief.profile';

function loadProfile() {
  try {
    return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
  } catch {
    return {};
  }
}

function applyProfileToForm(profile) {
  if (profile.name) document.getElementById('absender').value = profile.name;

  if (profile.defaultTon) document.getElementById('ton').value = profile.defaultTon;

  if (profile.defaultLaenge) {
    selectedLaenge = profile.defaultLaenge;
    laengeSeg.querySelectorAll('.seg-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.value === profile.defaultLaenge);
    });
  }

  if (profile.defaultEmpfänger && VORLAGEN[profile.defaultEmpfänger]) {
    selectedEmpfänger = profile.defaultEmpfänger;
    document.querySelectorAll('.recipient-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.value === profile.defaultEmpfänger);
    });
    renderTypeList();
  }
}

function openProfileModal() {
  const profile = loadProfile();
  profileName.value    = profile.name    || '';
  profileSchule.value  = profile.schule  || '';
  profileTon.value     = profile.defaultTon    || 'freundlich';
  profileLaenge.value  = profile.defaultLaenge || 'mittel';
  profileOverlay.style.display = 'flex';
}

function closeProfileModal() {
  profileOverlay.style.display = 'none';
}

profileBtn.addEventListener('click', openProfileModal);
profileCancelBtn.addEventListener('click', closeProfileModal);
profileOverlay.addEventListener('click', (e) => {
  if (e.target === profileOverlay) closeProfileModal();
});

profileSaveBtn.addEventListener('click', () => {
  const profile = {
    name:            profileName.value.trim(),
    schule:          profileSchule.value.trim(),
    defaultTon:      profileTon.value,
    defaultLaenge:   profileLaenge.value,
    defaultEmpfänger: selectedEmpfänger,
  };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  applyProfileToForm(profile);
  closeProfileModal();
});

// Profil beim Laden der Seite anwenden
applyProfileToForm(loadProfile());

// ===========================
// VERLAUF — gespeicherte Briefe (localStorage)
// ===========================
const HISTORY_KEY = 'lehrerbrief.history';
const HISTORY_MAX = 50;

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function saveHistory(entries) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries));
}

function saveToHistory(entry) {
  const entries = [entry, ...loadHistory()].slice(0, HISTORY_MAX);
  saveHistory(entries);
}

function formatHistoryDate(ts) {
  return new Date(ts).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

function renderHistoryList() {
  const entries = loadHistory();
  historyList.innerHTML = '';

  if (entries.length === 0) {
    historyList.innerHTML = '<p class="history-empty">Noch keine Briefe generiert.</p>';
    return;
  }

  entries.forEach(entry => {
    const typLabel = typLabelFor(entry.empfänger, entry.texttyp);
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <div class="history-item-title">${typLabel} · ${formatHistoryDate(entry.ts)}</div>
      <div class="history-item-preview">${entry.fullText.slice(0, 80).replace(/</g, '&lt;')}…</div>
      <div class="history-item-actions">
        <button class="action-btn" data-action="open" data-id="${entry.id}">Öffnen</button>
        <button class="action-btn" data-action="delete" data-id="${entry.id}">Löschen</button>
      </div>
    `;
    historyList.appendChild(item);
  });
}

function openHistoryEntry(id) {
  const entry = loadHistory().find(e => e.id === id);
  if (!entry) return;

  // Formular wieder befüllen
  selectedEmpfänger = entry.empfänger;
  document.querySelectorAll('.recipient-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.value === entry.empfänger);
  });
  renderTypeList(entry.texttyp);

  document.getElementById('ton').value    = entry.ton;
  document.getElementById('klasse').value = entry.klasse || '';
  document.getElementById('details').value = entry.details || '';
  updateCount();

  selectedLaenge = entry.laenge;
  laengeSeg.querySelectorAll('.seg-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.value === entry.laenge);
  });

  // Ergebnis wiederherstellen
  fullText = entry.fullText;
  emptyState.style.display    = 'none';
  resultBox.style.display     = 'flex';
  resultText.className        = 'result-text';
  resultText.textContent      = fullText;
  const wörter = fullText.trim().split(/\s+/).length;
  wordCount.textContent        = `${wörter} Wörter · Direkt kopieren und anpassen`;
  resultActions.style.display = 'flex';

  const typLabel = typLabelFor(entry.empfänger, entry.texttyp);
  resultMeta.innerHTML = `
    <span class="meta-tag highlight">${EMPFÄNGER_LABEL[entry.empfänger]}</span>
    <span class="meta-tag">${typLabel}</span>
    <span class="meta-tag">${TON_LABEL[entry.ton]}</span>
  `;

  closeHistoryPanel();
}

function deleteHistoryEntry(id) {
  saveHistory(loadHistory().filter(e => e.id !== id));
  renderHistoryList();
}

function openHistoryPanel() {
  renderHistoryList();
  historyOverlay.style.display = 'flex';
}

function closeHistoryPanel() {
  historyOverlay.style.display = 'none';
}

historyBtn.addEventListener('click', openHistoryPanel);
historyCloseBtn.addEventListener('click', closeHistoryPanel);
historyOverlay.addEventListener('click', (e) => {
  if (e.target === historyOverlay) closeHistoryPanel();
});

historyClearBtn.addEventListener('click', () => {
  if (loadHistory().length === 0) return;
  if (!confirm('Wirklich den gesamten Verlauf löschen? Das kann nicht rückgängig gemacht werden.')) return;
  saveHistory([]);
  renderHistoryList();
});

historyList.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-action]');
  if (!btn) return;
  const { action, id } = btn.dataset;
  if (action === 'open') openHistoryEntry(id);
  if (action === 'delete') deleteHistoryEntry(id);
});
