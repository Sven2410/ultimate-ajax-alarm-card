/**
 * Ultimate Ajax Systems Alarm Card
 * A Home Assistant Lovelace card mimicking the Ajax Systems alarm app UI
 * Author: Sven2410
 * Repository: https://github.com/Sven2410/ultimate-ajax-alarm-card
 * License: MIT
 */

const CARD_VERSION = '1.0.0';

// ─── State configuration ───────────────────────────────────────────────────
const STATE_CONFIG = {
  disarmed: {
    label: 'Disarmed',
    color: '#00C853',
    shadowColor: 'rgba(0, 200, 83, 0.35)',
    icon: 'disarmed',
    pulse: false,
  },
  armed_away: {
    label: 'Armed',
    color: '#FF5252',
    shadowColor: 'rgba(255, 82, 82, 0.35)',
    icon: 'armed',
    pulse: false,
  },
  armed_home: {
    label: 'Armed',
    color: '#FF5252',
    shadowColor: 'rgba(255, 82, 82, 0.35)',
    icon: 'armed',
    pulse: false,
  },
  armed: {
    label: 'Armed',
    color: '#FF5252',
    shadowColor: 'rgba(255, 82, 82, 0.35)',
    icon: 'armed',
    pulse: false,
  },
  armed_night: {
    label: 'Night mode',
    color: '#7C4DFF',
    shadowColor: 'rgba(124, 77, 255, 0.35)',
    icon: 'night',
    pulse: false,
  },
  arming: {
    label: 'Arming…',
    color: '#FF5252',
    shadowColor: 'rgba(255, 82, 82, 0.35)',
    icon: 'armed',
    pulse: true,
  },
  pending: {
    label: 'Pending…',
    color: '#FF9800',
    shadowColor: 'rgba(255, 152, 0, 0.35)',
    icon: 'armed',
    pulse: true,
  },
  triggered: {
    label: 'Triggered!',
    color: '#FF1744',
    shadowColor: 'rgba(255, 23, 68, 0.5)',
    icon: 'armed',
    pulse: true,
  },
  unavailable: {
    label: 'Unavailable',
    color: '#555555',
    shadowColor: 'rgba(85, 85, 85, 0.2)',
    icon: 'disarmed',
    pulse: false,
  },
};

// ─── SVG Icons ─────────────────────────────────────────────────────────────
const ICONS = {
  // Open circle — Disarmed / Arm button
  disarmed: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="28" r="22" stroke="currentColor" stroke-width="4"/>
  </svg>`,

  // Filled circle — Armed state indicator
  armed: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="28" r="22" stroke="currentColor" stroke-width="4"/>
  </svg>`,

  // Undo/partial arc — Disarm button
  disarm: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M 10 28 A 18 18 0 1 1 28 46" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
  </svg>`,

  // Night mode — double ring
  night: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="28" r="22" stroke="currentColor" stroke-width="4"/>
    <circle cx="28" cy="28" r="12" stroke="currentColor" stroke-width="4"/>
  </svg>`,

  // Arm button icon (open circle)
  arm: `<svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="28" cy="28" r="22" stroke="currentColor" stroke-width="4"/>
  </svg>`,
};

// ─── PIN Dialog ─────────────────────────────────────────────────────────────
class PinDialog extends HTMLElement {
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
          background: rgba(0,0,0,0.75);
          backdrop-filter: blur(6px);
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
        }
        .dialog {
          background: #1A1A1A;
          border-radius: 20px;
          padding: 32px 28px 24px;
          width: 280px;
          box-shadow: 0 24px 60px rgba(0,0,0,0.8);
        }
        h3 {
          color: #fff;
          text-align: center;
          margin: 0 0 8px;
          font-size: 18px;
          font-weight: 600;
        }
        .subtitle {
          color: #888;
          text-align: center;
          font-size: 13px;
          margin-bottom: 24px;
        }
        .pin-display {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 28px;
        }
        .dot {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          border: 2px solid #444;
          transition: all 0.15s ease;
        }
        .dot.filled {
          background: #00C853;
          border-color: #00C853;
          box-shadow: 0 0 8px rgba(0,200,83,0.5);
        }
        .numpad {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        .num-btn {
          background: #2A2A2A;
          border: none;
          border-radius: 12px;
          color: #fff;
          font-size: 20px;
          font-weight: 500;
          height: 60px;
          cursor: pointer;
          transition: background 0.1s ease, transform 0.1s ease;
          font-family: inherit;
        }
        .num-btn:active {
          background: #3A3A3A;
          transform: scale(0.95);
        }
        .num-btn.del {
          font-size: 14px;
          color: #888;
        }
        .num-btn.ok {
          background: #00C853;
          color: #000;
          font-weight: 700;
          font-size: 14px;
        }
        .num-btn.ok:active { background: #00A846; }
        .cancel-btn {
          margin-top: 16px;
          width: 100%;
          background: none;
          border: none;
          color: #666;
          font-size: 14px;
          cursor: pointer;
          padding: 8px;
          font-family: inherit;
        }
        .cancel-btn:hover { color: #999; }
      </style>
      <div class="dialog">
        <h3>Enter PIN code</h3>
        <div class="subtitle">Required to change alarm state</div>
        <div class="pin-display">
          <div class="dot" data-idx="0"></div>
          <div class="dot" data-idx="1"></div>
          <div class="dot" data-idx="2"></div>
          <div class="dot" data-idx="3"></div>
          <div class="dot" data-idx="4"></div>
          <div class="dot" data-idx="5"></div>
        </div>
        <div class="numpad">
          ${[1,2,3,4,5,6,7,8,9,'','0','⌫'].map(k => `
            <button class="num-btn ${k===''?'empty':''} ${k==='⌫'?'del':''}" data-key="${k}">${k}</button>
          `).join('')}
        </div>
        <button class="cancel-btn">Cancel</button>
      </div>
    `;

    this.shadowRoot.querySelectorAll('.num-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.key;
        if (key === '') return;
        if (key === '⌫') {
          this._pin = this._pin.slice(0, -1);
        } else if (this._pin.length < 6) {
          this._pin += key;
          if (this._pin.length === 6) {
            setTimeout(() => this._submit(), 200);
          }
        }
        this._updateDots();
      });
    });

    this.shadowRoot.querySelector('.cancel-btn').addEventListener('click', () => {
      this._resolve(null);
      this.remove();
    });
  }

  _updateDots() {
    this.shadowRoot.querySelectorAll('.dot').forEach((dot, i) => {
      dot.classList.toggle('filled', i < this._pin.length);
    });
  }

  _submit() {
    this._resolve(this._pin);
    this.remove();
  }
}
customElements.define('ajax-pin-dialog', PinDialog);

// ─── Main Card ──────────────────────────────────────────────────────────────
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
    if (!config.entity) {
      throw new Error('Please define an alarm_control_panel entity');
    }
    if (!config.entity.startsWith('alarm_control_panel.')) {
      throw new Error('Entity must be an alarm_control_panel entity');
    }
    this._config = {
      entity: config.entity,
      name: config.name || '',
      code: config.code || false,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    const stateObj = hass.states[this._config.entity];
    const state = stateObj ? stateObj.state : 'unavailable';
    if (state !== this._lastState) {
      this._lastState = state;
      this._render();
    }
  }

  getCardSize() { return 4; }

  _getStateConfig() {
    const state = this._lastState || 'unavailable';
    return STATE_CONFIG[state] || STATE_CONFIG.unavailable;
  }

  _getName() {
    if (this._config.name) return this._config.name;
    const stateObj = this._hass && this._hass.states[this._config.entity];
    if (stateObj && stateObj.attributes.friendly_name) {
      return stateObj.attributes.friendly_name;
    }
    return this._config.entity.replace('alarm_control_panel.', '').replace(/_/g, ' ');
  }

  _isNightMode() {
    return this._lastState === 'armed_night';
  }

  _render() {
    if (!this._config) return;
    const sc = this._getStateConfig();
    const name = this._getName();
    const nightMode = this._isNightMode();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
        }

        .card-root {
          background: #000000;
          border-radius: 0;
          overflow: hidden;
          user-select: none;
        }

        /* ── Status block ── */
        .status-block {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 24px 40px;
          position: relative;
          transition: all 0.4s ease;
        }

        .status-block.night-mode {
          border: 2px solid rgba(255,255,255,0.15);
          border-radius: 20px;
          margin: 12px;
        }

        .status-icon-wrap {
          width: 88px;
          height: 88px;
          position: relative;
          margin-bottom: 24px;
        }

        .status-icon {
          width: 88px;
          height: 88px;
          color: ${sc.color};
          filter: drop-shadow(0 0 16px ${sc.shadowColor});
          transition: color 0.4s ease, filter 0.4s ease;
        }

        .status-icon.pulse {
          animation: pulse-ring 1.4s ease-in-out infinite;
        }

        .status-icon.triggered-blink {
          animation: triggered-blink 0.5s ease-in-out infinite;
        }

        @keyframes pulse-ring {
          0%   { opacity: 1; transform: scale(1); }
          50%  { opacity: 0.5; transform: scale(0.92); }
          100% { opacity: 1; transform: scale(1); }
        }

        @keyframes triggered-blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.2; }
        }

        .status-name {
          font-size: 28px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.3px;
          margin-bottom: 6px;
          text-align: center;
        }

        .status-state {
          font-size: 17px;
          font-weight: 500;
          color: ${sc.color};
          letter-spacing: 0.1px;
          text-align: center;
          transition: color 0.4s ease;
        }

        /* ── Control grid ── */
        .control-grid {
          background: #1C1C1E;
          border-radius: 18px;
          margin: 0 0 0 0;
          overflow: hidden;
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
        }

        .ctrl-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 28px 16px;
          cursor: pointer;
          position: relative;
          transition: background 0.15s ease;
          border: none;
          background: transparent;
          -webkit-tap-highlight-color: transparent;
        }

        .ctrl-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: rgba(255,255,255,0);
          transition: background 0.15s ease;
        }

        .ctrl-btn:active::after {
          background: rgba(255,255,255,0.07);
        }

        /* Divider lines */
        .ctrl-btn:nth-child(1) {
          border-right: 1px solid rgba(255,255,255,0.08);
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .ctrl-btn:nth-child(2) {
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }
        .ctrl-btn:nth-child(3) {
          border-right: 1px solid rgba(255,255,255,0.08);
        }

        .ctrl-icon {
          width: 44px;
          height: 44px;
          color: #ffffff;
          margin-bottom: 12px;
        }

        .ctrl-label {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.6);
          letter-spacing: 0.1px;
          text-align: center;
        }

        /* Label position — Ajax puts label above or below depending on row */
        .ctrl-btn:nth-child(1) .ctrl-label,
        .ctrl-btn:nth-child(2) .ctrl-label {
          position: absolute;
          top: 14px;
          left: 0; right: 0;
          text-align: left;
          padding-left: 18px;
          font-size: 13px;
          color: rgba(255,255,255,0.55);
        }

        .ctrl-btn:nth-child(3) .ctrl-label,
        .ctrl-btn:nth-child(4) .ctrl-label {
          position: absolute;
          bottom: 14px;
          left: 0; right: 0;
          text-align: left;
          padding-left: 18px;
          font-size: 13px;
          color: rgba(255,255,255,0.55);
        }

        .ctrl-btn:nth-child(2) .ctrl-label,
        .ctrl-btn:nth-child(4) .ctrl-label {
          text-align: right;
          padding-right: 18px;
          padding-left: 0;
        }
      </style>

      <ha-card class="card-root">
        <div class="status-block ${nightMode ? 'night-mode' : ''}">
          <div class="status-icon-wrap">
            <div class="status-icon ${sc.pulse ? (this._lastState === 'triggered' ? 'triggered-blink' : 'pulse') : ''}">
              ${ICONS[sc.icon]}
            </div>
          </div>
          <div class="status-name">${this._escapeHtml(name)}</div>
          <div class="status-state">${sc.label}</div>
        </div>

        <div class="control-grid">
          <button class="ctrl-btn" id="btn-arm" aria-label="Arm">
            <span class="ctrl-label">Arm</span>
            <div class="ctrl-icon">${ICONS.arm}</div>
          </button>
          <button class="ctrl-btn" id="btn-disarm" aria-label="Disarm">
            <span class="ctrl-label">Disarm</span>
            <div class="ctrl-icon">${ICONS.disarm}</div>
          </button>
          <button class="ctrl-btn" id="btn-night" aria-label="Night mode">
            <div class="ctrl-icon">${ICONS.night}</div>
            <span class="ctrl-label">Night mode</span>
          </button>
          <button class="ctrl-btn" id="btn-panic" aria-label="Panic" style="opacity:0.3;pointer-events:none;">
            <div class="ctrl-icon">
              <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="28" cy="28" r="22" fill="currentColor"/>
                <text x="28" y="35" text-anchor="middle" fill="#1C1C1E" font-size="22" font-weight="700" font-family="-apple-system,sans-serif">!</text>
              </svg>
            </div>
            <span class="ctrl-label">Panic</span>
          </button>
        </div>
      </ha-card>
    `;

    this._attachListeners();
  }

  _attachListeners() {
    const root = this.shadowRoot;

    root.getElementById('btn-arm')?.addEventListener('click', () => this._handleAction('arm_away'));
    root.getElementById('btn-disarm')?.addEventListener('click', () => this._handleAction('disarm'));
    root.getElementById('btn-night')?.addEventListener('click', () => this._handleAction('arm_night'));
  }

  async _handleAction(action) {
    if (!this._hass || !this._config) return;

    let code = undefined;

    if (this._config.code) {
      const dialog = document.createElement('ajax-pin-dialog');
      document.body.appendChild(dialog);
      code = await dialog.show();
      if (code === null) return; // cancelled
    }

    const serviceMap = {
      arm_away:  'alarm_arm_away',
      disarm:    'alarm_disarm',
      arm_night: 'alarm_arm_night',
    };

    const service = serviceMap[action];
    if (!service) return;

    const serviceData = { entity_id: this._config.entity };
    if (code !== undefined) serviceData.code = code;

    try {
      await this._hass.callService('alarm_control_panel', service, serviceData);
    } catch (e) {
      console.error('[UltimateAjaxAlarmCard] Service call failed:', e);
    }
  }

  _escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// ─── Visual Card Editor (for GUI config) ────────────────────────────────────
class UltimateAjaxAlarmCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = {};
  }

  setConfig(config) {
    this._config = { ...config };
    this._render();
  }

  _render() {
    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; padding: 16px; }
        .row { margin-bottom: 16px; }
        label { display: block; font-size: 12px; color: var(--secondary-text-color); margin-bottom: 4px; }
        input[type="text"] {
          width: 100%; padding: 8px; box-sizing: border-box;
          border: 1px solid var(--divider-color);
          border-radius: 4px; background: var(--card-background-color);
          color: var(--primary-text-color); font-size: 14px;
        }
        .toggle-row { display: flex; align-items: center; gap: 8px; }
        .toggle-row label { margin: 0; font-size: 14px; color: var(--primary-text-color); }
      </style>
      <div class="row">
        <label>Entity (alarm_control_panel.*)</label>
        <input type="text" id="entity" value="${this._config.entity || ''}" placeholder="alarm_control_panel.home"/>
      </div>
      <div class="row">
        <label>Name (optional, overrides entity name)</label>
        <input type="text" id="name" value="${this._config.name || ''}" placeholder="Leave empty for auto"/>
      </div>
      <div class="row toggle-row">
        <input type="checkbox" id="code" ${this._config.code ? 'checked' : ''}/>
        <label for="code">Require PIN code</label>
      </div>
    `;

    ['entity', 'name'].forEach(field => {
      this.shadowRoot.getElementById(field).addEventListener('change', e => {
        this._config = { ...this._config, [field]: e.target.value };
        this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config } }));
      });
    });

    this.shadowRoot.getElementById('code').addEventListener('change', e => {
      this._config = { ...this._config, code: e.target.checked };
      this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config } }));
    });
  }
}

// ─── Register ────────────────────────────────────────────────────────────────
customElements.define('ultimate-ajax-alarm-card', UltimateAjaxAlarmCard);
customElements.define('ultimate-ajax-alarm-card-editor', UltimateAjaxAlarmCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: 'ultimate-ajax-alarm-card',
  name: 'Ultimate Ajax Systems Alarm Card',
  description: 'Alarm card that mimics the Ajax Systems app UI — Disarmed, Armed, Night mode',
  preview: true,
  documentationURL: 'https://github.com/Sven2410/ultimate-ajax-alarm-card',
});

console.info(
  `%c ULTIMATE-AJAX-ALARM-CARD %c v${CARD_VERSION} `,
  'background:#00C853;color:#000;font-weight:700;padding:2px 6px;border-radius:4px 0 0 4px;',
  'background:#1C1C1E;color:#00C853;font-weight:700;padding:2px 6px;border-radius:0 4px 4px 0;'
);
