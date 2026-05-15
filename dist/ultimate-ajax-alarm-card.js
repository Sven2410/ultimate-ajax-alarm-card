/**
 * Ultimate Ajax Systems Alarm Card
 * A Home Assistant Lovelace card mimicking the Ajax Systems alarm app UI
 * Author: Sven2410
 * Repository: https://github.com/Sven2410/ultimate-ajax-alarm-card
 * License: MIT
 * Version: 1.1.0
 */

const CARD_VERSION = '1.1.0';

// ─── State configuration (Dutch labels) ────────────────────────────────────
const STATE_CONFIG = {
  disarmed: {
    label: 'Uitgeschakeld',
    color: '#00C853',
    shadowColor: 'rgba(0, 200, 83, 0.4)',
    iconKey: 'status_disarmed',
    pulse: false,
  },
  armed_away: {
    label: 'Ingeschakeld',
    color: '#E8604C',
    shadowColor: 'rgba(232, 96, 76, 0.4)',
    iconKey: 'status_armed',
    pulse: false,
  },
  armed_home: {
    label: 'Ingeschakeld',
    color: '#E8604C',
    shadowColor: 'rgba(232, 96, 76, 0.4)',
    iconKey: 'status_armed',
    pulse: false,
  },
  armed: {
    label: 'Ingeschakeld',
    color: '#E8604C',
    shadowColor: 'rgba(232, 96, 76, 0.4)',
    iconKey: 'status_armed',
    pulse: false,
  },
  armed_night: {
    label: 'Deelinschakeling',
    color: '#7C4DFF',
    shadowColor: 'rgba(124, 77, 255, 0.4)',
    iconKey: 'status_night',
    pulse: false,
  },
  arming: {
    label: 'Inschakelen\u2026',
    color: '#E8604C',
    shadowColor: 'rgba(232, 96, 76, 0.4)',
    iconKey: 'status_armed',
    pulse: true,
  },
  pending: {
    label: 'Wachten\u2026',
    color: '#FF9800',
    shadowColor: 'rgba(255, 152, 0, 0.4)',
    iconKey: 'status_armed',
    pulse: true,
  },
  triggered: {
    label: 'Alarm!',
    color: '#FF1744',
    shadowColor: 'rgba(255, 23, 68, 0.6)',
    iconKey: 'status_armed',
    pulse: true,
  },
  unavailable: {
    label: 'Niet beschikbaar',
    color: '#555555',
    shadowColor: 'rgba(85,85,85,0.2)',
    iconKey: 'status_disarmed',
    pulse: false,
  },
};

// ─── SVG Icons ──────────────────────────────────────────────────────────────
// All icons use currentColor — color is applied via the wrapper's CSS color property.
//
// STATUS icons (large, 80x80 viewBox):
//   disarmed  → open arc ~270° with gap at top-right  (matches Ajax app screenshot)
//   armed     → full ring
//   night     → two concentric rings
//
// BUTTON icons (smaller, 56x56 viewBox, white):
//   btn_arm    → full ring
//   btn_disarm → undo/backward arc (C-shape opening left)
//   btn_night  → two concentric rings

const ICONS = {

  // Status: Disarmed — open arc, roughly 270°, gap at top-right
  status_disarmed: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M 57 14 A 26 26 0 1 0 66 40" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/>
  </svg>`,

  // Status: Armed — full ring
  status_armed: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="26" stroke="currentColor" stroke-width="4.5"/>
  </svg>`,

  // Status: Night mode — two concentric rings
  status_night: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="26" stroke="currentColor" stroke-width="4.5"/>
    <circle cx="40" cy="40" r="13" stroke="currentColor" stroke-width="4.5"/>
  </svg>`,

  // Button: Inschakelen — full ring
  btn_arm: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="28" r="19" stroke="currentColor" stroke-width="3.5"/>
  </svg>`,

  // Button: Uitschakelen — backward arc (undo/C-shape, opening to the left)
  btn_disarm: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M 42 17 A 19 19 0 1 0 42 39" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
  </svg>`,

  // Button: Deelinschakeling — two concentric rings
  btn_night: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="28" r="19" stroke="currentColor" stroke-width="3.5"/>
    <circle cx="28" cy="28" r="10" stroke="currentColor" stroke-width="3.5"/>
  </svg>`,
};


// ─── PIN Dialog ──────────────────────────────────────────────────────────────
class AjaxPinDialogV2 extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._resolve = null;
    this._pin = '';
  }

  show() {
    return new Promise((resolve) => {
      this._resolve = resolve;
      this._pin = '';
      this._render();
    });
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.78);
          backdrop-filter: blur(8px);
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
        }
        .dialog {
          background: #1A1A1A;
          border-radius: 24px;
          padding: 32px 28px 24px;
          width: 280px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.9);
        }
        h3 { color:#fff; text-align:center; margin:0 0 6px; font-size:18px; font-weight:600; }
        .sub { color:#666; text-align:center; font-size:13px; margin-bottom:24px; }
        .dots { display:flex; justify-content:center; gap:12px; margin-bottom:28px; }
        .dot {
          width:13px; height:13px; border-radius:50%;
          border:2px solid #444;
          transition: all 0.12s ease;
        }
        .dot.on { background:#00C853; border-color:#00C853; box-shadow:0 0 8px rgba(0,200,83,.5); }
        .pad { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
        .k {
          background:#2A2A2A; border:none; border-radius:12px;
          color:#fff; font-size:22px; font-weight:400; height:62px;
          cursor:pointer; font-family:inherit;
          transition: background .1s, transform .1s;
        }
        .k:active { background:#3A3A3A; transform:scale(.95); }
        .k.empty { visibility:hidden; }
        .k.del { font-size:16px; color:#888; }
        .cancel {
          margin-top:16px; width:100%; background:none; border:none;
          color:#555; font-size:14px; cursor:pointer; padding:8px;
          font-family:inherit;
        }
        .cancel:hover { color:#888; }
      </style>
      <div class="dialog">
        <h3>Pincode invoeren</h3>
        <div class="sub">Vereist om alarmstatus te wijzigen</div>
        <div class="dots">
          ${[0,1,2,3,4,5].map(i=>`<div class="dot" data-i="${i}"></div>`).join('')}
        </div>
        <div class="pad">
          ${[1,2,3,4,5,6,7,8,9,'','0','⌫'].map(k=>`
            <button class="k ${k===''?'empty':''} ${k==='⌫'?'del':''}" data-k="${k}">${k}</button>
          `).join('')}
        </div>
        <button class="cancel">Annuleren</button>
      </div>`;

    this.shadowRoot.querySelectorAll('.k').forEach(b => {
      b.addEventListener('click', () => {
        const k = b.dataset.k;
        if (k === '') return;
        if (k === '⌫') { this._pin = this._pin.slice(0,-1); }
        else if (this._pin.length < 6) {
          this._pin += k;
          if (this._pin.length === 6) setTimeout(() => this._submit(), 220);
        }
        this._dots();
      });
    });
    this.shadowRoot.querySelector('.cancel').addEventListener('click', () => {
      this._resolve(null); this.remove();
    });
  }

  _dots() {
    this.shadowRoot.querySelectorAll('.dot').forEach((d,i) => d.classList.toggle('on', i < this._pin.length));
  }
  _submit() { this._resolve(this._pin); this.remove(); }
}
customElements.define('ajax-pin-v2', AjaxPinDialogV2);


// ─── Main Card ───────────────────────────────────────────────────────────────
class UltimateAjaxAlarmCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass = null;
    this._config = null;
    this._lastState = null;
  }

  static getConfigElement() {
    return document.createElement('ultimate-ajax-alarm-card-editor');
  }
  static getStubConfig() {
    return { entity: 'alarm_control_panel.home', name: '', code: false };
  }

  setConfig(config) {
    if (!config.entity) throw new Error('Definieer een alarm_control_panel entity');
    if (!config.entity.startsWith('alarm_control_panel.')) throw new Error('Entity moet een alarm_control_panel entity zijn');
    this._config = { entity: config.entity, name: config.name || '', code: config.code || false };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const obj = hass.states[this._config.entity];
    const state = obj ? obj.state : 'unavailable';
    if (state !== this._lastState) { this._lastState = state; this._render(); }
  }

  getCardSize() { return 5; }

  _sc()    { return STATE_CONFIG[this._lastState || 'unavailable'] || STATE_CONFIG.unavailable; }
  _night() { return this._lastState === 'armed_night'; }

  _name() {
    if (this._config.name) return this._config.name;
    const obj = this._hass && this._hass.states[this._config.entity];
    if (obj?.attributes?.friendly_name) return obj.attributes.friendly_name;
    return this._config.entity.replace('alarm_control_panel.','').replace(/_/g,' ');
  }

  _esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  _render() {
    if (!this._config) return;
    const sc          = this._sc();
    const night       = this._night();
    const isTriggered = this._lastState === 'triggered';
    const isPulse     = sc.pulse && !isTriggered;
    const name        = this._esc(this._name());

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        /* ha-card: transparent — card-mod handles background, border-radius & shadow */
        ha-card {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          overflow: hidden;
        }

        /* ── Inner wrapper — always black ─────────────── */
        .inner {
          background: #000000;
          display: flex;
          flex-direction: column;
        }

        /* ════════════════════════════════════════════════
           STATUS BLOCK
        ════════════════════════════════════════════════ */
        .status-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 52px 24px 44px;
        }

        /* Night mode: white rounded border around status block */
        .status-block.night {
          margin: 14px 14px 0 14px;
          border: 1.5px solid rgba(255,255,255,0.20);
          border-radius: 20px;
          padding: 40px 24px 36px;
        }

        /* ── Status icon ─────────────────────────────── */
        .status-icon {
          width: 100px;
          height: 100px;
          color: ${sc.color};
          filter: drop-shadow(0 0 20px ${sc.shadowColor});
          margin-bottom: 20px;
          flex-shrink: 0;
          transition: color .35s ease, filter .35s ease;
        }
        .status-icon.pulse   { animation: s-pulse 1.5s ease-in-out infinite; }
        .status-icon.blink   { animation: s-blink .55s ease-in-out infinite; }

        @keyframes s-pulse {
          0%,100% { opacity:1;   transform:scale(1); }
          50%      { opacity:0.4; transform:scale(.9); }
        }
        @keyframes s-blink {
          0%,100% { opacity:1; }
          50%      { opacity:.15; }
        }

        .status-name {
          font-size: 30px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -.5px;
          margin-bottom: 8px;
          text-align: center;
        }
        .status-state {
          font-size: 18px;
          font-weight: 500;
          color: ${sc.color};
          text-align: center;
          transition: color .35s ease;
        }

        /* ════════════════════════════════════════════════
           CONTROL GRID
           Layout: 2-column top row + full-width bottom row
        ════════════════════════════════════════════════ */
        .grid {
          background: #1C1C1E;
          display: grid;
          grid-template-columns: 1fr 1fr;
          /* ensure top row and bottom row have equal height */
          grid-template-rows: 1fr 1fr;
          /* small gap between night-mode border and grid when in night state */
          ${night ? 'margin-top: 14px;' : ''}
        }

        /* ── Single button cell ──────────────────────── */
        .btn {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 110px;
          padding: 0 16px;
          cursor: pointer;
          background: transparent;
          border: none;
          -webkit-tap-highlight-color: transparent;
          overflow: hidden;
        }

        /* Tap overlay */
        .btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0);
          transition: background .12s ease;
          pointer-events: none;
        }
        .btn:active::after { background: rgba(255,255,255,.08); }

        /* Divider lines between cells */
        .btn.tl { border-right:  1px solid rgba(255,255,255,.09);
                  border-bottom: 1px solid rgba(255,255,255,.09); }
        .btn.tr { border-bottom: 1px solid rgba(255,255,255,.09); }

        /* Bottom button spans both columns */
        .btn.bc { grid-column: 1 / -1; }

        /* ── Label ───────────────────────────────────── */
        /* Top-left cell: label top-left corner */
        .btn.tl .lbl { position:absolute; top:14px; left:16px; }
        /* Top-right cell: label top-right corner */
        .btn.tr .lbl { position:absolute; top:14px; right:16px; }
        /* Bottom full: label bottom-left corner */
        .btn.bc .lbl { position:absolute; bottom:14px; left:16px; }

        .lbl {
          font-size: 13px;
          font-weight: 400;
          color: rgba(255,255,255,.55);
          pointer-events: none;
          white-space: nowrap;
        }

        /* ── Icon ────────────────────────────────────── */
        .ico {
          width: 48px;
          height: 48px;
          color: #ffffff;
          pointer-events: none;
          flex-shrink: 0;
        }

        /* Top row: icon sits below the top label (push down slightly) */
        .btn.tl .ico,
        .btn.tr .ico { margin-top: 16px; }

        /* Bottom row: icon sits above the bottom label */
        .btn.bc .ico { margin-bottom: 16px; }
      </style>

      <ha-card>
        <div class="inner">

          <!-- STATUS BLOCK -->
          <div class="status-block ${night ? 'night' : ''}">
            <div class="status-icon ${isPulse ? 'pulse' : ''} ${isTriggered ? 'blink' : ''}">
              ${ICONS[sc.iconKey]}
            </div>
            <div class="status-name">${name}</div>
            <div class="status-state">${sc.label}</div>
          </div>

          <!-- CONTROL GRID -->
          <div class="grid">

            <!-- Inschakelen — top left -->
            <button class="btn tl" id="btn-arm" aria-label="Inschakelen">
              <span class="lbl">Inschakelen</span>
              <div class="ico">${ICONS.btn_arm}</div>
            </button>

            <!-- Uitschakelen — top right -->
            <button class="btn tr" id="btn-disarm" aria-label="Uitschakelen">
              <span class="lbl">Uitschakelen</span>
              <div class="ico">${ICONS.btn_disarm}</div>
            </button>

            <!-- Deelinschakeling — bottom full width, centered -->
            <button class="btn bc" id="btn-night" aria-label="Deelinschakeling">
              <div class="ico">${ICONS.btn_night}</div>
              <span class="lbl">Deelinschakeling</span>
            </button>

          </div>
        </div>
      </ha-card>`;

    this._attach();
  }

  _attach() {
    const r = this.shadowRoot;
    r.getElementById('btn-arm')?.addEventListener('click',    () => this._act('arm_away'));
    r.getElementById('btn-disarm')?.addEventListener('click', () => this._act('disarm'));
    r.getElementById('btn-night')?.addEventListener('click',  () => this._act('arm_night'));
  }

  async _act(action) {
    if (!this._hass || !this._config) return;
    let code;
    if (this._config.code) {
      const dlg = document.createElement('ajax-pin-v2');
      document.body.appendChild(dlg);
      code = await dlg.show();
      if (code === null) return;
    }
    const map = { arm_away:'alarm_arm_away', disarm:'alarm_disarm', arm_night:'alarm_arm_night' };
    const data = { entity_id: this._config.entity };
    if (code !== undefined) data.code = code;
    try {
      await this._hass.callService('alarm_control_panel', map[action], data);
    } catch(e) {
      console.error('[UltimateAjaxAlarmCard] Service error:', e);
    }
  }
}


// ─── GUI Config Editor ────────────────────────────────────────────────────────
class UltimateAjaxAlarmCardEditor extends HTMLElement {
  constructor() { super(); this.attachShadow({mode:'open'}); this._c = {}; }
  setConfig(c)  { this._c = {...c}; this._r(); }

  _r() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; padding:16px; }
        .row  { margin-bottom:16px; }
        label { display:block; font-size:12px; color:var(--secondary-text-color); margin-bottom:4px; }
        input[type=text] {
          width:100%; padding:8px; box-sizing:border-box;
          border:1px solid var(--divider-color); border-radius:4px;
          background:var(--card-background-color); color:var(--primary-text-color); font-size:14px;
        }
        .tr { display:flex; align-items:center; gap:8px; }
        .tr label { margin:0; font-size:14px; color:var(--primary-text-color); }
      </style>
      <div class="row">
        <label>Entity (alarm_control_panel.*)</label>
        <input type="text" id="entity" value="${this._c.entity||''}" placeholder="alarm_control_panel.home"/>
      </div>
      <div class="row">
        <label>Naam (optioneel)</label>
        <input type="text" id="name" value="${this._c.name||''}" placeholder="Laat leeg voor automatisch"/>
      </div>
      <div class="row tr">
        <input type="checkbox" id="code" ${this._c.code?'checked':''}/>
        <label for="code">Pincode vereisen</label>
      </div>`;

    ['entity','name'].forEach(f => {
      this.shadowRoot.getElementById(f).addEventListener('change', e => {
        this._c = {...this._c, [f]: e.target.value};
        this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this._c}}));
      });
    });
    this.shadowRoot.getElementById('code').addEventListener('change', e => {
      this._c = {...this._c, code: e.target.checked};
      this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this._c}}));
    });
  }
}


// ─── Register ─────────────────────────────────────────────────────────────────
customElements.define('ultimate-ajax-alarm-card',        UltimateAjaxAlarmCard);
customElements.define('ultimate-ajax-alarm-card-editor', UltimateAjaxAlarmCardEditor);

window.customCards = window.customCards || [];
if (!window.customCards.find(c => c.type === 'ultimate-ajax-alarm-card')) {
  window.customCards.push({
    type: 'ultimate-ajax-alarm-card',
    name: 'Ultimate Ajax Systems Alarm Card',
    description: 'Alarmkaart die de Ajax Systems app nabootst — Uitgeschakeld, Ingeschakeld, Deelinschakeling',
    preview: true,
    documentationURL: 'https://github.com/Sven2410/ultimate-ajax-alarm-card',
  });
}

console.info(
  `%c ULTIMATE-AJAX-ALARM-CARD %c v${CARD_VERSION} `,
  'background:#00C853;color:#000;font-weight:700;padding:2px 6px;border-radius:4px 0 0 4px;',
  'background:#1C1C1E;color:#00C853;font-weight:700;padding:2px 6px;border-radius:0 4px 4px 0;'
);
