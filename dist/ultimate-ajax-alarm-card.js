/**
 * Ultimate Ajax Systems Alarm Card
 * Author: Sven2410
 * https://github.com/Sven2410/ultimate-ajax-alarm-card
 * License: MIT — v1.2.0
 */

const CARD_VERSION = '1.2.0';

// ─── State config ────────────────────────────────────────────────────────────
// Green is slightly lighter: #26D65B instead of #00C853
const STATE_CONFIG = {
  disarmed: {
    label: 'Uitgeschakeld',
    color: '#26D65B',
    shadow: 'rgba(38,214,91,0.45)',
    iconKey: 'status_disarmed',
    pulse: false,
  },
  armed_away: {
    label: 'Ingeschakeld',
    color: '#E8604C',
    shadow: 'rgba(232,96,76,0.45)',
    iconKey: 'status_armed',
    pulse: false,
  },
  armed_home: {
    label: 'Ingeschakeld',
    color: '#E8604C',
    shadow: 'rgba(232,96,76,0.45)',
    iconKey: 'status_armed',
    pulse: false,
  },
  armed: {
    label: 'Ingeschakeld',
    color: '#E8604C',
    shadow: 'rgba(232,96,76,0.45)',
    iconKey: 'status_armed',
    pulse: false,
  },
  armed_night: {
    label: 'Deelinschakeling',
    color: '#7C4DFF',
    shadow: 'rgba(124,77,255,0.45)',
    iconKey: 'status_night',
    pulse: false,
  },
  arming: {
    label: 'Inschakelen\u2026',
    color: '#E8604C',
    shadow: 'rgba(232,96,76,0.45)',
    iconKey: 'status_armed',
    pulse: true,
  },
  pending: {
    label: 'Wachten\u2026',
    color: '#FF9800',
    shadow: 'rgba(255,152,0,0.45)',
    iconKey: 'status_armed',
    pulse: true,
  },
  triggered: {
    label: 'Alarm!',
    color: '#FF1744',
    shadow: 'rgba(255,23,68,0.6)',
    iconKey: 'status_armed',
    pulse: true,
  },
  unavailable: {
    label: 'Niet beschikbaar',
    color: '#555',
    shadow: 'rgba(85,85,85,0.2)',
    iconKey: 'status_disarmed',
    pulse: false,
  },
};

// ─── SVG helpers ─────────────────────────────────────────────────────────────
// All arcs: center (cx,cy), radius r, gap on the LEFT side.
// We draw from ~240° to ~120° clockwise — that's a ~240° arc passing through
// the top, right and bottom, leaving a gap at 9 o'clock (left).
//
// Point at angle θ (degrees, SVG convention: 0°=right, 90°=down):
//   x = cx + r*cos(θ·π/180)
//   y = cy + r*sin(θ·π/180)
//
// Status icons use viewBox="0 0 80 80", center=40,40
// Button icons use viewBox="0 0 56 56", center=28,28

// Rounded arc-start/end at ±120° from the left (180°):
//   start = 240° (upper-left)
//   end   = 120° (lower-left)
// Large arc + clockwise → sweep=1, large=1

function arcPath(cx, cy, r) {
  // 240° → upper-left gap corner
  const sx = cx + r * Math.cos(240 * Math.PI / 180);
  const sy = cy + r * Math.sin(240 * Math.PI / 180);
  // 120° → lower-left gap corner
  const ex = cx + r * Math.cos(120 * Math.PI / 180);
  const ey = cy + r * Math.sin(120 * Math.PI / 180);
  // Format to 2 decimals
  const f = n => Math.round(n * 100) / 100;
  return `M ${f(sx)} ${f(sy)} A ${r} ${r} 0 1 1 ${f(ex)} ${f(ey)}`;
}

const ICONS = {
  // ── Status: Uitgeschakeld — ~240° open arc, gap LEFT
  status_disarmed: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="${arcPath(40,40,26)}" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/>
  </svg>`,

  // ── Status: Ingeschakeld — full ring
  status_armed: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="26" stroke="currentColor" stroke-width="4.5"/>
  </svg>`,

  // ── Status: Deelinschakeling — outer full ring + inner open arc, gap LEFT
  status_night: `<svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="40" cy="40" r="26" stroke="currentColor" stroke-width="4.5"/>
    <path d="${arcPath(40,40,13)}" stroke="currentColor" stroke-width="4.5" stroke-linecap="round"/>
  </svg>`,

  // ── Button: Inschakelen — open arc gap LEFT (same style as status disarmed)
  btn_arm: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="${arcPath(28,28,19)}" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
  </svg>`,

  // ── Button: Uitschakelen — undo arc, gap at top-right (Ajax style)
  // This one is intentionally different: ~200° arc opening at top-right
  btn_disarm: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M 43 17 A 19 19 0 1 0 43 39" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
  </svg>`,

  // ── Button: Deelinschakeling — outer full ring + inner open arc, gap LEFT
  btn_night: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="28" r="19" stroke="currentColor" stroke-width="3.5"/>
    <path d="${arcPath(28,28,10)}" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/>
  </svg>`,
};


// ─── PIN Dialog ───────────────────────────────────────────────────────────────
class AjaxPinV2 extends HTMLElement {
  constructor() { super(); this.attachShadow({mode:'open'}); this._pin=''; this._resolve=null; }
  show() { return new Promise(r => { this._resolve=r; this._pin=''; this._render(); }); }
  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { position:fixed; inset:0; z-index:9999; display:flex; align-items:center; justify-content:center;
          background:rgba(0,0,0,.78); backdrop-filter:blur(8px);
          font-family:-apple-system,BlinkMacSystemFont,'SF Pro Display','Helvetica Neue',sans-serif; }
        .d { background:#1A1A1A; border-radius:24px; padding:32px 28px 24px; width:280px; box-shadow:0 24px 60px rgba(0,0,0,.9); }
        h3 { color:#fff; text-align:center; margin:0 0 6px; font-size:18px; font-weight:600; }
        .sub { color:#666; text-align:center; font-size:13px; margin-bottom:24px; }
        .dots { display:flex; justify-content:center; gap:12px; margin-bottom:28px; }
        .dot { width:13px; height:13px; border-radius:50%; border:2px solid #444; transition:all .12s; }
        .dot.on { background:#26D65B; border-color:#26D65B; box-shadow:0 0 8px rgba(38,214,91,.5); }
        .pad { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; }
        .k { background:#2A2A2A; border:none; border-radius:12px; color:#fff; font-size:22px; height:62px;
          cursor:pointer; font-family:inherit; transition:background .1s,transform .1s; }
        .k:active { background:#3A3A3A; transform:scale(.95); }
        .k.empty { visibility:hidden; }
        .k.del { font-size:16px; color:#888; }
        .cancel { margin-top:16px; width:100%; background:none; border:none; color:#555; font-size:14px;
          cursor:pointer; padding:8px; font-family:inherit; }
        .cancel:hover { color:#888; }
      </style>
      <div class="d">
        <h3>Pincode invoeren</h3>
        <div class="sub">Vereist om alarmstatus te wijzigen</div>
        <div class="dots">${[0,1,2,3,4,5].map(i=>`<div class="dot" data-i="${i}"></div>`).join('')}</div>
        <div class="pad">${[1,2,3,4,5,6,7,8,9,'','0','⌫'].map(k=>
          `<button class="k ${k===''?'empty':''} ${k==='⌫'?'del':''}" data-k="${k}">${k}</button>`).join('')}
        </div>
        <button class="cancel">Annuleren</button>
      </div>`;
    this.shadowRoot.querySelectorAll('.k').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.k;
      if (k==='') return;
      if (k==='⌫') { this._pin=this._pin.slice(0,-1); }
      else if (this._pin.length<6) { this._pin+=k; if(this._pin.length===6) setTimeout(()=>this._done(),220); }
      this.shadowRoot.querySelectorAll('.dot').forEach((d,i)=>d.classList.toggle('on',i<this._pin.length));
    }));
    this.shadowRoot.querySelector('.cancel').addEventListener('click',()=>{this._resolve(null);this.remove();});
  }
  _done() { this._resolve(this._pin); this.remove(); }
}
customElements.define('ajax-pin-v2', AjaxPinV2);


// ─── Main Card ────────────────────────────────────────────────────────────────
class UltimateAjaxAlarmCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._hass   = null;
    this._config = null;
    this._state  = null;  // last rendered state string
  }

  static getConfigElement() { return document.createElement('ultimate-ajax-alarm-card-editor'); }
  static getStubConfig()    { return { entity:'alarm_control_panel.home', name:'', code:false }; }

  setConfig(config) {
    if (!config.entity)
      throw new Error('Definieer een alarm_control_panel entity');
    if (!config.entity.startsWith('alarm_control_panel.'))
      throw new Error('Entity moet beginnen met alarm_control_panel.');
    this._config = { entity:config.entity, name:config.name||'', code:config.code||false };
    // Re-render immediately in case hass is already set
    if (this._hass) this._syncAndRender();
    else this._render('unavailable');
  }

  // ── HA pushes state changes here — covers both UI-triggered and Ajax-triggered changes ──
  set hass(hass) {
    this._hass = hass;
    if (!this._config) return;
    const obj   = hass.states[this._config.entity];
    const state = obj ? obj.state : 'unavailable';
    // Always update — re-render on ANY state change regardless of origin
    if (state !== this._state) {
      this._state = state;
      this._render(state);
    }
  }

  getCardSize() { return 5; }

  _syncAndRender() {
    const obj   = this._hass.states[this._config.entity];
    const state = obj ? obj.state : 'unavailable';
    this._state = state;
    this._render(state);
  }

  _sc(state) {
    return STATE_CONFIG[state] || STATE_CONFIG.unavailable;
  }

  _name() {
    if (this._config.name) return this._config.name;
    const obj = this._hass && this._hass.states[this._config.entity];
    return obj?.attributes?.friendly_name
      || this._config.entity.replace('alarm_control_panel.','').replace(/_/g,' ');
  }

  _esc(s) {
    return String(s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  _render(state) {
    const sc          = this._sc(state);
    const night       = state === 'armed_night';
    const isTriggered = state === 'triggered';
    const isPulse     = sc.pulse && !isTriggered;
    const name        = this._esc(this._name());

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        /* ha-card transparent — card-mod handles border-radius/shadow/backdrop */
        ha-card {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
          padding: 0 !important;
          overflow: hidden;
        }

        /* ── Inner wrapper — solid black fill ─────────── */
        .inner {
          background: #000;
          display: flex;
          flex-direction: column;
        }

        /* ════════════════════════════════════════════
           STATUS BLOCK
        ════════════════════════════════════════════ */
        .status-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 52px 24px 44px;
        }
        /* Night mode: white border */
        .status-block.night {
          margin: 14px 14px 0;
          border: 1.5px solid rgba(255,255,255,.20);
          border-radius: 20px;
          padding: 40px 24px 36px;
        }

        .status-icon {
          width: 100px;
          height: 100px;
          color: ${sc.color};
          filter: drop-shadow(0 0 18px ${sc.shadow});
          margin-bottom: 20px;
          flex-shrink: 0;
          transition: color .35s ease, filter .35s ease;
        }
        .status-icon.pulse { animation: s-pulse 1.5s ease-in-out infinite; }
        .status-icon.blink { animation: s-blink .55s ease-in-out infinite; }

        @keyframes s-pulse {
          0%,100% { opacity:1;   transform:scale(1); }
          50%      { opacity:.35; transform:scale(.9); }
        }
        @keyframes s-blink {
          0%,100% { opacity:1; }
          50%      { opacity:.1; }
        }

        .status-name {
          font-size: 30px;
          font-weight: 700;
          color: #fff;
          letter-spacing: -.5px;
          margin-bottom: 8px;
          text-align: center;
        }
        .status-state {
          font-size: 18px;
          font-weight: 500;
          color: ${sc.color};
          text-align: center;
          transition: color .35s;
        }

        /* ════════════════════════════════════════════
           CONTROL GRID
           2 columns, top row + full-width bottom row
        ════════════════════════════════════════════ */
        .grid {
          background: #1C1C1E;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          ${night ? 'margin-top: 14px;' : ''}
        }

        /* ── Button cell ──────────────────────────── */
        .btn {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 110px;
          padding: 14px 16px;
          cursor: pointer;
          background: transparent;
          border: none;
          -webkit-tap-highlight-color: transparent;
          gap: 8px;       /* space between label and icon */
        }

        /* Press feedback */
        .btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: transparent;
          transition: background .12s;
          pointer-events: none;
        }
        .btn:active::after { background: rgba(255,255,255,.08); }

        /* Divider lines */
        .btn.tl { border-right:  1px solid rgba(255,255,255,.09);
                  border-bottom: 1px solid rgba(255,255,255,.09); }
        .btn.tr { border-bottom: 1px solid rgba(255,255,255,.09); }
        .btn.bc { grid-column: 1 / -1; }

        /* ── Label — centered, ABOVE icon (top row) or BELOW icon (bottom row) ── */
        .lbl {
          font-size: 13px;
          font-weight: 400;
          color: rgba(255,255,255,.55);
          text-align: center;
          white-space: nowrap;
          pointer-events: none;
          line-height: 1;
        }

        /* ── Icon ─────────────────────────────────── */
        .ico {
          width: 48px;
          height: 48px;
          color: #fff;
          pointer-events: none;
          flex-shrink: 0;
        }
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

            <!-- Inschakelen — top left — label ABOVE icon -->
            <button class="btn tl" id="btn-arm" aria-label="Inschakelen">
              <span class="lbl">Inschakelen</span>
              <div class="ico">${ICONS.btn_arm}</div>
            </button>

            <!-- Uitschakelen — top right — label ABOVE icon -->
            <button class="btn tr" id="btn-disarm" aria-label="Uitschakelen">
              <span class="lbl">Uitschakelen</span>
              <div class="ico">${ICONS.btn_disarm}</div>
            </button>

            <!-- Deelinschakeling — bottom full width — icon ABOVE label -->
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
    const map = {
      arm_away:  'alarm_arm_away',
      disarm:    'alarm_disarm',
      arm_night: 'alarm_arm_night',
    };
    const data = { entity_id: this._config.entity };
    if (code !== undefined) data.code = code;
    try {
      await this._hass.callService('alarm_control_panel', map[action], data);
    } catch(e) {
      console.error('[UltimateAjaxAlarmCard] Service call error:', e);
    }
  }
}


// ─── GUI Config Editor ────────────────────────────────────────────────────────
class UltimateAjaxAlarmCardEditor extends HTMLElement {
  constructor() { super(); this.attachShadow({mode:'open'}); this._c={}; }
  setConfig(c) { this._c={...c}; this._r(); }
  _fire()      { this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this._c}})); }
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
        this._c={...this._c,[f]:e.target.value}; this._fire();
      });
    });
    this.shadowRoot.getElementById('code').addEventListener('change', e => {
      this._c={...this._c,code:e.target.checked}; this._fire();
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
  'background:#26D65B;color:#000;font-weight:700;padding:2px 6px;border-radius:4px 0 0 4px;',
  'background:#1C1C1E;color:#26D65B;font-weight:700;padding:2px 6px;border-radius:0 4px 4px 0;'
);
