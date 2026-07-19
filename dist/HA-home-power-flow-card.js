const CARD_VERSION = "0.7.8";

const DEFAULT_CONFIG = {
  title: "Home Energy System",
  precision: 1,
  show_zero_flows: false,
  show_overview: false,
};

const ICONS = {
  sun: `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="10"/><path d="M32 4v10M32 50v10M4 32h10M50 32h10M12 12l7 7M45 45l7 7M52 12l-7 7M19 45l-7 7"/></svg>`,
  panel: `<svg viewBox="0 0 80 64" aria-hidden="true"><path d="M14 12h52l8 36H6l8-36Z"/><path d="M17 22h46M13 34h54M25 12l-4 36M40 12v36M55 12l4 36M26 54h28"/></svg>`,
  inverter: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="6" width="44" height="52" rx="7"/><circle cx="32" cy="25" r="10"/><path d="M23 25c4-7 8 7 18 0M20 45h24M25 50h14"/></svg>`,
  battery: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="12" y="12" width="40" height="46" rx="5"/><path d="M25 12V7h14v5M22 26h20M32 16v20M21 48h22"/></svg>`,
  house: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="m7 30 25-22 25 22M13 27v30h38V27M26 57V39h12v18"/><path d="M42 18V9h8v16"/></svg>`,
  grid: `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 5 12 59M32 5l20 54M19 39h26M15 50h34M21 27h22M10 59h44M24 18h16"/></svg>`,
  powerbox: `<svg viewBox="0 0 64 64" aria-hidden="true"><rect x="10" y="6" width="44" height="52" rx="4"/><path d="M10 18h44M24 18V8M40 18V8M19 27h10v9H19zM35 27h10v9H35zM19 42h10v9H19zM35 42h10v9H35z"/><path d="M24 29v5M40 29v5M24 44v5M40 44v5"/></svg>`,
  chevron: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 9 5 5 5-5"/></svg>`,
};

const EDITOR_STUB_CONFIG = {
  title: "Home Energy System",
  precision: 1,
  cell_warning_delta: 0.03,
  show_zero_flows: false,
  show_overview: false,
  power_box: { name: "Power Box", icon_size: 100, grid_icon_size: 100 },
  house: { name: "House and Additional", additional_1_icon_size: 100, additional_2_icon_size: 100 },
  grid_tie: {
    name: "Grid-tie Inverter",
    icon_size: 100,
    arrays: [{ name: "Grid-tie PV 1" }, { name: "Grid-tie PV 2" }],
  },
  offgrid: {
    name: "Off-grid Inverter",
    icon_size: 100,
    arrays: [{ name: "Off-grid PV 1" }, { name: "Off-grid PV 2" }],
  },
  battery_bank: { name: "Battery Bank" },
  batteries: [
    { name: "Battery Pack 1", cells: [] },
    { name: "Battery Pack 2", cells: [] },
    { name: "Battery Pack 3", cells: [] },
  ],
};

const editorField = (label, path, type = "entity", helper = "") => ({ label, path, type, helper });
const nameField = (path) => editorField("Name", path, "text");
const pvEditorSection = (title, root) => ({
  title,
  fields: [
    nameField([...root, "name"]),
    editorField("Power", [...root, "power"]),
    editorField("Voltage", [...root, "voltage"]),
    editorField("Current", [...root, "current"]),
  ],
});
const batteryEditorSection = (index) => ({
  title: `Battery Pack ${index + 1}`,
  fields: [
    nameField(["batteries", index, "name"]),
    editorField("State of charge", ["batteries", index, "soc"]),
    editorField("Voltage", ["batteries", index, "voltage"]),
    editorField("Current", ["batteries", index, "current"]),
    editorField("Power", ["batteries", index, "power"]),
    editorField("Average cell voltage", ["batteries", index, "cell_average"]),
    editorField("Maximum cell voltage", ["batteries", index, "cell_max"]),
    editorField("Minimum cell voltage", ["batteries", index, "cell_min"]),
    editorField("Temperature 1", ["batteries", index, "temperature_1"]),
    editorField("Temperature 2", ["batteries", index, "temperature_2"]),
    editorField("Temperature 3", ["batteries", index, "temperature_3"]),
    editorField("Temperature 4", ["batteries", index, "temperature_4"]),
    editorField("Capacity", ["batteries", index, "capacity"]),
    editorField("Charging power", ["batteries", index, "charging_power"]),
    editorField("Discharging power", ["batteries", index, "discharging_power"]),
    editorField("Cycles", ["batteries", index, "cycles"]),
  ],
  subsections: [{
    title: "16 cell voltage sensors",
    fields: Array.from({ length: 16 }, (_, cell) => editorField(`Cell ${cell + 1}`, ["batteries", index, "cells", cell])),
  }],
});

const EDITOR_SECTIONS = [
  {
    title: "Card appearance",
    open: true,
    fields: [
      editorField("Title", ["title"], "text"),
      editorField("Decimal places", ["precision"], "number"),
      editorField("Cell warning spread (V)", ["cell_warning_delta"], "number"),
      editorField("Show zero-power lines", ["show_zero_flows"], "boolean"),
      editorField("Show overview tiles", ["show_overview"], "boolean"),
    ],
  },
  {
    title: "Grid",
    open: true,
    fields: [
      editorField("Grid name", ["power_box", "grid_name"], "text"),
      editorField("Grid icon", ["power_box", "grid_icon"], "icon", "Search Home Assistant icons"),
      editorField("Grid icon size (%)", ["power_box", "grid_icon_size"], "number", "50 to 200; default is 100"),
      editorField("Signed Grid power", ["power_box", "power"], "entity", "Positive import, negative export"),
      editorField("Ignore phantom Grid power up to (W)", ["power_box", "phantom_power_threshold"], "number", "Values from zero through this amount are treated as no Grid flow"),
      editorField("Grid voltage", ["power_box", "voltage"]),
      editorField("Calculate current from power and voltage", ["power_box", "calculate_current"], "boolean"),
      editorField("Grid current sensor", ["power_box", "current"], "entity", "Used when calculated current is turned off"),
      editorField("Grid frequency", ["power_box", "frequency"]),
      editorField("Grid energy", ["power_box", "energy"]),
      editorField("Daily import", ["power_box", "daily_import"]),
      editorField("Daily export", ["power_box", "daily_export"]),
    ],
  },
  {
    title: "Power Box",
    open: true,
    fields: [
      nameField(["power_box", "name"]),
      editorField("Power Box icon", ["power_box", "icon"], "icon", "Search Home Assistant icons"),
      editorField("Power Box icon size (%)", ["power_box", "icon_size"], "number", "50 to 200; default is 100"),
      editorField("Power to off-grid inverter", ["power_box", "offgrid_power"]),
      editorField("Ignore phantom Power Box power up to (W)", ["power_box", "offgrid_phantom_power_threshold"], "number", "Values from zero through this amount are treated as no flow to the Off-grid inverter"),
    ],
  },
  {
    title: "House and Additional",
    fields: [
      nameField(["house", "name"]),
      editorField("House power", ["house", "power"]),
      editorField("Additional 1 name", ["house", "additional_1_name"], "text", "Leave blank to hide this load"),
      editorField("Additional 1 power", ["house", "additional_1_power"]),
      editorField("Additional 1 icon", ["house", "additional_1_icon"], "icon", "Search Home Assistant icons"),
      editorField("Additional 1 icon size (%)", ["house", "additional_1_icon_size"], "number", "50 to 200; default is 100"),
      editorField("Additional 2 name", ["house", "additional_2_name"], "text", "Leave blank to hide this load"),
      editorField("Additional 2 power", ["house", "additional_2_power"]),
      editorField("Additional 2 icon", ["house", "additional_2_icon"], "icon", "Search Home Assistant icons"),
      editorField("Additional 2 icon size (%)", ["house", "additional_2_icon_size"], "number", "50 to 200; default is 100"),
    ],
  },
  {
    title: "Grid-tie Inverter",
    fields: [
      nameField(["grid_tie", "name"]),
      editorField("Output power", ["grid_tie", "output_power"]),
      editorField("Output voltage", ["grid_tie", "output_voltage"]),
      editorField("Output current", ["grid_tie", "output_current"]),
      editorField("Frequency", ["grid_tie", "frequency"]),
      editorField("Status", ["grid_tie", "status"]),
      editorField("Icon", ["grid_tie", "icon"], "icon", "Search Home Assistant icons"),
      editorField("Icon size (%)", ["grid_tie", "icon_size"], "number", "50 to 200; default is 100"),
      editorField("Solar total fallback", ["grid_tie", "solar_power"]),
    ],
  },
  pvEditorSection("Grid-tie PV 1", ["grid_tie", "arrays", 0]),
  pvEditorSection("Grid-tie PV 2", ["grid_tie", "arrays", 1]),
  pvEditorSection("Grid-tie PV 3", ["grid_tie", "arrays", 2]),
  pvEditorSection("Grid-tie PV 4", ["grid_tie", "arrays", 3]),
  {
    title: "Off-grid Inverter",
    fields: [
      nameField(["offgrid", "name"]),
      editorField("Output power", ["offgrid", "output_power"]),
      editorField("Output voltage", ["offgrid", "output_voltage"]),
      editorField("Output current", ["offgrid", "output_current"]),
      editorField("Output frequency", ["offgrid", "frequency"]),
      editorField("External Power monitor", ["offgrid", "grid_input_power"]),
      editorField("Solar total", ["offgrid", "solar_power"]),
      editorField("Solar generated today", ["offgrid", "solar_daily"]),
      editorField("Solar today alternate", ["offgrid", "solar_daily_alt"]),
      editorField("Solar generation total", ["offgrid", "solar_total"]),
      editorField("Output energy today", ["offgrid", "output_daily"]),
      editorField("Status", ["offgrid", "status"]),
      editorField("Mode", ["offgrid", "mode"]),
      editorField("Icon", ["offgrid", "icon"], "icon", "Search Home Assistant icons"),
      editorField("Icon size (%)", ["offgrid", "icon_size"], "number", "50 to 200; default is 100"),
      editorField("Load percent", ["offgrid", "load_percent"]),
      editorField("Temperature", ["offgrid", "temperature"]),
      editorField("Bus voltage", ["offgrid", "bus_voltage"]),
    ],
  },
  pvEditorSection("Off-grid PV 1", ["offgrid", "arrays", 0]),
  pvEditorSection("Off-grid PV 2", ["offgrid", "arrays", 1]),
  pvEditorSection("Off-grid PV 3", ["offgrid", "arrays", 2]),
  pvEditorSection("Off-grid PV 4", ["offgrid", "arrays", 3]),
  {
    title: "Battery Bank",
    fields: [
      nameField(["battery_bank", "name"]),
      editorField("Combined battery power", ["battery_total_power"]),
      editorField("State of charge", ["battery_bank", "soc"]),
      editorField("Voltage", ["battery_bank", "voltage"]),
      editorField("Current", ["battery_bank", "current"]),
      editorField("Capacity", ["battery_bank", "capacity"]),
      editorField("Charging energy today", ["battery_bank", "charging_daily"]),
      editorField("Discharging energy today", ["battery_bank", "discharging_daily"]),
    ],
  },
  batteryEditorSection(0),
  batteryEditorSection(1),
  batteryEditorSection(2),
];

class HomePowerFlowCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("home-power-flow-card-editor");
  }

  static getStubConfig() {
    return JSON.parse(JSON.stringify(EDITOR_STUB_CONFIG));
  }

  setConfig(config) {
    if (!config.offgrid || !config.grid_tie || !config.house) {
      throw new Error("Home Power Flow Card needs offgrid, grid_tie, and house configuration sections.");
    }
    this.config = { ...DEFAULT_CONFIG, ...config };
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
    const offgridArrays = this._configuredArrays(this.config.offgrid);
    const gridArrays = this._configuredArrays(this.config.grid_tie);
    const additionalLoads = this._additionalLoads();
    const gridPvPositions = this._pvPositions(gridArrays.length, 20);
    const offgridPvPositions = this._pvPositions(offgridArrays.length, 50);
    const expandedPvLayout = gridArrays.length > 2 || offgridArrays.length > 2;
    const gridName = String(this.config.power_box?.grid_name || "Grid").trim() || "Grid";
    const gridIcon = this.config.power_box?.grid_icon
      ? `<ha-icon icon="${this._escape(this.config.power_box.grid_icon)}"></ha-icon>`
      : ICONS.grid;
    const powerBoxName = String(this.config.power_box?.name || "Power Box").trim() || "Power Box";
    const powerBoxIcon = this.config.power_box?.icon
      ? `<ha-icon icon="${this._escape(this.config.power_box.icon)}"></ha-icon>`
      : ICONS.powerbox;
    const gridTieName = String(this.config.grid_tie.name || "Grid-tie").trim() || "Grid-tie";
    const gridTieIcon = this.config.grid_tie.icon ? `<ha-icon icon="${this._escape(this.config.grid_tie.icon)}"></ha-icon>` : ICONS.inverter;
    const offgridName = String(this.config.offgrid.name || "Off-grid").trim() || "Off-grid";
    const offgridIcon = this.config.offgrid.icon ? `<ha-icon icon="${this._escape(this.config.offgrid.icon)}"></ha-icon>` : ICONS.inverter;
    this.shadowRoot.innerHTML = `
      <style>${this._styles()}</style>
      <ha-card>
        <div class="card-head compact-head">
          <h1>${this._escape(this.config.title)}</h1>
        </div>

        ${this.config.show_overview ? `<div class="overview">
          <div class="metric solar-metric"><span>Solar production</span><strong data-value="total-solar">—</strong></div>
          <div class="metric"><span>Home usage</span><strong data-value="house-power">—</strong></div>
          <div class="metric battery-metric"><span>Battery flow</span><strong data-value="battery-power">—</strong></div>
          <div class="metric grid-metric"><span>Grid flow</span><strong data-value="grid-power">—</strong></div>
        </div>` : ""}

        <div class="diagram-wrap">
          <div class="diagram additional-count-${additionalLoads.length} ${expandedPvLayout ? "pv-expanded" : ""}" aria-label="Home power flow diagram">
            ${this._flowSvg(additionalLoads.length, gridPvPositions, offgridPvPositions)}
            ${gridArrays.map((array, i) => `<button class="node pv-node node-grid-pv-${i + 1}" style="left:${gridPvPositions[i].x}%;top:${gridPvPositions[i].y}%" type="button" data-open-panel="grid-array-${i}">${this._nodeHead(ICONS.panel, array.name || `PV${i + 1}`, `grid-pv-${i}`)}</button>`).join("")}
            <div class="total-node node-grid-solar"><strong data-value="grid-solar-total">—</strong></div>
            <button class="node node-offgrid-inverter" type="button" data-open-panel="offgrid-inverter-panel">
              ${this._nodeHead(offgridIcon, offgridName, "offgrid-output", "", this.config.offgrid.icon_size)}
            </button>
            <button class="node node-grid-inverter" type="button" data-open-panel="grid-inverter-panel">
              ${this._nodeHead(gridTieIcon, gridTieName, "grid-output", "", this.config.grid_tie.icon_size)}
            </button>
            ${offgridArrays.map((array, i) => `<button class="node pv-node node-offgrid-pv-${i + 1}" style="left:${offgridPvPositions[i].x}%;top:${offgridPvPositions[i].y}%" type="button" data-open-panel="offgrid-array-${i}">${this._nodeHead(ICONS.panel, array.name || `PV${i + 1}`, `offgrid-pv-${i}`)}</button>`).join("")}
            <div class="total-node node-offgrid-solar"><strong data-value="offgrid-solar-total">—</strong></div>
            <div class="node node-static node-power-box">
              ${this._nodeHead(powerBoxIcon, powerBoxName, "power-box-power", "To inverter", this.config.power_box?.icon_size)}
            </div>
            <div class="node node-static node-house">
              ${this._nodeHead(ICONS.house, "House", "house-node-power")}
            </div>
            ${additionalLoads.map((load, index) => `<div class="node node-static node-additional node-additional-${index + 1}">
              ${this._nodeHead(`<ha-icon icon="${this._escape(load.icon)}"></ha-icon>`, load.name, `additional-${index}-node-power`, "", load.iconSize)}
            </div>`).join("")}
            <button class="node node-grid" type="button" data-open-panel="grid-panel">
              ${this._nodeHead(gridIcon, gridName, "grid-node-power", "", this.config.power_box?.grid_icon_size)}
            </button>
            <button class="node node-battery-bank" type="button" data-open-panel="battery-bank-panel">
              <div class="battery-state"><span class="battery-stack">${ICONS.battery}</span><span data-value="battery-status">Idle</span></div>
              <div class="node-copy"><b>Battery bank</b><strong data-value="battery-soc">—</strong></div>
            </button>
            <div class="battery-current" data-value="battery-current">—</div>
            <div class="battery-row" style="--battery-count:${Math.max(1, batteries.length)}">
              ${batteries.map((battery, i) => `<button class="pack-node" type="button" data-open-panel="battery-${i}">
                <span class="pack-icon">${ICONS.battery}</span>
                <span><b>P${i + 1}</b><strong data-value="battery-${i}-soc">—</strong><small data-value="battery-${i}-current">—</small></span>
              </button>`).join("")}
            </div>
          </div>
        </div>

        <div class="panel-source" aria-hidden="true">
          ${this._solarGroup("offgrid", "Off-grid solar arrays", offgridArrays, this.config.offgrid.solar_power)}
          ${this.config.battery_bank ? this._batteryBankGroup(this.config.battery_bank) : ""}
          ${this._batteryGroup(this.config.batteries || [])}
          ${this._inverterGroup("offgrid-inverter-panel", this.config.offgrid, "Off-grid inverter")}
          ${this._solarGroup("grid", "Grid-tie solar arrays", gridArrays, this.config.grid_tie.solar_power)}
          ${this._inverterGroup("grid-inverter-panel", this.config.grid_tie, "Grid-tie inverter")}
          ${this.config.power_box ? this._gridGroup(this.config.power_box) : ""}
          ${this.config.power_box ? this._powerBoxGroup(this.config.power_box) : ""}
          ${this._loadsGroup(this.config.house)}
        </div>
        <div class="updated" data-value="updated">Waiting for Home Assistant…</div>
        <dialog class="detail-dialog" data-detail-dialog aria-label="Equipment details">
          <button class="dialog-close" type="button" data-close-dialog aria-label="Close details">&times;</button>
          <div class="dialog-content" data-dialog-content></div>
        </dialog>
      </ha-card>
    `;
    this.shadowRoot.addEventListener("click", (event) => this._handleClick(event));
  }

  _iconScale(iconSize) {
    const requested = Number(iconSize);
    return Math.min(2, Math.max(0.5, Number.isFinite(requested) ? requested / 100 : 1));
  }

  _nodeHead(icon, label, valueKey, sublabel = "", iconSize = 100) {
    return `<div class="node-icon" style="zoom:${this._iconScale(iconSize)}">${icon}</div><div class="node-copy"><b>${this._escape(label)}</b>${sublabel ? `<small>${this._escape(sublabel)}</small>` : ""}<strong data-value="${valueKey}">—</strong></div>`;
  }

  _additionalLoads(house = this.config.house || {}) {
    return [1, 2].map((number) => {
      const legacy = number === 1;
      const name = String(house[`additional_${number}_name`] || (legacy ? house.additional_name : "") || "").trim();
      return {
        name,
        power: house[`additional_${number}_power`] || (legacy ? house.additional_power || house.shed_powerpoints : ""),
        icon: house[`additional_${number}_icon`] || (legacy ? house.additional_icon : "") || "mdi:home-outline",
        iconSize: house[`additional_${number}_icon_size`] || (legacy ? house.additional_icon_size : 100) || 100,
      };
    }).filter((load) => load.name);
  }

  _configuredArrays(inverter = {}) {
    return (inverter.arrays || []).filter((array) => array && (array.name || array.power || array.voltage || array.current)).slice(0, 4);
  }

  _pvPositions(count, center) {
    if (count <= 1) return count ? [{ x: center, y: 18 }] : [];
    if (count === 2) return [{ x: center - 7, y: 18 }, { x: center + 7, y: 18 }];
    const positions = [
      { x: center - 7, y: 12 }, { x: center + 7, y: 12 },
      { x: center - 7, y: 22 }, { x: center + 7, y: 22 },
    ];
    if (count === 3) positions[2] = { x: center, y: 22 };
    return positions.slice(0, Math.min(count, 4));
  }

  _pvFlowPaths(id, positions, center) {
    return positions.map((position, index) => {
      const x = position.x * 6;
      const y = position.y * 6.2 + 24;
      return `<path id="flow-${id}-pv-${index}" class="flow solar-flow" d="M${x.toFixed(1)} ${y.toFixed(1)} L${x.toFixed(1)} 166 L${center} 166 L${center} 180"/>`;
    }).join("");
  }

  _flowSvg(additionalCount = 0, gridPvPositions = [], offgridPvPositions = []) {
    const count = Math.max(1, (this.config.batteries || []).length);
    const packBranches = Array.from({ length: count }, (_, i) => {
      const x = 72 + ((i + 0.5) * 456 / count);
      return `<path id="flow-battery-${i}" class="flow battery-flow battery-branch" d="M300 500 L${x.toFixed(1)} 500 L${x.toFixed(1)} 555"/>`;
    }).join("");
    return `<svg class="flow-lines" viewBox="0 0 600 620" preserveAspectRatio="none" aria-hidden="true">
      <path id="flow-grid" class="flow grid-flow" d="M48 75 L48 90 L20 90 L20 340 L119 340"/>
      ${this._pvFlowPaths("grid", gridPvPositions, 120)}
      <path id="flow-grid-solar" class="flow solar-flow" d="M120 191 L120 218"/>
      <path id="flow-gridtie-box" class="flow solar-flow" d="M120 286 L120 315 L132 315 L132 327"/>
      <path id="flow-box-inverter" class="flow grid-flow" d="M145 340 L220 340 L220 300 L272 300"/>
      ${this._pvFlowPaths("offgrid", offgridPvPositions, 300)}
      <path id="flow-offgrid-solar" class="flow solar-flow" d="M300 191 L300 267"/>
      <path id="flow-offgrid-house" class="flow load-flow" d="${additionalCount === 0 ? "M328 300 L514 300" : additionalCount === 1 ? "M328 300 L465 300 L465 345 L514 345" : "M328 300 L465 300 L465 390 L514 390"}"/>
      ${additionalCount >= 1 ? `<path id="flow-additional-0" class="flow load-flow" d="M465 300 L465 ${additionalCount === 1 ? 225 : 210} L514 ${additionalCount === 1 ? 225 : 210}"/>` : ""}
      ${additionalCount >= 2 ? '<path id="flow-additional-1" class="flow load-flow" d="M465 300 L514 300"/>' : ""}
      <path id="flow-battery" class="flow battery-flow" d="M300 365 L300 428"/>
      ${packBranches}
    </svg>`;
  }

  _solarGroup(id, label, arrays, totalPower) {
    const panels = arrays.length ? arrays.map((array, i) => this._expandPanel(`${id}-array-${i}`, array.name || `Array ${i + 1}`, ICONS.panel, [
      ["Power", array.power, "W"], ["Voltage", array.voltage, "V"], ["Current", array.current, "A"],
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
    const inverterIcon = inverter.icon ? `<ha-icon icon="${this._escape(inverter.icon)}"></ha-icon>` : ICONS.inverter;
    const fields = [
      ["AC output power", inverter.output_power, "W"], ["AC output voltage", inverter.output_voltage, "V"],
      ["AC output current", inverter.output_current, "A"], ["AC frequency", inverter.frequency, "Hz"],
      ["Load", inverter.load_percent, "%"], ["Temperature", inverter.temperature, "°C"],
      ["DC / bus voltage", inverter.bus_voltage, "V"], ["External Power monitor", inverter.grid_input_power, "W"],
      ["PV power", inverter.solar_power, "W"], ["PV generation today", inverter.solar_daily, "kWh"],
      ["PV today (alternate)", inverter.solar_daily_alt, "kWh"], ["PV generation total", inverter.solar_total, "kWh"],
      ["Output today", inverter.output_daily, "kWh"],
      ["Status", inverter.status, ""], ["Mode", inverter.mode, ""],
    ];
    return `<section class="group"><div class="group-label">Inverter</div>${this._expandPanel(id, inverter.name || fallbackName, inverterIcon, fields)}</section>`;
  }

  _gridGroup(powerBox) {
    const hasSeparateGridSensors = powerBox.grid_import_power || powerBox.grid_export_power;
    const filterPhantomPower = Number(powerBox.phantom_power_threshold) > 0;
    const gridName = String(powerBox.grid_name || "Grid").trim() || "Grid";
    const gridIcon = powerBox.grid_icon ? `<ha-icon icon="${this._escape(powerBox.grid_icon)}"></ha-icon>` : ICONS.grid;
    const fields = [
      [hasSeparateGridSensors ? "Grid import" : "Grid net power", filterPhantomPower ? { calculated: hasSeparateGridSensors ? "grid-filtered-import" : "grid-filtered-power" } : powerBox.grid_import_power || powerBox.power, "W"],
      ["Grid export", hasSeparateGridSensors ? (filterPhantomPower ? { calculated: "grid-filtered-export" } : powerBox.grid_export_power) : null, "W"],
      ["Voltage", powerBox.voltage, "V"],
      [powerBox.calculate_current ? "Calculated current" : "Current", powerBox.calculate_current ? { calculated: "grid-calculated-current" } : powerBox.current, "A"],
      ["Frequency", powerBox.frequency, "Hz"], ["Daily import", powerBox.daily_import, "kWh"],
      ["Daily export", powerBox.daily_export, "kWh"], ["Grid energy", powerBox.energy, "kWh"],
    ];
    return `<section class="group"><div class="group-label">Grid connection</div>${this._expandPanel("grid-panel", gridName, gridIcon, fields)}</section>`;
  }

  _powerBoxGroup(powerBox) {
    const powerBoxIcon = powerBox.icon ? `<ha-icon icon="${this._escape(powerBox.icon)}"></ha-icon>` : ICONS.powerbox;
    const filterPhantomPower = Number(powerBox.offgrid_phantom_power_threshold) > 0;
    const fields = [
      ["To off-grid inverter", filterPhantomPower ? { calculated: "power-box-filtered-power" } : powerBox.offgrid_power || this.config.offgrid.grid_input_power, "W"],
    ];
    return `<section class="group"><div class="group-label">Power distribution</div>${this._expandPanel("power-box-panel", powerBox.name || "Power Box", powerBoxIcon, fields)}</section>`;
  }

  _loadsGroup(house) {
    const additionalLoads = this._additionalLoads(house);
    const fields = [
      ["Power to house", house.power, "W"],
      ...additionalLoads.map((load) => [`${load.name} power`, load.power, "W"]),
    ];
    return `<section class="group"><div class="group-label">Loads</div>${this._expandPanel("loads-panel", house.name || "House and additional loads", ICONS.house, fields)}</section>`;
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
    if (typeof entity === "object" && entity?.calculated) {
      return `<div class="reading calculated-reading"><span>${this._escape(label)}</span><b data-value="${this._escape(entity.calculated)}">—</b></div>`;
    }
    return `<button type="button" class="reading" data-entity="${this._escape(entity)}">
      <span>${this._escape(label)}</span><b data-entity-value="${this._escape(entity)}" data-unit="${this._escape(unit)}" data-precision="${precision}">—</b>
    </button>`;
  }

  _renderValues() {
    const offgridArrays = this._configuredArrays(this.config.offgrid);
    const gridArrays = this._configuredArrays(this.config.grid_tie);
    const batteries = this.config.batteries || [];
    const offgridSolar = this.config.offgrid.solar_power
      ? this._number(this.config.offgrid.solar_power)
      : this._sum(offgridArrays.map((item) => item.power));
    const gridSolar = gridArrays.length
      ? this._sum(gridArrays.map((item) => item.power))
      : this._number(this.config.grid_tie.solar_power);
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
    const bankCurrent = this._number(this.config.battery_bank?.current);
    const housePower = this._number(this.config.house.power);
    const additionalLoads = this._additionalLoads();
    const additionalPowers = additionalLoads.map((load) => this._number(load.power));
    const signedGridState = this._state(this.config.power_box?.power);
    const signedGridValue = Number.parseFloat(signedGridState?.state);
    const gridMeterPower = Number.isFinite(signedGridValue) ? signedGridValue : 0;
    const hasSeparateGridSensors = Boolean(
      this.config.power_box?.grid_import_power || this.config.power_box?.grid_export_power
    );
    const rawGridImport = hasSeparateGridSensors
      ? this._number(this.config.power_box?.grid_import_power)
      : Math.max(gridMeterPower, 0);
    const rawGridExport = hasSeparateGridSensors
      ? this._number(this.config.power_box?.grid_export_power)
      : Math.max(-gridMeterPower, 0);
    const phantomPowerThreshold = Math.max(0, Number(this.config.power_box?.phantom_power_threshold) || 0);
    const gridImport = rawGridImport <= phantomPowerThreshold ? 0 : rawGridImport;
    const gridExport = rawGridExport <= phantomPowerThreshold ? 0 : rawGridExport;
    const gridPower = gridImport - gridExport;
    const gridVoltage = this._number(this.config.power_box?.voltage);
    const calculatedGridCurrent = gridVoltage > 0 ? Math.abs(gridPower) / gridVoltage : Number.NaN;
    const rawOffgridGridPower = this._number(this.config.power_box?.offgrid_power || this.config.offgrid.grid_input_power);
    const powerBoxPhantomThreshold = Math.max(0, Number(this.config.power_box?.offgrid_phantom_power_threshold) || 0);
    const offgridGridPower = Math.abs(rawOffgridGridPower) <= powerBoxPhantomThreshold ? 0 : rawOffgridGridPower;
    const offgridOutput = this._number(this.config.offgrid.output_power);
    const gridOutput = this._number(this.config.grid_tie.output_power);
    const batteryStatus = batteryPower === 0
      ? "Idle"
      : batteryPower > 0 ? "Charging" : "Discharging";

    const values = {
      "total-solar": this._formatPower(totalSolar),
      "house-power": this._formatPower(housePower),
      "battery-power": `${this._formatPower(Math.abs(batteryPower))} ${batteryStatus.toLowerCase()}`,
      "grid-power": gridImport > 0 ? `${this._formatPower(gridImport)} import` : gridExport > 0 ? `${this._formatPower(gridExport)} export` : "0 W idle",
      "offgrid-solar-total": this._formatPower(offgridSolar),
      "grid-solar-total": this._formatPower(gridSolar),
      "offgrid-output": this._formatPower(offgridOutput),
      "grid-output": this._formatPower(gridOutput),
      "battery-soc": `${bankSoc.toFixed(0)}% SOC`,
      "battery-current": `${Math.abs(bankCurrent).toFixed(1)} A`,
      "battery-status": batteryStatus,
      "battery-direction": `${this._formatPower(Math.abs(batteryPower))} ${batteryStatus.toLowerCase()}`,
      "power-box-power": this._formatPower(Math.abs(offgridGridPower)),
      "power-box-filtered-power": this._formatPower(offgridGridPower),
      "power-box-direction": gridImport > 0 ? "Importing from grid" : gridExport > 0 ? "Exporting to grid" : "Grid idle",
      "house-node-power": this._formatPower(housePower),
      "grid-node-power": this._formatPower(Math.abs(gridPower)),
      "grid-filtered-power": this._formatPower(gridPower),
      "grid-filtered-import": this._formatPower(gridImport),
      "grid-filtered-export": this._formatPower(gridExport),
      "grid-calculated-current": Number.isFinite(calculatedGridCurrent) ? `${calculatedGridCurrent.toFixed(this.config.precision)} A` : "—",
      "grid-direction": gridImport > 0 ? "Importing" : gridExport > 0 ? "Exporting" : "Idle",
      "offgrid-status": this._state(this.config.offgrid.status)?.state || "Online",
      "grid-status": this._state(this.config.grid_tie.status)?.state || "Online",
      "updated": `Updated ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`,
    };
    Object.entries(values).forEach(([key, value]) => {
      this.shadowRoot.querySelectorAll(`[data-value="${key}"]`).forEach((element) => {
        element.textContent = value;
      });
    });
    additionalPowers.forEach((power, index) => {
      const element = this.shadowRoot.querySelector(`[data-value="additional-${index}-node-power"]`);
      if (element) element.textContent = this._formatPower(power);
    });
    gridArrays.forEach((array, i) => {
      const element = this.shadowRoot.querySelector(`[data-value="grid-pv-${i}"]`);
      if (element) element.textContent = this._power(array.power);
    });
    offgridArrays.forEach((array, i) => {
      const element = this.shadowRoot.querySelector(`[data-value="offgrid-pv-${i}"]`);
      if (element) element.textContent = this._power(array.power);
    });
    batteries.forEach((battery, i) => {
      const soc = this._number(battery.soc);
      const current = this._number(battery.current);
      const socElement = this.shadowRoot.querySelector(`[data-value="battery-${i}-soc"]`);
      const currentElement = this.shadowRoot.querySelector(`[data-value="battery-${i}-current"]`);
      if (socElement) socElement.textContent = `${soc.toFixed(0)}%`;
      if (currentElement) currentElement.textContent = `${Math.abs(current).toFixed(1)} A`;
    });

    this.shadowRoot.querySelectorAll("[data-entity-value]").forEach((element) => {
      element.textContent = this._value(element.dataset.entityValue, element.dataset.unit, Number(element.dataset.precision));
      element.closest("button")?.classList.toggle("unavailable", !this._state(element.dataset.entityValue));
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
    if (this.config.power_box) {
      this._summary("grid-panel", gridImport > 0
        ? `${this._formatPower(gridImport)} importing`
        : gridExport > 0 ? `${this._formatPower(gridExport)} exporting` : "Grid idle");
      this._summary("power-box-panel", `${this._formatPower(Math.abs(offgridGridPower))} to off-grid inverter`);
    }

    offgridArrays.forEach((array, i) => this._setFlow(`flow-offgrid-pv-${i}`, this._number(array.power)));
    gridArrays.forEach((array, i) => this._setFlow(`flow-grid-pv-${i}`, this._number(array.power)));
    this._setFlow("flow-offgrid-solar", offgridSolar);
    this._setFlow("flow-grid-solar", gridSolar);
    this._setFlow("flow-offgrid-house", offgridOutput);
    additionalPowers.forEach((power, index) => this._setFlow(`flow-additional-${index}`, power));
    this._setFlow("flow-gridtie-box", gridOutput);
    this._setFlow("flow-box-inverter", offgridGridPower);
    this._setFlow("flow-battery", batteryPower, batteryPower < 0);
    batteries.forEach((battery, i) => {
      const packPower = this._number(battery.power);
      this._setFlow(`flow-battery-${i}`, packPower, packPower < 0);
    });
    this._setFlow("flow-grid", gridPower, gridPower < 0);
    gridArrays.forEach((array, i) => this._setPowerInactive(`.node-grid-pv-${i + 1}`, this._number(array.power)));
    offgridArrays.forEach((array, i) => this._setPowerInactive(`.node-offgrid-pv-${i + 1}`, this._number(array.power)));
    this._setPowerInactive(".node-grid-solar", gridSolar);
    this._setPowerInactive(".node-offgrid-solar", offgridSolar);
    this._setPowerInactive(".node-grid-inverter", gridOutput);
    this._setPowerInactive(".node-offgrid-inverter", offgridOutput);
    this._setPowerInactive(".node-power-box", offgridGridPower);
    this._setPowerInactive(".node-grid", gridPower);
    const gridColor = gridPower > 0
      ? "#ff5b5b"
      : gridPower < 0 ? "#72e6a2" : "#b48cff";
    const gridTieShare = Math.min(1, Math.max(0, gridOutput / Math.max(Math.abs(offgridGridPower), 1)));
    const boxColor = offgridGridPower === 0
      ? "#b48cff"
      : `rgb(${Math.round(255 - (141 * gridTieShare))}, ${Math.round(91 + (139 * gridTieShare))}, ${Math.round(91 + (71 * gridTieShare))})`;
    this._setFlowColor("flow-grid", gridColor);
    this._setFlowColor("flow-box-inverter", boxColor);
    const gridNode = this.shadowRoot.querySelector(".node-grid");
    if (gridNode) {
      gridNode.style.color = gridColor;
      const gridLabel = gridNode.querySelector(".node-copy b");
      if (gridLabel) gridLabel.style.color = gridColor;
    }
  }

  _formatPower(value) {
    const abs = Math.abs(value);
    return abs >= 1000 ? `${(value / 1000).toFixed(2)} kW` : `${value.toFixed(0)} W`;
  }

  _summary(id, text) {
    this.shadowRoot.querySelectorAll(`[data-summary="${id}"]`).forEach((element) => {
      element.textContent = text;
    });
  }

  _cellSpread(id, cells) {
    const elements = this.shadowRoot.querySelectorAll(`[data-cell-spread="${id}"]`);
    if (!elements.length || !cells.length) return;
    const values = cells.map((entity) => this._number(entity, Number.NaN)).filter(Number.isFinite);
    if (!values.length) return;
    const spread = Math.max(...values) - Math.min(...values);
    elements.forEach((element) => {
      element.textContent = `Spread ${spread.toFixed(3)} V`;
      element.classList.toggle("warn", spread > (this.config.cell_warning_delta || 0.030));
    });
  }

  _setFlow(id, power, reverse = false) {
    const line = this.shadowRoot.getElementById(id);
    if (!line) return;
    const active = power !== 0 || this.config.show_zero_flows;
    line.classList.toggle("active", active);
    line.classList.toggle("reverse", reverse);
    line.style.setProperty("--flow-speed", `${Math.max(0.55, 2.2 - Math.min(Math.abs(power) / 2500, 1.5))}s`);
  }

  _setFlowColor(id, color) {
    const element = this.shadowRoot.getElementById(id);
    if (!element) return;
    element.style.stroke = color;
    element.style.color = color;
  }

  _setPowerInactive(selector, power) {
    this.shadowRoot.querySelectorAll(selector).forEach((element) => {
      element.classList.toggle("power-inactive", power === 0);
    });
  }

  _handleClick(event) {
    if (event.target.matches?.("[data-detail-dialog]")) {
      event.target.close();
      return;
    }
    const closeDialog = event.target.closest("[data-close-dialog]");
    if (closeDialog) {
      this.shadowRoot.querySelector("[data-detail-dialog]")?.close();
      return;
    }
    const openPanel = event.target.closest("[data-open-panel]");
    if (openPanel) {
      const panel = this.shadowRoot.querySelector(`[data-panel="${openPanel.dataset.openPanel}"]`);
      const dialog = this.shadowRoot.querySelector("[data-detail-dialog]");
      const content = this.shadowRoot.querySelector("[data-dialog-content]");
      if (panel && dialog && content) {
        const modalPanel = panel.cloneNode(true);
        modalPanel.classList.add("open", "modal-equipment");
        modalPanel.removeAttribute("data-panel");
        const modalHeader = modalPanel.querySelector("[data-expand]");
        modalHeader?.removeAttribute("data-expand");
        modalHeader?.removeAttribute("aria-expanded");
        content.replaceChildren(modalPanel);
        if (!dialog.open) dialog.showModal();
      }
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
      .diagram { position:relative; width:100%; max-width:650px; height:620px; margin:0 auto; overflow:hidden; border:0; border-radius:12px; background:transparent; }
      .flow-lines { position:absolute; inset:0; width:100%; height:100%; z-index:1; }
      .flow { fill:none; stroke-width:2; stroke-linecap:round; opacity:.18; transition:opacity .3s; vector-effect:non-scaling-stroke; }
      .flow.active { opacity:1; stroke-dasharray:2 8; animation:flow var(--flow-speed,1.3s) linear infinite; filter:drop-shadow(0 0 2px currentColor); will-change:stroke-dashoffset; }
      .flow.reverse { animation-direction:reverse; }
      .solar-flow { stroke:var(--solar); color:var(--solar); } .load-flow{stroke:var(--load);color:var(--load)} .battery-flow{stroke:var(--battery);color:var(--battery)} .grid-flow{stroke:var(--grid);color:var(--grid)}
      .node { position:absolute; z-index:2; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:1px; width:78px; min-height:76px; padding:3px; color:var(--load); border:0; border-radius:7px; background:transparent; text-align:center; cursor:pointer; transform:translate(-50%,-50%); }
      .node-static { cursor:default; }
      .node:hover,.pack-node:hover { background:#151c25; }
      .node,.total-node { transition:opacity .3s,filter .3s,color .3s; }
      .power-inactive { color:#596574 !important; opacity:.18; filter:grayscale(1); }
      .power-inactive .node-copy b { color:#596574 !important; }
      .node-icon { width:31px; height:31px; display:grid; place-items:center; }
      .node-icon svg,.equipment-icon svg { width:29px; height:29px; fill:none; stroke:currentColor; stroke-width:2.4; stroke-linecap:round; stroke-linejoin:round; }
      .node-icon ha-icon,.equipment-icon ha-icon { width:29px; height:29px; }
      .node-copy { width:100%; min-width:0; text-align:center; } .node-copy b { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#98a8bd; font-size:8px; font-weight:500; }
      .node-copy small { display:block; color:#7f91a8; font-size:7px; line-height:8px; white-space:nowrap; }
      .node-copy strong { display:inline-block; min-width:62px; margin-top:2px; padding:3px 5px; border:1px solid currentColor; border-radius:5px; color:currentColor; font-size:12px; text-align:center; white-space:nowrap; background:#0d1117; }
      .total-node { position:absolute; z-index:2; width:76px; min-height:34px; padding:2px; color:var(--solar); border:0; background:#0d1117; cursor:default; transform:translate(-50%,-50%); }
      .total-node strong { display:inline-block; min-width:70px; padding:4px 6px; border:1px solid currentColor; border-radius:6px; background:#0d1117; font-size:14px; white-space:nowrap; }
      .node-sub { position:absolute; left:45px; bottom:-1px; color:var(--muted); font-size:8px; white-space:nowrap; }
      .node-offgrid-inverter,.node-grid-inverter { background:transparent; }
      .node-offgrid-inverter { width:104px; min-height:122px; }
      .node-offgrid-inverter .node-icon { width:58px; height:62px; }
      .node-offgrid-inverter .node-icon svg { width:56px; height:60px; }
      .node-offgrid-inverter .node-copy strong { min-width:82px; font-size:14px; }
      .battery-state { display:flex; align-items:center; justify-content:center; gap:5px; color:var(--battery); font-size:9px; font-weight:700; white-space:nowrap; }
      .battery-stack { display:flex; align-items:flex-end; width:27px; color:var(--battery); }
      .battery-stack svg { width:25px; height:31px; fill:#0d1117; stroke:currentColor; stroke-width:2.6; }
      .pv-node { width:64px; min-height:72px; color:var(--solar); }
      .pv-node .node-icon { width:34px; height:30px; }.pv-node .node-icon svg{width:34px;height:28px}.pv-node .node-copy strong{min-width:56px;border:0;padding:1px;font-size:12px;color:var(--solar)}
      .pv-expanded .pv-node { min-height:54px; }
      .pv-expanded .pv-node .node-icon { width:28px;height:23px }.pv-expanded .pv-node .node-icon svg{width:28px;height:22px}.pv-expanded .pv-node .node-copy b{font-size:7px}.pv-expanded .pv-node .node-copy strong{font-size:10px}
      .node-grid{left:8%;top:6%;width:72px;color:var(--grid)} .node-power-box{left:22%;top:59%;width:72px;color:var(--grid)}
      .node-grid .node-icon,.node-power-box .node-icon{width:27px;height:27px}.node-grid .node-icon svg,.node-power-box .node-icon svg{width:25px}.node-grid .node-copy strong,.node-power-box .node-copy strong{min-width:55px;font-size:11px}
      .node-grid-solar{left:20%;top:28%}.node-grid-inverter{left:20%;top:40%;width:96px;color:var(--load)}
      .node-offgrid-solar{left:50%;top:28%}.node-offgrid-inverter{left:50%;top:49%;color:var(--load)}
      .pv-expanded .node-grid-solar,.pv-expanded .node-offgrid-solar{top:31%}
      .node-house{left:88%;color:var(--load)} .node-additional{left:88%;color:#5ddfc6}
      .diagram.additional-count-0 .node-house{top:49%}
      .diagram.additional-count-1 .node-house{top:56%}.diagram.additional-count-1 .node-additional-1{top:36%}
      .diagram.additional-count-2 .node-house{top:63%}.diagram.additional-count-2 .node-additional-1{top:34%}.diagram.additional-count-2 .node-additional-2{top:49%}
      .node-battery-bank{left:50%;top:73%;color:var(--battery)}
      .battery-current { position:absolute; z-index:3; left:50%; top:62%; padding:2px 6px; color:var(--battery); background:#0d1117; font-size:12px; font-weight:700; transform:translate(-50%,-50%); }
      .battery-row { position:absolute; z-index:3; left:12%; right:12%; bottom:5px; display:grid; grid-template-columns:repeat(var(--battery-count),minmax(0,1fr)); }
      .pack-node { width:62px; min-width:0; min-height:70px; justify-self:center; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:0; padding:2px; color:var(--battery); border:0; border-radius:7px; background:transparent; text-align:center; cursor:pointer; }
      .pack-icon{height:23px}.pack-icon svg { width:18px; height:23px; fill:#0d1117; stroke:currentColor; stroke-width:2.5; }
      .pack-node b,.pack-node strong,.pack-node small { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
      .pack-node b { color:#8fa0b5; font-size:8px; font-weight:500; }.pack-node strong{font-size:13px}.pack-node small{display:block;color:var(--battery);font-size:9px;font-weight:700}
      .panel-source { display:none; }
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
      .calculated-reading { cursor:default; }
      .reading span { display:block; overflow:hidden; color:var(--muted); font-size:9px; white-space:nowrap; text-overflow:ellipsis; }.reading b{display:block;margin-top:3px;font-size:11px;white-space:nowrap}.reading.unavailable{opacity:.45}
      .cells-head { display:flex;justify-content:space-between;margin:13px 2px 7px;font-size:10px}.cells-head span{color:var(--muted)}.cells-head .warn{color:#ff8a75}
      .cell-grid { display:grid;grid-template-columns:repeat(4,1fr);gap:4px}.cell{padding:6px 3px;border:1px solid rgba(114,230,162,.12);border-radius:7px;color:inherit;background:rgba(114,230,162,.035);cursor:pointer}.cell span{display:block;color:#6e8298;font-size:8px}.cell b{display:block;margin-top:2px;font-size:9px}.cell.unavailable{opacity:.4}
      .updated { padding:0 24px 17px; color:#596a80; font-size:9px; text-align:right; }
      .detail-dialog { width:min(560px,calc(100vw - 24px)); max-width:none; max-height:min(82vh,720px); margin:auto; padding:44px 12px 12px; overflow:auto; color:var(--ink); border:1px solid rgba(255,255,255,.13); border-radius:16px; background:#0d1117; box-shadow:0 22px 70px rgba(0,0,0,.65); }
      .detail-dialog::backdrop { background:rgba(0,0,0,.72); backdrop-filter:blur(3px); }
      .dialog-close { position:absolute; z-index:2; top:9px; right:10px; width:32px; height:32px; display:grid; place-items:center; padding:0; color:#b6c3d6; border:1px solid rgba(255,255,255,.1); border-radius:50%; background:#151c25; font-size:24px; line-height:1; cursor:pointer; }
      .dialog-close:hover { color:#fff; background:#202a36; }
      .dialog-content .equipment { border:0; background:transparent; }
      .dialog-content .equipment-head { padding:4px 46px 13px 4px; cursor:default; pointer-events:none; }
      .dialog-content .equipment-head:hover { background:transparent; }
      .dialog-content .equipment-head .chevron { display:none; }
      .dialog-content .equipment-body { display:block; padding:0 2px 2px; }
      .dialog-content .reading { background:#111821; }
      @keyframes flow{from{stroke-dashoffset:0}to{stroke-dashoffset:-20}} @keyframes pulse{50%{opacity:.4}} @keyframes reveal{from{opacity:0;transform:translateY(-4px)}}
      @media(max-width:700px){
        .card-head{padding:11px 14px 1px}.overview{grid-template-columns:repeat(2,1fr);padding:0 14px 12px}.diagram{height:600px}
        .node{width:76px}.node-icon{width:28px;height:28px}.node-icon svg{width:27px}.node-copy strong{min-width:58px;font-size:11px}.node-copy b{font-size:8px}
        .pv-node{width:58px}.pv-node .node-copy strong{min-width:50px;font-size:10px}.node-offgrid-inverter{width:96px}.node-offgrid-inverter .node-icon{width:52px;height:56px}.node-offgrid-inverter .node-icon svg{width:50px;height:54px}
        .node-power-box{width:78px}.node-power-box .node-copy b{font-size:7px}.node-power-box .node-copy small{font-size:6px}
        .node-battery-bank{width:100px}
        .panel-grid,.batteries-grid{grid-template-columns:1fr}
      }
      @media(max-width:390px){.metric strong{font-size:12px}.diagram{height:580px}.node{width:66px}.node-grid{left:8%;width:60px}.node-power-box{left:22%;width:74px}.node-battery-bank{width:96px}.pv-node{width:52px}.node-offgrid-inverter{left:50%;width:88px}.node-house,.node-additional{left:88%}.battery-row{left:12%;right:12%}.pack-node{width:52px}.pack-icon svg{width:16px}.pack-node b{font-size:7px}}
    `;
  }
}

class HomePowerFlowCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._fieldPaths = new Map();
    this._openSections = new Set();
  }

  setConfig(config) {
    const activeField = this.shadowRoot?.activeElement?.closest?.("[data-editor-field]");
    if (activeField) {
      this._config = JSON.parse(JSON.stringify(config || EDITOR_STUB_CONFIG));
      this._syncEntityPickers();
      return;
    }
    if (this.shadowRoot) {
      this.shadowRoot.querySelectorAll("details[open]").forEach((section) => {
        if (section.dataset.section) this._openSections.add(section.dataset.section);
      });
    }
    this._config = JSON.parse(JSON.stringify(config || EDITOR_STUB_CONFIG));
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._syncEntityPickers();
  }

  get hass() {
    return this._hass;
  }

  _escape(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  _valueAt(path) {
    return path.reduce((value, key) => value?.[key], this._config);
  }

  _fieldId(field) {
    const id = `editor-field-${this._fieldPaths.size}`;
    this._fieldPaths.set(id, field.path);
    return id;
  }

  _renderField(field) {
    const id = this._fieldId(field);
    const value = this._valueAt(field.path);
    if (field.type === "boolean") {
      return `<label class="toggle field"><span>${this._escape(field.label)}</span><input data-editor-field="${id}" type="checkbox" ${value ? "checked" : ""}></label>`;
    }
    if (field.type === "icon") {
      return `<label class="field icon-field"><span>${this._escape(field.label)}</span><ha-icon-picker data-editor-field="${id}"></ha-icon-picker>${field.helper ? `<small>${this._escape(field.helper)}</small>` : ""}</label>`;
    }
    if (field.type === "text" || field.type === "number") {
      const inputType = field.type === "number" ? ' type="number" step="any"' : ' type="text"';
      const input = customElements.get("ha-textfield")
        ? `<ha-textfield class="editor-input" data-editor-field="${id}" data-editor-type="${field.type}" label="${this._escape(field.label)}"${inputType} value="${this._escape(value ?? "")}"></ha-textfield>`
        : `<label class="field"><span>${this._escape(field.label)}</span><input class="editor-input native-input" data-editor-field="${id}" data-editor-type="${field.type}"${inputType} value="${this._escape(value ?? "")}"></label>`;
      return `<div class="field text-field">${input}${field.helper ? `<small>${this._escape(field.helper)}</small>` : ""}</div>`;
    }
    return `<label class="field entity-field"><span>${this._escape(field.label)}</span><ha-entity-picker data-editor-field="${id}"></ha-entity-picker>${field.helper ? `<small>${this._escape(field.helper)}</small>` : ""}</label>`;
  }

  _renderSection(section, index) {
    const key = `section-${index}`;
    const open = section.open || this._openSections.has(key);
    const subsections = (section.subsections || []).map((subsection, subIndex) => {
      const subKey = `${key}-sub-${subIndex}`;
      const subOpen = this._openSections.has(subKey);
      return `<details class="subsection" data-section="${subKey}" ${subOpen ? "open" : ""}><summary>${this._escape(subsection.title)}</summary><div class="fields">${subsection.fields.map((field) => this._renderField(field)).join("")}</div></details>`;
    }).join("");
    return `<details class="section" data-section="${key}" ${open ? "open" : ""}><summary>${this._escape(section.title)}</summary><div class="section-body"><div class="fields">${section.fields.map((field) => this._renderField(field)).join("")}</div>${subsections}</div></details>`;
  }

  _render() {
    if (!this._config) return;
    this._fieldPaths.clear();
    this.shadowRoot.innerHTML = `
      <style>
        :host { display:block; color:var(--primary-text-color); }
        * { box-sizing:border-box; }
        .intro { margin:0 0 12px; padding:11px 12px; border-radius:10px; color:var(--secondary-text-color); background:var(--secondary-background-color); font-size:12px; line-height:1.45; }
        .section,.subsection { overflow:hidden; margin:0 0 9px; border:1px solid var(--divider-color); border-radius:10px; background:var(--card-background-color); }
        summary { padding:12px 13px; color:var(--primary-text-color); font-size:14px; font-weight:600; cursor:pointer; user-select:none; }
        .section-body { padding:0 12px 12px; }
        .fields { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:11px; }
        .field { min-width:0; display:flex; flex-direction:column; gap:5px; color:var(--secondary-text-color); font-size:12px; }
        .field > span { min-height:16px; }
        .field small { color:var(--secondary-text-color); font-size:10px; line-height:1.3; }
        .editor-input { width:100%; min-height:44px; }
        .native-input { height:44px; padding:0 11px; color:var(--primary-text-color); border:1px solid var(--divider-color); border-radius:8px; outline:none; background:var(--card-background-color); font:inherit; }
        .native-input:focus { border-color:var(--primary-color); box-shadow:0 0 0 1px var(--primary-color); }
        ha-entity-picker,ha-icon-picker { width:100%; }
        .toggle { grid-column:span 1; min-height:44px; flex-direction:row; align-items:center; justify-content:space-between; padding:0 10px; border:1px solid var(--divider-color); border-radius:8px; }
        .toggle input { width:19px; height:19px; accent-color:var(--primary-color); }
        .subsection { grid-column:1/-1; margin:12px 0 0; background:var(--secondary-background-color); }
        .subsection summary { font-size:12px; }
        .subsection .fields { padding:0 11px 11px; }
        @media(max-width:600px){.fields{grid-template-columns:1fr}.toggle{grid-column:auto}}
      </style>
      <p class="intro">Choose your Home Assistant entities below. Changes are saved by the dashboard editor; YAML editing is optional.</p>
      ${EDITOR_SECTIONS.map((section, index) => this._renderSection(section, index)).join("")}
    `;
    this._bindFields();
    this._syncEntityPickers();
  }

  _bindFields() {
    this.shadowRoot.querySelectorAll("[data-editor-field]").forEach((control) => {
      const path = this._fieldPaths.get(control.dataset.editorField);
      if (!path) return;
      if (control.localName === "ha-entity-picker" || control.localName === "ha-icon-picker") {
        control.addEventListener("value-changed", (event) => this._updatePath(path, event.detail?.value ?? event.target.value ?? ""));
      } else {
        control.addEventListener(control.type === "checkbox" ? "change" : "input", (event) => {
          const input = event.currentTarget;
          const editorType = input.dataset.editorType || input.type;
          const value = input.type === "checkbox" ? input.checked : editorType === "number" && input.value !== "" ? Number(input.value) : input.value;
          this._updatePath(path, value);
        });
      }
    });
  }

  _syncEntityPickers() {
    if (!this.shadowRoot || !this._config) return;
    this.shadowRoot.querySelectorAll("ha-entity-picker[data-editor-field],ha-icon-picker[data-editor-field]").forEach((picker) => {
      const path = this._fieldPaths.get(picker.dataset.editorField);
      if (this._hass) picker.hass = this._hass;
      picker.value = this._valueAt(path) || "";
      picker.label = "";
      if (picker.localName === "ha-entity-picker") picker.allowCustomEntity = true;
    });
  }

  _updatePath(path, value) {
    const config = JSON.parse(JSON.stringify(this._config || {}));
    let target = config;
    path.forEach((key, index) => {
      if (index === path.length - 1) {
        if (value === "" || value === undefined || value === null) {
          if (Array.isArray(target)) {
            target[key] = "";
            while (target.length && !target[target.length - 1]) target.pop();
          } else {
            delete target[key];
          }
        } else {
          target[key] = value;
        }
        return;
      }
      if (target[key] === undefined || target[key] === null) target[key] = typeof path[index + 1] === "number" ? [] : {};
      target = target[key];
    });
    this._config = config;
    this.dispatchEvent(new CustomEvent("config-changed", {
      bubbles: true,
      composed: true,
      detail: { config },
    }));
  }
}

if (!customElements.get("home-power-flow-card")) {
  customElements.define("home-power-flow-card", HomePowerFlowCard);
}

if (!customElements.get("home-power-flow-card-editor")) {
  customElements.define("home-power-flow-card-editor", HomePowerFlowCardEditor);
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
