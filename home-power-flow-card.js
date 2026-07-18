const CARD_VERSION = "0.1.0";

const DEFAULT_CONFIG = {
  title: "Home Energy System",
  subtitle: "Live power flow",
  precision: 1,
  show_zero_flows: false,
  thresholds: {
    solar: 20,
    battery: 20,
    grid: 20,
  },
};

const ICONS = {
  sun: `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="10"/><path d="M32 4v10M32 50v10M4 32h10M50 32h10M12 12l7 7M45 45l7 7M52 12l-7 7M19 45l-7 7"/></svg>`,
  panel: `<svg viewBox="0 0 80 64" aria-hidden="true"><path d="M14 12h52l8 36H6l8-36Z"/><path d="M17 22h46M13 34h54M25 12l-4 36M40 12v36M55 12l4 36M26 54h28"/></svg>`,
  inverter: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="6" width="44" height="52" rx="7"/><circle cx="32" cy="25" r="10"/><path d="M23 25c4-7 8 7 18 0M20 45h24M25 50h14"/></svg>`,
  battery: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="12" y="12" width="40" height="46" rx="5"/><path d="M25 12V7h14v5M22 26h20M32 16v20M21 48h22"/></svg>`,
  house: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m7 30 25-22 25 22M13 27v30h38V27M26 57V39h12v18"/><path d="M42 18V9h8v16"/></svg>`,
  grid: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 5 12 59M32 5l20 54M19 39h26M15 50h34M21 27h22M10 59h44M24 18h16"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 9 5 5 5-5"/></svg>`,
};

class HomePowerFlowCard extends HTMLElement {
  setConfig(config) {
    if (!config.offgrid || !config.grid_tie || !config.house) {
      throw new Error("Home Power Flow Card needs offgrid, grid_tie, and house configuration sections.");
    }
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      thresholds: { ...DEFAULT_CONFIG.thresholds, ...(config.thresholds || {}) },
    };
    this._expanded = this._expanded || new Set();
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    this._renderShell();
  }

  set hass(hass) {
    this._hass = hass;
    if (this.shadowRoot) this._renderValues();
  }

  getCardSize() {
    return 9;
  }

  _state(entity) {
    return entity && this._hass?.states?.[entity];
  }

  _number(entity, fallback = 0) {
    const value = Number.parseFloat(this._state(entity)?.state);
    return Number.isFinite(value) ? value : fallback;
  }

  _value(entity, unit, precision = this.config.precision) {
    const state = this._state(entity);
    if (!state) return "—";
    const numeric = Number.parseFloat(state.state);
    const shown = Number.isFinite(numeric) ? numeric.toFixed(precision) : state.state;
    return `${shown}${unit ? ` ${unit}` : ""}`;
  }

  _power(entity) {
    const value = this._number(entity);
    const abs = Math.abs(value);
    return abs >= 1000 ? `${(value / 1000).toFixed(2)} kW` : `${value.toFixed(0)} W`;
  }

  _sum(entities = []) {
    return entities.reduce((sum, entity) => sum + this._number(entity), 0);
  }

  _escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  _renderShell() {
    this.shadowRoot.innerHTML = `
      <style>${this._styles()}</style>
      <ha-card>
        <div class="card-head">
          <div>
            <h1>${this._escape(this.config.title)}</h1>
            <p>${this._escape(this.config.subtitle)}</p>
          </div>
          <div class="status-pill"><span></span><b>LIVE</b></div>
        </div>

        <div class="overview">
          <div class="metric solar-metric"><span>Solar production</span><strong data-value="total-solar">—</strong></div>
          <div class="metric"><span>Home usage</span><strong data-value="house-power">—</strong></div>
          <div class="metric battery-metric"><span>Battery flow</span><strong data-value="battery-power">—</strong></div>
          <div class="metric grid-metric"><span>Grid flow</span><strong data-value="grid-power">—</strong></div>
        </div>

        <div class="diagram-wrap">
          <div class="diagram" aria-label="Home power flow diagram">
            ${this._flowSvg()}
            <div class="node node-offgrid-solar" data-node="offgrid-solar">
              ${this._nodeHead(ICONS.panel, "Off-grid solar", "offgrid-solar-total")}
              <div class="node-sub">2 PV arrays</div>
            </div>
            <div class="node node-grid-solar" data-node="grid-solar">
              ${this._nodeHead(ICONS.sun, "Grid-tie solar", "grid-solar-total")}
              <div class="node-sub">2 PV arrays</div>
            </div>
            <div class="node node-offgrid-inverter" data-node="offgrid-inverter">
              ${this._nodeHead(ICONS.inverter, this.config.offgrid.name || "Off-grid inverter", "offgrid-output")}
              <div class="node-sub" data-value="offgrid-status">—</div>
            </div>
            <div class="node node-grid-inverter" data-node="grid-inverter">
              ${this._nodeHead(ICONS.inverter, this.config.grid_tie.name || "Grid-tie inverter", "grid-output")}
              <div class="node-sub" data-value="grid-status">—</div>
            </div>
            <div class="node node-power-box" data-node="power-box">
              ${this._nodeHead(ICONS.grid, this.config.power_box?.name || "Power box", "power-box-power")}
              <div class="node-sub" data-value="power-box-direction">Grid connection</div>
            </div>
            <div class="node node-house" data-node="house">
              ${this._nodeHead(ICONS.house, this.config.house.name || "House", "house-node-power")}
              <div class="node-sub">Live consumption</div>
            </div>
            <div class="node node-grid" data-node="grid">
              ${this._nodeHead(ICONS.grid, "Utility grid", "grid-node-power")}
              <div class="node-sub" data-value="grid-direction">—</div>
            </div>
            ${(this.config.batteries || []).slice(0, 3).map((battery, i) => `<div class="node node-battery node-battery-${i + 1}" data-node="battery-${i + 1}">
              ${this._nodeHead(ICONS.battery, battery.name || `Battery Pack ${i + 1}`, `battery-${i + 1}-soc`)}
              <div class="node-sub" data-value="battery-${i + 1}-direction">—</div>
            </div>`).join("")}
          </div>
        </div>

        <div class="details">
          ${this._solarGroup("offgrid", "Off-grid solar arrays", this.config.offgrid.arrays || [], this.config.offgrid.solar_power)}
          ${this.config.battery_bank ? this._batteryBankGroup(this.config.battery_bank) : ""}
          ${this._batteryGroup(this.config.batteries || [])}
          ${this._inverterGroup("offgrid-inverter-panel", this.config.offgrid, "Off-grid inverter")}
          ${this._solarGroup("grid", "Grid-tie solar arrays", this.config.grid_tie.arrays || [], this.config.grid_tie.solar_power)}
          ${this._inverterGroup("grid-inverter-panel", this.config.grid_tie, "Grid-tie inverter")}
          ${this.config.power_box ? this._powerBoxGroup(this.config.power_box) : ""}
          ${this._loadsGroup(this.config.house)}
        </div>
        <div class="updated" data-value="updated">Waiting for Home Assistant…</div>
      </ha-card>
    `;
    this.shadowRoot.addEventListener("click", (event) => this._handleClick(event));
  }

  _nodeHead(icon, label, valueKey) {
    return `<div class="node-icon">${icon}</div><div class="node-copy"><b>${this._escape(label)}</b><strong data-value="${valueKey}">—</strong></div>`;
  }

  _flowSvg() {
    return `<svg class="flow-lines" viewBox="0 0 1000 540" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <marker id="arrow-solar" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7Z" class="arrow solar-arrow"/></marker>
        <marker id="arrow-load" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7Z" class="arrow load-arrow"/></marker>
        <marker id="arrow-battery" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7Z" class="arrow battery-arrow"/></marker>
        <marker id="arrow-grid" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0 0 7 3.5 0 7Z" class="arrow grid-arrow"/></marker>
      </defs>
      <path id="flow-grid" class="flow grid-flow" d="M340 55 L340 125" marker-end="url(#arrow-grid)"/>
      <path id="flow-grid-solar" class="flow solar-flow" d="M190 300 L260 300" marker-end="url(#arrow-solar)"/>
      <path id="flow-gridtie-box" class="flow solar-flow" d="M345 260 C345 225 340 220 340 195" marker-end="url(#arrow-solar)"/>
      <path id="flow-box-inverter" class="flow grid-flow" d="M425 160 C475 160 480 250 510 270" marker-end="url(#arrow-grid)"/>
      <path id="flow-offgrid-solar" class="flow solar-flow" d="M595 115 L595 245" marker-end="url(#arrow-solar)"/>
      <path id="flow-battery-1" class="flow battery-flow" d="M680 275 C720 275 730 210 770 210" marker-end="url(#arrow-battery)"/>
      <path id="flow-battery-2" class="flow battery-flow" d="M680 290 L770 300" marker-end="url(#arrow-battery)"/>
      <path id="flow-battery-3" class="flow battery-flow" d="M680 305 C720 305 730 390 770 390" marker-end="url(#arrow-battery)"/>
      <path id="flow-offgrid-house" class="flow load-flow" d="M595 325 L595 460" marker-end="url(#arrow-load)"/>
    </svg>`;
  }

  _solarGroup(id, label, arrays, totalPower) {
    const panels = arrays.length ? arrays.map((array, i) => this._expandPanel(`${id}-array-${i}`, array.name || `Array ${i + 1}`, ICONS.panel, [
      ["Power", array.power, "W"], ["Voltage", array.voltage, "V"], ["Current", array.current, "A"],
      ["Charging power", array.charging_power, "W"],
    ])).join("") : this._expandPanel(`${id}-array-total`, "Combined array output", ICONS.panel, [["Power", totalPower, "W"]]);
    return `<section class="group">
      <div class="group-label">${this._escape(label)}</div>
      <div class="panel-grid">${panels}</div>
    </section>`;
  }

  _batteryBankGroup(bank) {
    const fields = [
      ["Bank SOC", bank.soc, "%"], ["Bank voltage", bank.voltage, "V"],
      ["Bank current", bank.current, "A"], ["Total capacity", bank.capacity, "Ah"],
      ["Charging today", bank.charging_daily, "kWh"], ["Discharging today", bank.discharging_daily, "kWh"],
    ];
    return `<section class="group"><div class="group-label">Battery bank totals</div>${this._expandPanel("battery-bank-panel", bank.name || "Combined battery bank", ICONS.battery, fields)}</section>`;
  }

  _batteryGroup(batteries) {
    return `<section class="group">
      <div class="group-label">Battery packs</div>
      <div class="panel-grid batteries-grid">${batteries.map((battery, i) => {
        const fields = [
          ["State of charge", battery.soc, "%"], ["Pack voltage", battery.voltage, "V"],
          ["Pack current", battery.current, "A"], ["Power", battery.power, "W"],
          ["Temperature 1", battery.temperature_1, "°C"], ["Temperature 2", battery.temperature_2, "°C"],
          ["Temperature 3", battery.temperature_3, "°C"], ["Temperature 4", battery.temperature_4, "°C"],
          ["Average cell", battery.cell_average, "V", 3], ["Maximum cell", battery.cell_max, "V", 3],
          ["Minimum cell", battery.cell_min, "V", 3], ["Cell delta", battery.cell_delta, "V", 3],
          ["Capacity", battery.capacity, "Ah"], ["Charging power", battery.charging_power, "W"],
          ["Discharging power", battery.discharging_power, "W"], ["Cycles", battery.cycles, ""],
        ];
        return this._expandPanel(`battery-${i}`, battery.name || `Battery ${i + 1}`, ICONS.battery, fields, battery.cells || []);
      }).join("")}</div>
    </section>`;
  }

  _inverterGroup(id, inverter, fallbackName) {
    const fields = [
      ["AC output power", inverter.output_power, "W"], ["AC output voltage", inverter.output_voltage, "V"],
      ["AC output current", inverter.output_current, "A"], ["AC frequency", inverter.frequency, "Hz"],
      ["Load", inverter.load_percent, "%"], ["Temperature", inverter.temperature, "°C"],
      ["DC / bus voltage", inverter.bus_voltage, "V"], ["Grid / grid-tie input", inverter.grid_input_power, "W"],
      ["PV power", inverter.solar_power, "W"], ["PV generation today", inverter.solar_daily, "kWh"],
      ["PV today (alternate)", inverter.solar_daily_alt, "kWh"], ["PV generation total", inverter.solar_total, "kWh"],
      ["Output today", inverter.output_daily, "kWh"],
      ["Status", inverter.status, ""], ["Mode", inverter.mode, ""],
    ];
    return `<section class="group"><div class="group-label">Inverter</div>${this._expandPanel(id, inverter.name || fallbackName, ICONS.inverter, fields)}</section>`;
  }

  _powerBoxGroup(powerBox) {
    const hasSeparateGridSensors = powerBox.grid_import_power || powerBox.grid_export_power;
    const fields = [
      [hasSeparateGridSensors ? "Grid import" : "Grid net power", powerBox.grid_import_power || powerBox.power || this.config.grid_tie.grid_import_power, "W"],
      ["Grid power (alternate)", powerBox.secondary_power, "W"],
      ["Grid export", powerBox.grid_export_power || this.config.grid_tie.grid_export_power, "W"],
      ["To off-grid inverter", powerBox.offgrid_power || this.config.offgrid.grid_input_power, "W"],
      ["Grid-tie solar", powerBox.solar_power || this.config.grid_tie.solar_power, "W"],
      ["Voltage", powerBox.voltage, "V"], ["Current", powerBox.current, "A"],
      ["Frequency", powerBox.frequency, "Hz"], ["Daily import", powerBox.daily_import, "kWh"],
      ["Daily export", powerBox.daily_export, "kWh"], ["Grid energy", powerBox.energy, "kWh"],
    ];
    return `<section class="group"><div class="group-label">Grid connection</div>${this._expandPanel("power-box-panel", powerBox.name || "Power box", ICONS.grid, fields)}</section>`;
  }

  _loadsGroup(house) {
    const fields = [
      ["Power to house", house.power, "W"], ["Shed powerpoints", house.shed_powerpoints, "W"],
    ];
    return `<section class="group"><div class="group-label">Loads</div>${this._expandPanel("loads-panel", house.name || "House and shed loads", ICONS.house, fields)}</section>`;
  }

  _expandPanel(id, name, icon, fields, cells = []) {
    return `<article class="equipment" data-panel="${id}">
      <button class="equipment-head" type="button" data-expand="${id}" aria-expanded="false">
        <span class="equipment-icon">${icon}</span>
        <span class="equipment-title"><b>${this._escape(name)}</b><small data-summary="${id}">Tap for details</small></span>
        <span class="chevron">${ICONS.chevron}</span>
      </button>
      <div class="equipment-body">
        <div class="reading-grid">${fields.filter(([, entity]) => entity).map(([label, entity, unit, precision]) => this._reading(label, entity, unit, precision)).join("")}</div>
        ${cells.length ? `<div class="cells-head"><b>Cell voltages</b><span data-cell-spread="${id}">Spread —</span></div><div class="cell-grid">${cells.map((entity, i) => `<button type="button" class="cell" data-entity="${this._escape(entity)}"><span>${String(i + 1).padStart(2, "0")}</span><b data-entity-value="${this._escape(entity)}" data-unit="V" data-precision="3">—</b></button>`).join("")}</div>` : ""}
      </div>
    </article>`;
  }

  _reading(label, entity, unit, precision = this.config.precision) {
    return `<button type="button" class="reading" data-entity="${this._escape(entity)}">
      <span>${this._escape(label)}</span><b data-entity-value="${this._escape(entity)}" data-unit="${this._escape(unit)}" data-precision="${precision}">—</b>
    </button>`;
  }

  _renderValues() {
    const offgridArrays = this.config.offgrid.arrays || [];
    const gridArrays = this.config.grid_tie.arrays || [];
    const batteries = this.config.batteries || [];
    const offgridSolar = this.config.offgrid.solar_power
      ? this._number(this.config.offgrid.solar_power)
      : this._sum(offgridArrays.map((item) => item.power));
    const gridSolar = this.config.grid_tie.solar_power
      ? this._number(this.config.grid_tie.solar_power)
      : this._sum(gridArrays.map((item) => item.power));
    const totalSolar = offgridSolar + gridSolar;
    const batteryPower = this.config.battery_total_power
      ? this._number(this.config.battery_total_power)
      : this._sum(batteries.map((item) => item.power));
    const averageSoc = batteries.length
      ? batteries.reduce((sum, item) => sum + this._number(item.soc), 0) / batteries.length
      : 0;
    const housePower = this._number(this.config.house.power);
    const legacyGridPower = this._number(this.config.grid_tie.grid_power);
    const hasSeparateGridSensors = Boolean(
      this.config.grid_tie.grid_import_power || this.config.power_box?.grid_import_power ||
      this.config.grid_tie.grid_export_power || this.config.power_box?.grid_export_power
    );
    const gridImport = hasSeparateGridSensors
      ? this._number(this.config.power_box?.grid_import_power || this.config.grid_tie.grid_import_power)
      : Math.max(legacyGridPower, 0);
    const gridExport = hasSeparateGridSensors
      ? this._number(this.config.power_box?.grid_export_power || this.config.grid_tie.grid_export_power)
      : Math.max(-legacyGridPower, 0);
    const gridPower = gridImport - gridExport;
    const offgridGridPower = this._number(this.config.offgrid.grid_input_power || this.config.power_box?.offgrid_power);
    const offgridOutput = this._number(this.config.offgrid.output_power);
    const gridOutput = this._number(this.config.grid_tie.output_power);

    const values = {
      "total-solar": this._formatPower(totalSolar),
      "house-power": this._formatPower(housePower),
      "battery-power": this._formatSignedPower(batteryPower, batteryPower >= 0 ? "charging" : "discharging"),
      "grid-power": gridImport > 0 ? `${this._formatPower(gridImport)} import` : `${this._formatPower(gridExport)} export`,
      "offgrid-solar-total": this._formatPower(offgridSolar),
      "grid-solar-total": this._formatPower(gridSolar),
      "offgrid-output": this._formatPower(offgridOutput),
      "grid-output": this._formatPower(gridOutput),
      "power-box-power": this._formatPower(Math.abs(gridPower)),
      "power-box-direction": gridImport > 0 ? "Importing from grid" : gridExport > 0 ? "Exporting to grid" : "Grid idle",
      "house-node-power": this._formatPower(housePower),
      "grid-node-power": this._formatPower(Math.abs(gridPower)),
      "battery-direction": batteryPower >= 0 ? "Charging" : "Supplying house",
      "grid-direction": gridPower >= 0 ? "Importing" : "Exporting",
      "offgrid-status": this._state(this.config.offgrid.status)?.state || "Online",
      "grid-status": this._state(this.config.grid_tie.status)?.state || "Online",
      "updated": `Updated ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`,
    };
    batteries.slice(0, 3).forEach((battery, i) => {
      const packPower = this._number(battery.power);
      values[`battery-${i + 1}-soc`] = `${this._value(battery.soc, "%", 0)} SOC`;
      values[`battery-${i + 1}-direction`] = packPower >= 0 ? "Charging" : "Discharging";
    });
    Object.entries(values).forEach(([key, value]) => {
      const element = this.shadowRoot.querySelector(`[data-value="${key}"]`);
      if (element) element.textContent = value;
    });

    this.shadowRoot.querySelectorAll("[data-entity-value]").forEach((element) => {
      element.textContent = this._value(element.dataset.entity, element.dataset.unit, Number(element.dataset.precision));
      element.closest("button")?.classList.toggle("unavailable", !this._state(element.dataset.entity));
    });

    offgridArrays.forEach((array, i) => this._summary(`offgrid-array-${i}`, this._power(array.power)));
    gridArrays.forEach((array, i) => this._summary(`grid-array-${i}`, this._power(array.power)));
    if (!offgridArrays.length) this._summary("offgrid-array-total", this._formatPower(offgridSolar));
    if (!gridArrays.length) this._summary("grid-array-total", this._formatPower(gridSolar));
    batteries.forEach((battery, i) => {
      this._summary(`battery-${i}`, `${this._value(battery.soc, "%", 0)} · ${this._power(battery.power)}`);
      this._cellSpread(`battery-${i}`, battery.cells || []);
    });
    this._summary("offgrid-inverter-panel", `${this._power(this.config.offgrid.output_power)} output`);
    this._summary("grid-inverter-panel", `${this._power(this.config.grid_tie.output_power)} output`);
    if (this.config.battery_bank) this._summary("battery-bank-panel", this._value(this.config.battery_bank.soc, "%", 0));
    this._summary("loads-panel", this._formatPower(housePower));
    if (this.config.power_box) this._summary("power-box-panel", gridImport > 0 ? `${this._formatPower(gridImport)} import` : `${this._formatPower(gridExport)} export`);

    this._setFlow("flow-offgrid-solar", offgridSolar, this.config.thresholds.solar);
    this._setFlow("flow-grid-solar", gridSolar, this.config.thresholds.solar);
    this._setFlow("flow-offgrid-house", offgridOutput, 20);
    this._setFlow("flow-gridtie-box", gridOutput, 20);
    this._setFlow("flow-box-inverter", offgridGridPower, this.config.thresholds.grid, false);
    batteries.slice(0, 3).forEach((battery, i) => {
      const packPower = this._number(battery.power);
      this._setFlow(`flow-battery-${i + 1}`, packPower, this.config.thresholds.battery, packPower < 0);
    });
    this._setFlow("flow-grid", gridPower, this.config.thresholds.grid, gridPower < 0);
  }

  _formatPower(value) {
    const abs = Math.abs(value);
    return abs >= 1000 ? `${(value / 1000).toFixed(2)} kW` : `${value.toFixed(0)} W`;
  }

  _formatSignedPower(value, direction) {
    return `${this._formatPower(Math.abs(value))} ${direction}`;
  }

  _summary(id, text) {
    const element = this.shadowRoot.querySelector(`[data-summary="${id}"]`);
    if (element) element.textContent = text;
  }

  _cellSpread(id, cells) {
    const element = this.shadowRoot.querySelector(`[data-cell-spread="${id}"]`);
    if (!element || !cells.length) return;
    const values = cells.map((entity) => this._number(entity, Number.NaN)).filter(Number.isFinite);
    if (!values.length) return;
    const spread = Math.max(...values) - Math.min(...values);
    element.textContent = `Spread ${spread.toFixed(3)} V`;
    element.classList.toggle("warn", spread > (this.config.cell_warning_delta || 0.030));
  }

  _setFlow(id, power, threshold, reverse = false) {
    const line = this.shadowRoot.getElementById(id);
    if (!line) return;
    const active = Math.abs(power) >= threshold || this.config.show_zero_flows;
    line.classList.toggle("active", active);
    line.classList.toggle("reverse", reverse);
    line.style.setProperty("--flow-speed", `${Math.max(0.55, 2.2 - Math.min(Math.abs(power) / 2500, 1.5))}s`);
  }

  _handleClick(event) {
    const expand = event.target.closest("[data-expand]");
    if (expand) {
      const id = expand.dataset.expand;
      const panel = this.shadowRoot.querySelector(`[data-panel="${id}"]`);
      const isOpen = panel.classList.toggle("open");
      expand.setAttribute("aria-expanded", String(isOpen));
      isOpen ? this._expanded.add(id) : this._expanded.delete(id);
      return;
    }
    const entityButton = event.target.closest("[data-entity]");
    if (entityButton && this._hass) {
      this.dispatchEvent(new CustomEvent("hass-more-info", {
        bubbles: true,
        composed: true,
        detail: { entityId: entityButton.dataset.entity },
      }));
    }
  }

  _styles() {
    return `
      :host { --solar:#ffbd3b; --load:#53d6ff; --battery:#72e6a2; --grid:#b48cff; --ink:#f5f8ff; --muted:#91a2bd; display:block; }
      * { box-sizing:border-box; }
      ha-card { overflow:hidden; color:var(--ink); background:radial-gradient(circle at 18% -10%,rgba(34,97,124,.38),transparent 34%),radial-gradient(circle at 100% 30%,rgba(89,54,131,.25),transparent 34%),#101722; border:1px solid rgba(255,255,255,.08); box-shadow:0 18px 50px rgba(0,0,0,.24); }
      .card-head { display:flex; justify-content:space-between; align-items:flex-start; padding:25px 27px 16px; }
      h1 { margin:0; font-size:23px; letter-spacing:-.02em; } .card-head p { margin:5px 0 0; color:var(--muted); font-size:13px; }
      .status-pill { display:flex; align-items:center; gap:7px; padding:7px 10px; border:1px solid rgba(114,230,162,.22); border-radius:99px; color:#9cf0bd; background:rgba(114,230,162,.08); font-size:10px; letter-spacing:.12em; }
      .status-pill span { width:7px; height:7px; border-radius:50%; background:#72e6a2; box-shadow:0 0 10px #72e6a2; animation:pulse 2s infinite; }
      .overview { display:grid; grid-template-columns:repeat(4,1fr); gap:9px; padding:0 27px 20px; }
      .metric { padding:13px 14px; border:1px solid rgba(255,255,255,.075); border-radius:12px; background:rgba(255,255,255,.035); }
      .metric span { display:block; color:var(--muted); font-size:10px; text-transform:uppercase; letter-spacing:.07em; margin-bottom:5px; }
      .metric strong { font-size:14px; white-space:nowrap; } .solar-metric strong{color:var(--solar)} .battery-metric strong{color:var(--battery)} .grid-metric strong{color:var(--grid)}
      .diagram-wrap { padding:0 16px 22px; }
      .diagram { position:relative; height:540px; overflow:hidden; border:1px solid rgba(255,255,255,.07); border-radius:18px; background:linear-gradient(rgba(255,255,255,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.018) 1px,transparent 1px),rgba(4,9,15,.36); background-size:28px 28px; }
      .diagram::after { content:"POWER FLOW"; position:absolute; right:14px; bottom:9px; color:rgba(255,255,255,.13); font:bold 9px/1 sans-serif; letter-spacing:.18em; }
      .flow-lines { position:absolute; inset:0; width:100%; height:100%; z-index:1; }
      .flow { fill:none; stroke-width:3; stroke-linecap:round; opacity:.18; transition:opacity .3s; vector-effect:non-scaling-stroke; }
      .flow.active { opacity:1; stroke-dasharray:3 11; animation:flow var(--flow-speed,1.3s) linear infinite; filter:drop-shadow(0 0 4px currentColor); }
      .flow.reverse { animation-direction:reverse; }
      .solar-flow { stroke:var(--solar); color:var(--solar); } .load-flow{stroke:var(--load);color:var(--load)} .battery-flow{stroke:var(--battery);color:var(--battery)} .grid-flow{stroke:var(--grid);color:var(--grid)}
      .arrow { stroke:none; } .solar-arrow{fill:var(--solar)} .load-arrow{fill:var(--load)} .battery-arrow{fill:var(--battery)} .grid-arrow{fill:var(--grid)}
      .node { position:absolute; z-index:2; display:flex; align-items:center; gap:11px; width:170px; min-height:76px; padding:12px; border:1px solid rgba(255,255,255,.11); border-radius:14px; background:linear-gradient(145deg,rgba(35,47,63,.97),rgba(20,29,41,.97)); box-shadow:0 10px 28px rgba(0,0,0,.25); }
      .node-icon { flex:0 0 42px; height:42px; display:grid; place-items:center; border-radius:11px; background:rgba(255,255,255,.055); }
      .node-icon svg,.equipment-icon svg { width:34px; height:34px; fill:none; stroke:currentColor; stroke-width:2.4; stroke-linecap:round; stroke-linejoin:round; }
      .node-copy { min-width:0; } .node-copy b { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#dce7f7; font-size:11px; font-weight:600; }
      .node-copy strong { display:block; margin-top:4px; font-size:15px; white-space:nowrap; }
      .node-sub { position:absolute; left:66px; bottom:8px; color:var(--muted); font-size:9px; }
      .node-grid{left:25.5%;top:0;color:var(--grid)} .node-power-box{left:25.5%;top:21%;color:var(--grid)}
      .node-grid-solar{left:2%;top:48%;color:var(--solar)} .node-grid-inverter{left:26%;top:48%;color:var(--load)}
      .node-offgrid-solar{left:51%;top:11%;color:var(--solar)} .node-offgrid-inverter{left:51%;top:46%;color:var(--load)}
      .node-battery{left:77%;color:var(--battery)} .node-battery-1{top:31%}.node-battery-2{top:48%}.node-battery-3{top:65%}
      .node-house{left:51%;top:83%;color:var(--load)}
      .details { padding:3px 18px 10px; }
      .group { margin:0 0 18px; } .group-label { margin:0 8px 8px; color:#71839e; font-size:10px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; }
      .panel-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; } .batteries-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
      .equipment { overflow:hidden; border:1px solid rgba(255,255,255,.075); border-radius:14px; background:rgba(255,255,255,.025); }
      .equipment-head { width:100%; min-height:67px; display:flex; align-items:center; gap:11px; padding:10px 12px; color:inherit; border:0; background:transparent; text-align:left; cursor:pointer; }
      .equipment-head:hover { background:rgba(255,255,255,.035); }
      .equipment-icon { flex:0 0 39px; height:39px; display:grid; place-items:center; color:var(--load); border-radius:10px; background:rgba(83,214,255,.075); }
      .equipment-icon svg{width:28px;height:28px}.equipment-title{min-width:0;flex:1}.equipment-title b{display:block;font-size:12px}.equipment-title small{display:block;margin-top:4px;color:var(--muted);font-size:10px}
      .chevron { width:21px; color:#70829a; transition:transform .25s; }.chevron svg{width:19px;fill:none;stroke:currentColor;stroke-width:2}.equipment.open .chevron{transform:rotate(180deg)}
      .equipment-body { display:none; padding:0 10px 11px; }.equipment.open .equipment-body{display:block;animation:reveal .25s ease-out}
      .reading-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:5px; }
      .reading { min-width:0; padding:8px; border:1px solid rgba(255,255,255,.055); border-radius:9px; color:inherit; background:rgba(0,0,0,.14); text-align:left; cursor:pointer; }
      .reading span { display:block; overflow:hidden; color:var(--muted); font-size:9px; white-space:nowrap; text-overflow:ellipsis; }.reading b{display:block;margin-top:3px;font-size:11px;white-space:nowrap}.reading.unavailable{opacity:.45}
      .cells-head { display:flex;justify-content:space-between;margin:13px 2px 7px;font-size:10px}.cells-head span{color:var(--muted)}.cells-head .warn{color:#ff8a75}
      .cell-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:4px}.cell{padding:6px 3px;border:1px solid rgba(114,230,162,.12);border-radius:7px;color:inherit;background:rgba(114,230,162,.035);cursor:pointer}.cell span{display:block;color:#6e8298;font-size:8px}.cell b{display:block;margin-top:2px;font-size:9px}.cell.unavailable{opacity:.4}
      .updated { padding:0 24px 17px; color:#596a80; font-size:9px; text-align:right; }
      @keyframes flow{to{stroke-dashoffset:-28}} @keyframes pulse{50%{opacity:.4}} @keyframes reveal{from{opacity:0;transform:translateY(-4px)}}
      @media(max-width:700px){
        .card-head{padding:20px 18px 14px}.overview{grid-template-columns:repeat(2,1fr);padding:0 18px 16px}.diagram{height:900px}.flow-lines{display:none}
        .node{width:42%;}.node-grid{left:29%;top:2%}.node-power-box{left:29%;top:14%}.node-grid-solar{left:4%;top:28%}.node-grid-inverter{left:54%;top:28%}.node-offgrid-solar{left:4%;top:43%}.node-offgrid-inverter{left:54%;top:43%}.node-battery-1{left:4%;top:59%}.node-battery-2{left:54%;top:59%}.node-battery-3{left:4%;top:74%}.node-house{left:54%;top:74%}
        .node::after{content:"→";position:absolute;right:-18%;color:#52657d;font-size:19px}.node-grid::after,.node-power-box::after,.node-grid-inverter::after,.node-offgrid-inverter::after,.node-battery-2::after,.node-house::after{display:none}
        .panel-grid,.batteries-grid{grid-template-columns:1fr}
      }
      @media(max-width:390px){.metric strong{font-size:12px}.node{width:44%;padding:9px}.node-offgrid-inverter,.node-house,.node-grid-inverter{left:52%}.node-icon{flex-basis:34px;width:34px;height:34px}.node-icon svg{width:27px}.node-sub{left:53px}}
    `;
  }
}

if (!customElements.get("home-power-flow-card")) {
  customElements.define("home-power-flow-card", HomePowerFlowCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: "home-power-flow-card",
  name: "Home Power Flow Card",
  description: "Animated off-grid, battery, grid-tie, solar, and house power flow.",
  preview: true,
  documentationURL: "https://github.com/jeremyoha450/HA-home-power-flow-card",
});

console.info(`%c HOME-POWER-FLOW-CARD %c v${CARD_VERSION} `, "color:#101722;background:#53d6ff;font-weight:bold", "color:#53d6ff;background:#101722");
