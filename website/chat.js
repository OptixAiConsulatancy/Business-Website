(function () {
  const CALENDLY_URL = 'https://calendly.com/optixai01/30min';
  const STORAGE_KEY = 'optix_chat';

  function loadHistory() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
    catch { return []; }
  }

  function saveHistory(msgs) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-20))); }
    catch {}
  }

  // ── Styles ─────────────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #optix-root {
      position: fixed;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      z-index: 9999;
      display: flex;
      align-items: center;
    }

    /* Bubble toggle */
    #optix-toggle {
      width: 48px;
      height: 56px;
      background: linear-gradient(160deg, #7c6dfa 0%, #a78bfa 100%);
      border-radius: 0 28px 28px 0;
      display: flex;
      align-items: center;
      overflow: hidden;
      cursor: pointer;
      flex-shrink: 0;
      transition: width 0.38s cubic-bezier(0.4, 0, 0.2, 1),
                  box-shadow 0.2s;
      box-shadow: 3px 0 20px rgba(124, 109, 250, 0.45);
      user-select: none;
    }
    #optix-toggle:hover {
      width: 178px;
      box-shadow: 3px 0 28px rgba(124, 109, 250, 0.6);
    }
    #optix-toggle.panel-open {
      width: 48px !important;
      border-radius: 0 28px 28px 0;
    }

    .optix-o {
      font-family: Inter, sans-serif;
      font-size: 1.15rem;
      font-weight: 700;
      color: #fff;
      width: 48px;
      text-align: center;
      flex-shrink: 0;
      letter-spacing: -0.01em;
    }
    .optix-peek {
      font-family: Inter, sans-serif;
      font-size: 0.8rem;
      font-weight: 500;
      color: rgba(255,255,255,0.92);
      white-space: nowrap;
      overflow: hidden;
      max-width: 0;
      opacity: 0;
      padding-right: 0;
      transition: max-width 0.38s cubic-bezier(0.4,0,0.2,1),
                  opacity 0.2s 0.12s,
                  padding-right 0.38s;
    }
    #optix-toggle:hover .optix-peek {
      max-width: 140px;
      opacity: 1;
      padding-right: 16px;
    }
    #optix-toggle.panel-open .optix-peek {
      max-width: 0 !important;
      opacity: 0 !important;
      padding-right: 0 !important;
    }

    /* Chat panel */
    #optix-panel {
      width: 0;
      height: 520px;
      overflow: hidden;
      transition: width 0.38s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      background: #111114;
      border-top: 1px solid transparent;
      border-right: 1px solid transparent;
      border-bottom: 1px solid transparent;
      border-left: none;
      border-radius: 0 16px 16px 0;
      box-shadow: none;
    }
    #optix-panel.open {
      width: 320px;
      border-color: rgba(255,255,255,0.07);
      box-shadow: 6px 0 40px rgba(0,0,0,0.55);
    }

    .optix-inner {
      width: 320px;
      height: 520px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
    }

    /* Header */
    .optix-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.85rem 0.85rem 0.85rem 1.1rem;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    }
    .optix-header-left {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }
    .optix-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #7c6dfa, #a78bfa);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Inter, sans-serif;
      font-size: 0.68rem;
      font-weight: 700;
      color: #fff;
      flex-shrink: 0;
    }
    .optix-title {
      font-family: Inter, sans-serif;
      font-size: 0.85rem;
      font-weight: 600;
      color: #f0f0f0;
      line-height: 1.2;
    }
    .optix-online {
      font-family: Inter, sans-serif;
      font-size: 0.7rem;
      color: #4ade80;
      line-height: 1;
    }
    .optix-x {
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      font-size: 0.9rem;
      padding: 4px 6px;
      border-radius: 6px;
      transition: color 0.15s, background 0.15s;
      line-height: 1;
    }
    .optix-x:hover { color: #f0f0f0; background: rgba(255,255,255,0.06); }

    /* Messages */
    .optix-msgs {
      flex: 1;
      overflow-y: auto;
      padding: 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.55rem;
      scrollbar-width: thin;
      scrollbar-color: rgba(255,255,255,0.06) transparent;
    }
    .optix-msg {
      max-width: 87%;
      padding: 0.5rem 0.85rem;
      border-radius: 14px;
      font-family: Inter, sans-serif;
      font-size: 0.84rem;
      line-height: 1.55;
      word-break: break-word;
    }
    .optix-msg.ai {
      align-self: flex-start;
      background: rgba(124,109,250,0.13);
      color: #e8e8f0;
      border-bottom-left-radius: 4px;
    }
    .optix-msg.user {
      align-self: flex-end;
      background: #7c6dfa;
      color: #fff;
      border-bottom-right-radius: 4px;
    }
    .optix-msg a {
      color: #a78bfa;
      text-decoration: underline;
    }

    /* Typing indicator */
    .optix-typing {
      align-self: flex-start;
      background: rgba(124,109,250,0.13);
      border-radius: 14px;
      border-bottom-left-radius: 4px;
      padding: 0.55rem 0.9rem;
      display: flex;
      gap: 4px;
      align-items: center;
    }
    .optix-typing span {
      width: 5px; height: 5px;
      background: #a78bfa;
      border-radius: 50%;
      animation: optixDot 1.3s infinite;
    }
    .optix-typing span:nth-child(2) { animation-delay: 0.18s; }
    .optix-typing span:nth-child(3) { animation-delay: 0.36s; }
    @keyframes optixDot {
      0%, 60%, 100% { transform: translateY(0); opacity: 0.35; }
      30% { transform: translateY(-4px); opacity: 1; }
    }

    /* CTA booking button */
    .optix-book-btn {
      display: inline-block;
      margin-top: 8px;
      background: linear-gradient(135deg, #7c6dfa, #a78bfa);
      color: #fff !important;
      text-decoration: none !important;
      padding: 0.5rem 1.1rem;
      border-radius: 8px;
      font-family: Inter, sans-serif;
      font-size: 0.82rem;
      font-weight: 600;
      transition: opacity 0.2s;
    }
    .optix-book-btn:hover { opacity: 0.88; }

    /* Input row */
    .optix-input-row {
      display: flex;
      gap: 0.4rem;
      padding: 0.65rem 0.75rem;
      border-top: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    }
    .optix-input {
      flex: 1;
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px;
      padding: 0.5rem 0.8rem;
      color: #f0f0f0;
      font-family: Inter, sans-serif;
      font-size: 0.84rem;
      outline: none;
      transition: border-color 0.2s;
    }
    .optix-input::placeholder { color: #555; }
    .optix-input:focus { border-color: rgba(124,109,250,0.5); }
    .optix-send-btn {
      width: 34px; height: 34px;
      background: #7c6dfa;
      border: none;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #fff;
      flex-shrink: 0;
      transition: opacity 0.2s;
    }
    .optix-send-btn:hover { opacity: 0.85; }
    .optix-send-btn:disabled { opacity: 0.35; cursor: default; }

    @media (max-width: 420px) {
      #optix-panel.open { width: calc(100vw - 52px); }
      .optix-inner { width: calc(100vw - 52px); }
    }
  `;
  document.head.appendChild(style);

  // ── HTML ───────────────────────────────────────────────────────────────────
  const root = document.createElement('div');
  root.id = 'optix-root';
  root.innerHTML = `
    <div id="optix-toggle" role="button" tabindex="0" aria-label="Chat with Optix AI">
      <span class="optix-o">O</span>
      <span class="optix-peek">Chat with Optix AI</span>
    </div>
    <div id="optix-panel" aria-hidden="true">
      <div class="optix-inner">
        <div class="optix-header">
          <div class="optix-header-left">
            <div class="optix-avatar">AI</div>
            <div>
              <div class="optix-title">Optix AI</div>
              <div class="optix-online">● Online · replies instantly</div>
            </div>
          </div>
          <button class="optix-x" id="optixClose" aria-label="Close">✕</button>
        </div>
        <div class="optix-msgs" id="optixMsgs" role="log" aria-live="polite"></div>
        <div class="optix-input-row">
          <input class="optix-input" id="optixInput" type="text" placeholder="Type a message…" autocomplete="off" maxlength="500" />
          <button class="optix-send-btn" id="optixSend" aria-label="Send">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  // Hidden Netlify form
  const netlifyForm = document.createElement('form');
  netlifyForm.setAttribute('name', 'lead-capture');
  netlifyForm.setAttribute('data-netlify', 'true');
  netlifyForm.setAttribute('hidden', '');
  netlifyForm.innerHTML = `
    <input type="hidden" name="form-name" value="lead-capture" />
    <input name="visitor_name" />
    <input name="email" type="email" />
    <input name="business" />
    <input name="need" />
    <input name="conversation" />
  `;
  document.body.appendChild(netlifyForm);

  // ── State & refs ───────────────────────────────────────────────────────────
  const toggle   = document.getElementById('optix-toggle');
  const panel    = document.getElementById('optix-panel');
  const msgs     = document.getElementById('optixMsgs');
  const input    = document.getElementById('optixInput');
  const sendBtn  = document.getElementById('optixSend');
  const closeBtn = document.getElementById('optixClose');

  let history = loadHistory();
  let isOpen  = false;
  let loading = false;

  const WELCOME = "G'day! 👋 I'm the Optix AI. I help Gold Coast businesses save hours every week with smart automation. What does your business do?";

  // ── Open / close ───────────────────────────────────────────────────────────
  function open() {
    isOpen = true;
    panel.classList.add('open');
    toggle.classList.add('panel-open');
    panel.setAttribute('aria-hidden', 'false');
    if (msgs.children.length === 0) {
      if (history.length > 0) {
        history.forEach(m => addMsg(m.role === 'assistant' ? 'ai' : 'user', m.content, false));
      } else {
        addMsg('ai', WELCOME, false);
        history.push({ role: 'assistant', content: WELCOME });
        saveHistory(history);
      }
    }
    scrollDown();
    setTimeout(() => input.focus(), 50);
  }

  function close() {
    isOpen = false;
    panel.classList.remove('open');
    toggle.classList.remove('panel-open');
    panel.setAttribute('aria-hidden', 'true');
  }

  toggle.addEventListener('click', () => isOpen ? close() : open());
  toggle.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); isOpen ? close() : open(); } });
  closeBtn.addEventListener('click', close);

  // ── Rendering ──────────────────────────────────────────────────────────────
  function scrollDown() { msgs.scrollTop = msgs.scrollHeight; }

  function addMsg(role, raw, animate = true) {
    let text = raw;
    let leadData = null;

    if (text.includes('QUALIFIED_LEAD')) {
      const match = text.match(/LEAD_DATA:(\{.*?\})/s);
      if (match) { try { leadData = JSON.parse(match[1]); } catch {} }
      text = text.replace(/QUALIFIED_LEAD\n?/, '').replace(/LEAD_DATA:\{.*?\}\n?/s, '').trim();
    }

    if (text) {
      const el = document.createElement('div');
      el.className = `optix-msg ${role}`;
      el.innerHTML = text.replace(/\n/g, '<br>');
      msgs.appendChild(el);
      scrollDown();
    }

    if (leadData) setTimeout(() => showCalendly(leadData), 300);
  }

  function showTyping() {
    const el = document.createElement('div');
    el.className = 'optix-typing';
    el.id = 'optix-typing-indicator';
    el.innerHTML = '<span></span><span></span><span></span>';
    msgs.appendChild(el);
    scrollDown();
  }

  function removeTyping() {
    const el = document.getElementById('optix-typing-indicator');
    if (el) el.remove();
  }

  function showCalendly(leadData) {
    const el = document.createElement('div');
    el.className = 'optix-msg ai';
    el.innerHTML = `Sounds like we can save your team a serious amount of time! Lock in your free 30-min call:<br>
      <a href="${CALENDLY_URL}" target="_blank" rel="noopener" class="optix-book-btn">📅 Book Free Discovery Call</a>`;
    msgs.appendChild(el);
    scrollDown();
    submitLead(leadData);
  }

  // ── Sending messages ───────────────────────────────────────────────────────
  async function send() {
    const text = input.value.trim();
    if (!text || loading) return;
    input.value = '';

    addMsg('user', text, true);
    history.push({ role: 'user', content: text });
    saveHistory(history);

    loading = true;
    sendBtn.disabled = true;
    showTyping();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history }),
      });
      const data = await res.json();
      removeTyping();
      const reply = data.message || "Sorry, something went wrong. Please try again.";
      addMsg('ai', reply, true);
      history.push({ role: 'assistant', content: reply });
      saveHistory(history);
    } catch {
      removeTyping();
      addMsg('ai', "Sorry, I'm having a moment. Try again or email us at optixai01@gmail.com");
    }

    loading = false;
    sendBtn.disabled = false;
    input.focus();
  }

  sendBtn.addEventListener('click', send);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });

  // ── Lead submission ────────────────────────────────────────────────────────
  function submitLead(leadData) {
    fetch('/.netlify/functions/send-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(leadData),
    }).catch(() => {});

    const body = new URLSearchParams({
      'form-name': 'lead-capture',
      visitor_name: leadData.name || 'Unknown',
      email: leadData.email || '',
      business: leadData.business || 'Unknown',
      need: leadData.need || 'Unknown',
      conversation: history.map(m => `${m.role}: ${m.content}`).join('\n\n'),
    });
    fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body }).catch(() => {});
  }
})();
