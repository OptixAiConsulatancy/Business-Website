(function () {
  const CALENDLY_URL = 'https://calendly.com/optixai01/30min';
  const STORAGE_KEY = 'automately_chat';

  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  function saveHistory(msgs) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-20))); }
    catch {}
  }

  // Inject widget HTML
  const widget = document.createElement('div');
  widget.id = 'ai-chat-widget';
  widget.innerHTML = `
    <button class="chat-toggle" id="chatToggle" aria-label="Chat with us">
      <svg class="chat-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <span class="chat-close-icon" style="display:none">✕</span>
    </button>
    <div class="chat-panel" id="chatPanel" aria-hidden="true">
      <div class="chat-header">
        <div class="chat-avatar">AI</div>
        <div>
          <div class="chat-name">Automately AI</div>
          <div class="chat-status">● Online · replies instantly</div>
        </div>
      </div>
      <div class="chat-messages" id="chatMessages" role="log" aria-live="polite"></div>
      <div class="chat-input-area">
        <input type="text" id="chatInput" placeholder="Type a message…" autocomplete="off" maxlength="500" />
        <button id="chatSend" aria-label="Send">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(widget);

  // Static hidden form so Netlify detects it at build time
  const staticForm = document.createElement('form');
  staticForm.setAttribute('name', 'lead-capture');
  staticForm.setAttribute('data-netlify', 'true');
  staticForm.setAttribute('hidden', '');
  staticForm.innerHTML = `
    <input type="hidden" name="form-name" value="lead-capture" />
    <input name="visitor_name" /><input name="business" /><input name="need" /><input name="conversation" />
  `;
  document.body.appendChild(staticForm);

  const toggle = document.getElementById('chatToggle');
  const panel = document.getElementById('chatPanel');
  const msgContainer = document.getElementById('chatMessages');
  const input = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSend');

  let history = loadHistory();
  let isOpen = false;
  let loading = false;

  const WELCOME = "G'day! 👋 I'm the Optix AI. I help Gold Coast businesses save hours every week with smart automation. What does your business do?";

  toggle.addEventListener('click', () => {
    isOpen = !isOpen;
    panel.style.display = isOpen ? 'flex' : 'none';
    panel.setAttribute('aria-hidden', String(!isOpen));
    toggle.querySelector('.chat-icon').style.display = isOpen ? 'none' : 'block';
    toggle.querySelector('.chat-close-icon').style.display = isOpen ? 'block' : 'none';

    if (isOpen) {
      if (msgContainer.children.length === 0) {
        if (history.length > 0) {
          history.forEach(m => renderMessage(m.role, m.content));
        } else {
          renderMessage('assistant', WELCOME);
          history.push({ role: 'assistant', content: WELCOME });
          saveHistory(history);
        }
      }
      scroll();
      setTimeout(() => input.focus(), 50);
    }
  });

  function scroll() {
    msgContainer.scrollTop = msgContainer.scrollHeight;
  }

  function renderMessage(role, raw) {
    let content = raw;
    let qualified = false;
    let leadData = null;

    if (content.includes('QUALIFIED_LEAD')) {
      qualified = true;
      const match = content.match(/LEAD_DATA:(\{.*?\})/);
      if (match) {
        try { leadData = JSON.parse(match[1]); } catch {}
      }
      content = content
        .replace(/QUALIFIED_LEAD\n?/, '')
        .replace(/LEAD_DATA:\{.*?\}\n?/, '')
        .trim();
    }

    const wrap = document.createElement('div');
    wrap.className = `chat-msg chat-msg-${role}`;

    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble';
    bubble.innerHTML = content.replace(/\n/g, '<br>');
    wrap.appendChild(bubble);
    msgContainer.appendChild(wrap);

    if (qualified) {
      setTimeout(() => renderCalendly(leadData), 300);
    }
    scroll();
  }

  function renderCalendly(leadData) {
    const wrap = document.createElement('div');
    wrap.className = 'chat-msg chat-msg-assistant';
    wrap.innerHTML = `
      <div class="chat-bubble">
        Sounds like we can save your team a serious amount of time! Want to lock in a free 30-min call?
        <a href="${CALENDLY_URL}" target="_blank" rel="noopener" class="chat-cta">📅 Book a Free Discovery Call</a>
      </div>
    `;
    msgContainer.appendChild(wrap);
    scroll();

    if (leadData) submitLead(leadData);
  }

  function submitLead(leadData) {
    // Send auto-reply to visitor + notify owner via Resend
    fetch('/.netlify/functions/send-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData),
    }).catch(() => {});

    // Also store in Netlify Forms as a backup record
    const body = new URLSearchParams({
      'form-name': 'lead-capture',
      visitor_name: leadData.name || 'Unknown',
      email: leadData.email || '',
      business: leadData.business || 'Unknown',
      need: leadData.need || 'Unknown',
      conversation: history.map(m => `${m.role}: ${m.content}`).join('\n\n')
    });
    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }).catch(() => {});
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'chat-msg chat-msg-assistant';
    div.id = 'typing';
    div.innerHTML = '<div class="chat-bubble chat-typing"><span></span><span></span><span></span></div>';
    msgContainer.appendChild(div);
    scroll();
  }

  function removeTyping() {
    const t = document.getElementById('typing');
    if (t) t.remove();
  }

  async function send() {
    const text = input.value.trim();
    if (!text || loading) return;
    input.value = '';

    renderMessage('user', text);
    history.push({ role: 'user', content: text });
    saveHistory(history);

    loading = true;
    showTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      });
      const data = await res.json();
      removeTyping();
      renderMessage('assistant', data.message);
      history.push({ role: 'assistant', content: data.message });
      saveHistory(history);
    } catch {
      removeTyping();
      renderMessage('assistant', "Sorry, I'm having a moment. Try again or email us at optixai01@gmail.com");
    }

    loading = false;
    input.focus();
  }

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
})();
