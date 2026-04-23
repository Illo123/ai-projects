// ===========================
// MATHEWES — CHAT WIDGET
// ===========================

(function () {
  const launcher = document.getElementById('cwLauncher');
  const panel    = document.getElementById('cwPanel');
  const closeBtn = document.getElementById('cwClose');
  const form     = document.getElementById('cwForm');
  const input    = document.getElementById('cwInput');
  const sendBtn  = document.getElementById('cwSend');
  const messages = document.getElementById('cwMessages');
  const intro    = document.getElementById('cwIntro');
  const chips    = document.querySelectorAll('.cw-chip');

  let history = [];
  let streaming = false;

  launcher.addEventListener('click', openPanel);
  closeBtn.addEventListener('click', closePanel);

  function openPanel() {
    panel.classList.add('open');
    panel.setAttribute('aria-hidden', 'false');
    launcher.classList.add('active');
    setTimeout(() => input.focus(), 320);
  }

  function closePanel() {
    panel.classList.remove('open');
    panel.setAttribute('aria-hidden', 'true');
    launcher.classList.remove('active');
  }

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      input.value = chip.dataset.text;
      sendBtn.disabled = false;
      submit();
    });
  });

  input.addEventListener('input', () => {
    sendBtn.disabled = input.value.trim() === '' || streaming;
  });

  form.addEventListener('submit', e => {
    e.preventDefault();
    submit();
  });

  async function submit() {
    const text = input.value.trim();
    if (!text || streaming) return;

    intro.classList.add('hidden');
    streaming = true;
    sendBtn.disabled = true;
    input.value = '';

    addMessage('user', text);
    history.push({ role: 'user', content: text });

    const typingEl = addTyping();
    scrollDown();

    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });

      if (!response.ok) {
        typingEl.remove();
        if (response.status === 429) {
          addMessage('assistant', 'Kurze Pause — bitte später erneut fragen.');
        } else {
          addMessage('assistant', 'Etwas ist schiefgegangen. Bitte nochmal probieren.');
        }
        streaming = false;
        sendBtn.disabled = input.value.trim() === '';
        return;
      }

      typingEl.remove();
      const { textEl } = addMessage('assistant', '');
      const cursor = document.createElement('span');
      cursor.className = 'cw-cursor';
      textEl.appendChild(cursor);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let full = '';
      let buffer = '';

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
            const { text: chunk } = JSON.parse(payload);
            full += chunk;
            textEl.innerHTML = renderMarkdown(full);
            textEl.appendChild(cursor);
            scrollDown();
          } catch {}
        }
      }

      cursor.remove();
      textEl.innerHTML = renderMarkdown(full);
      history.push({ role: 'assistant', content: full });
    } catch (err) {
      typingEl.remove();
      addMessage('assistant', 'Verbindungsfehler. Läuft der Server?');
    }

    streaming = false;
    sendBtn.disabled = input.value.trim() === '';
    scrollDown();
  }

  function addMessage(role, content) {
    const el = document.createElement('div');
    el.className = `cw-msg ${role}`;
    const textEl = document.createElement('div');
    textEl.className = 'cw-text';
    textEl.innerHTML = role === 'user' ? escapeHtml(content) : renderMarkdown(content);
    el.appendChild(textEl);
    messages.appendChild(el);
    scrollDown();
    return { el, textEl };
  }

  function addTyping() {
    const el = document.createElement('div');
    el.className = 'cw-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    messages.appendChild(el);
    return el;
  }

  function scrollDown() {
    messages.scrollTop = messages.scrollHeight;
  }

  function renderMarkdown(text) {
    return text
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/(<li>.*<\/li>\s*)+/g, m => `<ul>${m}</ul>`)
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
  }

  function escapeHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
  }
})();
