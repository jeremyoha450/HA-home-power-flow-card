const CARD_VERSION = "0.3.2";

const DEFAULT_CONFIG = {
  title: "Home Energy System",
  subtitle: "Live power flow",
  precision: 1,
  show_zero_flows: false,
  show_overview: false,
  details_open: false,
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
    const batteries = this.config.batteries || [];
    this.shadowRoot.innerHTML = `
      <style>${this._styles()}</style>
      <ha-card>
        <div class="card-head compact-head">
          <h1>${this._escape(this.config.title)}</h1>
          ${this.config.subtitle ? `<p>${this._escape(this.config.subtitle)}</p>` : ""}
        </div>

        ${this.config.show_overview ? `<div class="overview">
          <div class="metric solar-metric"><span>Solar production</span><strong data-value="total-solar">—</strong></div>
          <div class="metric"><span>Home usage</span><strong data-value="house-power">—</strong></div>
          <div class="metric battery-metric"><span>Battery flow</span><strong data-value="battery-power">—</strong></div>
          <div class="metric grid-metric"><span>Grid flow</span><strong data-value="grid-power">—</strong></div>
        </div>` : ""}

        <div class="diagram-wrap">
          <div class="diagram" aria-label="Home power flow diagram">
            ${this._flowSvg()}
            <button class="node node-offgrid-solar" type="button" data-open-panel="offgrid-array-0">
              ${this._nodeHead(ICONS.panel, "Off-grid solar", "offgrid-solar-total")}
            </button>
            <button class="node node-grid-solar" type="button" data-open-panel="grid-array-0">
              ${this._nodeHead(ICONS.sun, "Grid-tie solar", "grid-solar-total")}
            </button>
            <button class="node node-offgrid-inverter" type="button" data-open-panel="offgrid-inverter-panel">
              ${this._nodeHead(ICONS.inverter, "Off-grid", "offgrid-output")}
            </button>
            <button class="node node-grid-inverter" type="button" data-open-panel="grid-inverter-panel">
              ${this._nodeHead(ICONS.inverter, "Grid-tie", "grid-output")}
            </button>
            <button class="node node-power-box" type="button" data-open-panel="power-box-panel">
              ${this._nodeHead(ICONS.grid, "Power box", "power-box-power")}
            </button>
            <button class="node node-house" type="button" data-open-panel="loads-panel">
              ${this._nodeHead(ICONS.house, "House", "house-node-power")}
            </button>
            <button class="node node-shed" type="button" data-open-panel="loads-panel">
              ${this._nodeHead(ICONS.house, "Shed", "shed-node-power")}
            </button>
            <button class="node node-grid" type="button" data-open-panel="power-box-panel">
              ${this._nodeHead(ICONS.grid, "Utility grid", "grid-node-power")}
            </button>
            <button class="node node-battery-bank" type="button" data-open-panel="battery-bank-panel">
              <div class="battery-stack">${ICONS.battery}</div>
              <div class="node-copy"><b>Battery bank</b><strong data-value="battery-soc">—</strong></div>
            </button>
            <div class="battery-row" style="--battery-count:${Math.max(1, batteries.length)}">
              ${batteries.map((battery, i) => `<button class="pack-node" type="button" data-open-panel="battery-${i}">
                <span class="pack-icon">${ICONS.battery}</span>
                <span><b>P${i + 1}</b><strong data-value="battery-${i}-soc">—</strong><small data-value="battery-${i}-power">—</small></span>
              </button>`).join("")}
            </div>
          </div>
        </div>

        <button class="details-toggle" type="button" data-toggle-details aria-expanded="${String(this.config.details_open)}">
          <span><b>System details</b><small>Voltages, currents, temperatures and battery cells</small></span>
          <span class="chevron">${ICONS.chevron}</span>
        </button>
        <div class="details ${this.config.details_open ? "open" : ""}">
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
    const count = Math.max(1, (this.config.batteries || []).length);
    const packBranches = Array.from({ length: count }, (_, i) => {
      const x = count === 1 ? 250 : 100 + (300 * i / (count - 1));
      return `<path id="flow-battery-${i}" class="flow battery-flow battery-branch" d="M305 385 L${x.toFixed(1)} 385 L${x.toFixed(1)} 423"/>`;
    }).join("");
    return `<svg class="flow-lines" viewBox="0 0 500 480" preserveAspectRatio="none" aria-hidden="true">
      <path id="flow-grid" class="flow grid-flow" d="M50 240 L170 240"/>
      <path id="flow-grid-solar" class="flow solar-flow" d="M120 75 L120 135"/>
      <path id="flow-gridtie-box" class="flow solar-flow" d="M120 190 L120 215 L170 215 L170 240"/>
      <path id="flow-box-inverter" class="flow grid-flow" d="M170 240 L260 240"/>
      <path id="flow-offgrid-solar" class="flow solar-flow" d="M305 75 L305 205"/>
      <path id="flow-offgrid-house" class="flow load-flow" d="M350 240 L410 240"/>
      <path id="flow-shed" class="flow load-flow" d="M375 240 L375 145 L410 145"/>
      <path id="flow-battery" class="flow battery-flow" d="M305 275 L305 345"/>
      ${packBranches}
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
    const bankSoc = this.config.battery_bank?.soc
      ? this._number(this.config.battery_bank.soc)
      : averageSoc;
    const housePower = this._number(this.config.house.power);
    const shedPower = this._number(this.config.house.shed_powerpoints);
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
      "battery-soc": `${bankSoc.toFixed(0)}% SOC`,
      "battery-direction": batteryPower >= 0 ? `${this._formatPower(Math.abs(batteryPower))} charging` : `${this._formatPower(Math.abs(batteryPower))} supplying`,
      "power-box-power": this._formatPower(Math.abs(gridPower)),
      "power-box-direction": gridImport > 0 ? "Importing from grid" : gridExport > 0 ? "Exporting to grid" : "Grid idle",
      "house-node-power": this._formatPower(housePower),
      "shed-node-power": this._formatPower(shedPower),
      "grid-node-power": this._formatPower(Math.abs(gridPower)),
      "grid-direction": gridPower >= 0 ? "Importing" : "Exporting",
      "offgrid-status": this._state(this.config.offgrid.status)?.state || "Online",
      "grid-status": this._state(this.config.grid_tie.status)?.state || "Online",
      "updated": `Updated ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`,
    };
    Object.entries(values).forEach(([key, value]) => {
      const element = this.shadowRoot.querySelector(`[data-value="${key}"]`);
      if (element) element.textContent = value;
    });
    batteries.forEach((battery, i) => {
      const soc = this._number(battery.soc);
      const power = this._number(battery.power);
      const socElement = this.shadowRoot.querySelector(`[data-value="battery-${i}-soc"]`);
      const powerElement = this.shadowRoot.querySelector(`[data-value="battery-${i}-power"]`);
      if (socElement) socElement.textContent = `${soc.toFixed(0)}%`;
      if (powerElement) powerElement.textContent = this._formatPower(power);
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
    this._setFlow("flow-shed", shedPower, 20);
    this._setFlow("flow-gridtie-box", gridOutput, 20);
    this._setFlow("flow-box-inverter", offgridGridPower, this.config.thresholds.grid, false);
    this._setFlow("flow-battery", batteryPower, this.config.thresholds.battery, batteryPower < 0);
    batteries.forEach((battery, i) => {
      const packPower = this._number(battery.power);
      this._setFlow(`flow-battery-${i}`, packPower, this.config.thresholds.battery, packPower < 0);
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
    const openPanel = event.target.closest("[data-open-panel]");
    if (openPanel) {
      const details = this.shadowRoot.querySelector(".details");
      const detailsToggle = this.shadowRoot.querySelector("[data-toggle-details]");
      const panel = this.shadowRoot.querySelector(`[data-panel="${openPanel.dataset.openPanel}"]`);
      details?.classList.add("open");
      detailsToggle?.classList.add("open");
      detailsToggle?.setAttribute("aria-expanded", "true");
      panel?.classList.add("open");
      panel?.querySelector("[data-expand]")?.setAttribute("aria-expanded", "true");
      panel?.scrollIntoView({ behavior: "smooth", block: "nearest" });
      if (panel) this._expanded.add(openPanel.dataset.openPanel);
      return;
    }
    const detailsToggle = event.target.closest("[data-toggle-details]");
    if (detailsToggle) {
      const details = this.shadowRoot.querySelector(".details");
      const isOpen = details.classList.toggle("open");
      detailsToggle.classList.toggle("open", isOpen);
      detailsToggle.setAttribute("aria-expanded", String(isOpen));
      return;
    }
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
      ha-card { overflow:hidden; color:var(--ink); background:#0d1117; border:1px solid rgba(255,255,255,.07); box-shadow:0 12px 35px rgba(0,0,0,.2); }
      .card-head { display:block; padding:13px 16px 2px; text-align:center; }
      h1 { margin:0; color:#aebbd0; font-size:15px; font-weight:600; letter-spacing:.01em; } .card-head p { margin:2px 0 0; color:var(--muted); font-size:9px; }
      .status-pill { display:flex; align-items:center; gap:7px; padding:7px 10px; border:1px solid rgba(114,230,162,.22); border-radius:99px; color:#9cf0bd; background:rgba(114,230,162,.08); font-size:10px; letter-spacing:.12em; }
      .status-pill span { width:7px; height:7px; border-radius:50%; background:#72e6a2; box-shadow:0 0 10px #72e6a2; animation:pulse 2s infinite; }
      .overview { display:grid; grid-template-columns:repeat(4,1fr); gap:9px; padding:0 27px 20px; }
      .metric { padding:13px 14px; border:1px solid rgba(255,255,255,.075); border-radius:12px; background:rgba(255,255,255,.035); }
      .metric span { display:block; color:var(--muted); font-size:10px; text-transform:uppercase; letter-spacing:.07em; margin-bottom:5px; }
      .metric strong { font-size:14px; white-space:nowrap; } .solar-metric strong{color:var(--solar)} .battery-metric strong{color:var(--battery)} .grid-metric strong{color:var(--grid)}
      .diagram-wrap { padding:0 8px 6px; }
      .diagram { position:relative; width:100%; max-width:560px; height:450px; margin:0 auto; overflow:hidden; border:0; border-radius:12px; background:transparent; }
      .flow-lines { position:absolute; inset:0; width:100%; height:100%; z-index:1; }
      .flow { fill:none; stroke-width:2; stroke-linecap:round; opacity:.18; transition:opacity .3s; vector-effect:non-scaling-stroke; }
      .flow.active { opacity:1; stroke-dasharray:2 8; animation:flow var(--flow-speed,1.3s) linear infinite; filter:drop-shadow(0 0 2px currentColor); will-change:stroke-dashoffset; }
      .flow.reverse { animation-direction:reverse; }
      .solar-flow { stroke:var(--solar); color:var(--solar); } .load-flow{stroke:var(--load);color:var(--load)} .battery-flow{stroke:var(--battery);color:var(--battery)} .grid-flow{stroke:var(--grid);color:var(--grid)}
      .node { position:absolute; z-index:2; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; width:78px; min-height:76px; padding:3px; color:var(--load); border:0; border-radius:7px; background:#0d1117; text-align:center; cursor:pointer; transform:translate(-50%,-50%); }
      .node:hover,.pack-node:hover { background:#151c25; }
      .node-icon { width:31px; height:31px; display:grid; place-items:center; }
      .node-icon svg,.equipment-icon svg { width:29px; height:29px; fill:none; stroke:currentColor; stroke-width:2.4; stroke-linecap:round; stroke-linejoin:round; }
      .node-copy { width:100%; min-width:0; text-align:center; } .node-copy b { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#98a8bd; font-size:8px; font-weight:500; }
      .node-copy strong { display:inline-block; min-width:62px; margin-top:2px; padding:3px 5px; border:1px solid currentColor; border-radius:5px; color:currentColor; font-size:12px; text-align:center; white-space:nowrap; background:#0d1117; }
      .node-sub { position:absolute; left:45px; bottom:-1px; color:var(--muted); font-size:8px; white-space:nowrap; }
      .node-offgrid-inverter,.node-grid-inverter { background:transparent; }
      .battery-stack { display:flex; align-items:flex-end; width:31px; color:var(--battery); }
      .battery-stack svg { width:25px; height:31px; fill:#0d1117; stroke:currentColor; stroke-width:2.6; }
      .node-grid{left:10%;top:50%;width:72px;color:var(--grid)} .node-power-box{left:34%;top:50%;width:72px;color:var(--grid)}
      .node-grid .node-icon,.node-power-box .node-icon{width:27px;height:27px}.node-grid .node-icon svg,.node-power-box .node-icon svg{width:25px}.node-grid .node-copy strong,.node-power-box .node-copy strong{min-width:55px;font-size:11px}
      .node-grid-solar{left:24%;top:15%;color:var(--solar)} .node-grid-inverter{left:24%;top:34%;color:var(--load)}
      .node-offgrid-solar{left:61%;top:15%;color:var(--solar)} .node-offgrid-inverter{left:61%;top:50%;color:var(--load)}
      .node-house{left:88%;top:50%;color:var(--load)} .node-shed{left:88%;top:30%;color:#5ddfc6}
      .node-battery-bank{left:61%;top:73%;color:var(--battery)}
      .battery-row { position:absolute; z-index:3; left:10%; right:10%; bottom:5px; display:grid; grid-template-columns:repeat(var(--battery-count),minmax(0,1fr)); }
      .pack-node { width:54px; min-width:0; min-height:55px; justify-self:center; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0; padding:2px; color:var(--battery); border:0; border-radius:7px; background:#0d1117; text-align:center; cursor:pointer; }
      .pack-icon{height:23px}.pack-icon svg { width:18px; height:23px; fill:#0d1117; stroke:currentColor; stroke-width:2.5; }
      .pack-node b,.pack-node strong,.pack-node small { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .pack-node b { color:#8fa0b5; font-size:8px; font-weight:500; }.pack-node strong{font-size:12px}.pack-node small{display:none}
      .details-toggle { width:calc(100% - 28px); display:flex; align-items:center; justify-content:space-between; margin:7px 14px 13px; padding:11px 13px; color:var(--ink); border:1px solid rgba(255,255,255,.075); border-radius:10px; background:rgba(255,255,255,.025); text-align:left; cursor:pointer; }
      .details-toggle b,.details-toggle small { display:block; }.details-toggle b{font-size:11px}.details-toggle small{margin-top:3px;color:var(--muted);font-size:9px}.details-toggle.open .chevron{transform:rotate(180deg)}
      .details { display:none; padding:3px 18px 10px; }.details.open{display:block;animation:reveal .25s ease-out}
      .group { margin:0 0 18px; } .group-label { margin:0 8px 8px; color:#71839e; font-size:10px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; }
      .panel-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; } .batteries-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
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
      @keyframes flow{from{stroke-dashoffset:0}to{stroke-dashoffset:-20}} @keyframes pulse{50%{opacity:.4}} @keyframes reveal{from{opacity:0;transform:translateY(-4px)}}
      @media(max-width:700px){
        .card-head{padding:11px 14px 1px}.overview{grid-template-columns:repeat(2,1fr);padding:0 14px 12px}.diagram{height:450px}
        .node{width:76px}.node-icon{width:28px;height:28px}.node-icon svg{width:27px}.node-copy strong{min-width:58px;font-size:11px}.node-copy b{font-size:8px}
        .panel-grid,.batteries-grid{grid-template-columns:1fr}
      }
      @media(max-width:390px){.metric strong{font-size:12px}.diagram{height:440px}.node{width:68px}.node-grid{left:10%;width:64px}.node-power-box{left:34%;width:64px}.node-offgrid-inverter,.node-offgrid-solar,.node-battery-bank{left:62%}.node-house,.node-shed{left:88%}.battery-row{left:8%;right:8%}.pack-node{width:48px}.pack-icon svg{width:16px}.pack-node b{font-size:7px}}
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
