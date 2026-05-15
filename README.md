# Ultimate Ajax Systems Alarm Card

A [Home Assistant](https://www.home-assistant.io/) Lovelace custom card that replicates the **Ajax Systems** alarm app interface — including Disarmed (green), Armed (red) and Night mode (purple) states.

![Card states: Disarmed, Armed, Night mode](https://raw.githubusercontent.com/Sven2410/ultimate-ajax-alarm-card/main/assets/preview.png)

---

## Features

- ✅ Pixel-accurate Ajax Systems UI (colors, icons, layout)
- ✅ **Disarmed** → green `#00C853`
- ✅ **Armed** → red `#FF5252`
- ✅ **Night mode** → purple `#7C4DFF` with white border
- ✅ Smooth state transitions with pulse/blink animations for `arming`, `pending`, `triggered`
- ✅ Optional PIN code dialog
- ✅ GUI config editor (no YAML required)
- ✅ HACS compatible

---

## Installation

### Via HACS (recommended)

1. Open HACS in Home Assistant
2. Go to **Frontend**
3. Click the three dots → **Custom repositories**
4. Add `https://github.com/Sven2410/ultimate-ajax-alarm-card` as category **Lovelace**
5. Click **Install**
6. Reload your browser

### Manual

1. Download `dist/ultimate-ajax-alarm-card.js` from the [latest release](https://github.com/Sven2410/ultimate-ajax-alarm-card/releases/latest)
2. Copy it to `config/www/ultimate-ajax-alarm-card.js`
3. In Home Assistant go to **Settings → Dashboards → Resources** and add:
   ```
   /local/ultimate-ajax-alarm-card.js   (type: JavaScript module)
   ```
4. Reload your browser

---

## Configuration

### Via GUI

Add the card to your dashboard and use the visual editor to select your entity, set an optional name and toggle PIN code requirement.

### Via YAML

```yaml
type: custom:ultimate-ajax-alarm-card
entity: alarm_control_panel.home
name: Putman          # optional — overrides entity friendly_name
code: false           # optional — set to true to show PIN dialog on action
```

### Options

| Option   | Type    | Default                     | Description                                 |
|----------|---------|-----------------------------|---------------------------------------------|
| `entity` | string  | **required**                | `alarm_control_panel.*` entity              |
| `name`   | string  | entity's `friendly_name`    | Location name shown on the card             |
| `code`   | boolean | `false`                     | Show PIN code dialog before sending command |

---

## States

| HA state       | Card label   | Color   |
|----------------|-------------|---------|
| `disarmed`     | Disarmed    | 🟢 Green |
| `armed_away`   | Armed       | 🔴 Red   |
| `armed_home`   | Armed       | 🔴 Red   |
| `armed_night`  | Night mode  | 🟣 Purple |
| `arming`       | Arming…     | 🔴 Red (pulse) |
| `pending`      | Pending…    | 🟠 Orange (pulse) |
| `triggered`    | Triggered!  | 🔴 Red (blink) |
| `unavailable`  | Unavailable | ⚫ Grey  |

---

## Ajax Integration for Home Assistant

This card works with any `alarm_control_panel` entity. For native Ajax Systems integration, use the [Ajax Systems integration](https://www.home-assistant.io/integrations/ajax_systems/) or a community integration.

---

## License

[MIT](LICENSE) © [Sven2410](https://github.com/Sven2410)
