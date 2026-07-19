# Home Power Flow Card

A dependency-free Home Assistant Lovelace card for a mixed off-grid and grid-tie power system.

The card includes:

- two expandable off-grid solar arrays;
- three expandable battery packs, including 16 cell voltages per pack;
- an expandable off-grid inverter;
- a grid-tie inverter with two expandable solar arrays;
- an expandable grid power box with import/export readings;
- live house consumption and grid import/export;
- animated, direction-aware power-flow lines; and
- built-in equipment illustrations, responsive mobile layout, Home Assistant more-info dialogs, and a full visual configuration editor.

The default view follows the compact power-flow approach used by inverter displays: only live sources, destinations, power values, and animated paths are visible. Voltage, current, temperature, daily energy, and individual pack information open in equipment popups when their diagram items are selected. Set `show_overview: true` if you also want the four summary tiles above the diagram.

## Install with HACS

1. Open **HACS → Dashboard** in Home Assistant.
2. Open the three-dot menu and choose **Custom repositories**.
3. Add `https://github.com/jeremyoha450/HA-home-power-flow-card` and select **Dashboard** as the category.
4. Find **Home Power Flow Card** in HACS and choose **Download**.
5. Refresh Home Assistant after installation.
6. Edit a dashboard, choose **Add card**, and select **Home Power Flow Card**.
7. Choose your entities in the visual editor and save the card.

HACS should add the dashboard resource automatically. If it does not, add this as a JavaScript module under **Settings → Dashboards → Resources**:

```text
/hacsfiles/HA-home-power-flow-card/HA-home-power-flow-card.js
```

## Manual installation

1. Download `dist/HA-home-power-flow-card.js` and copy it to Home Assistant's `/config/www/` directory.
2. In Home Assistant, open **Settings → Dashboards → Resources**.
3. Add `/local/HA-home-power-flow-card.js` as a **JavaScript module**.
4. Refresh the browser. A hard refresh may be needed after replacing the file.
5. Edit a dashboard, choose **Add card**, and select **Home Power Flow Card**.
6. Choose your entities in the visual editor and save the card.

If Dashboard Resources is not shown, add the resource under `lovelace.resources` in `configuration.yaml`:

```yaml
lovelace:
  resources:
    - url: /local/HA-home-power-flow-card.js
      type: module
```

## Power sign convention

The card uses these signs to animate flow direction:

- `battery_total_power`: positive is charging, negative is discharging.
- `power_box.power`: signed Grid power; positive is import and negative is export.
- `power_box.grid_import_power` and `power_box.grid_export_power`: optional separate, positive-valued sensors override the signed reading.
- `power_box.offgrid_power`: power being sent from the Power Box to the off-grid inverter (`offgrid.grid_input_power` remains a fallback).

## Visual editor

The dashboard card editor covers the complete system configuration with separate Grid and Power Box sections, plus the house and up to two optional named additional loads, both inverters, up to four PV inputs per inverter, combined battery bank, three battery packs, all 48 optional cell-voltage sensors, display options, and flow thresholds.

Grid current can use a sensor or be calculated from absolute Grid power divided by voltage. Separate Grid and Power Box phantom-power cutoffs treat readings from zero through their configured wattages as idle, suppressing the displayed power, status, colour, and flow animation; the Grid cutoff also suppresses calculated current. Grid, Power Box, both inverters, and optional loads support editable names and MDI icons.

Existing YAML cards remain supported. `example-card.yaml` is provided as a cleaned, ready-to-use configuration for this system, but normal installation and editing no longer require copying or changing YAML.

The compact schematic combines both existing Sunsynk views: grid and grid-tie generation meet at the power box, the power box connects to the off-grid inverter, and the off-grid inverter connects to the house, up to two optional named additional loads, up to four solar inputs on each inverter, and three individually visible battery packs. PV inputs automatically switch to a compact two-row layout when a third or fourth array is configured. Each optional load has its own power sensor and MDI icon setting. Leave either Additional name blank in the visual editor to hide that node; the House and remaining branches automatically reposition for zero, one, or two additional loads. Each battery pack has its own power-flow line.

## Current entity mapping

`example-card.yaml` is populated with the supplied MPP Solar, JK-BMS, power-box, house, and grid-tie entities. The `sensor.inverter_pv1_*` and `sensor.inverter_pv2_*` entities are assigned to the grid-tie arrays; the `sensor.mppsolar_inverter_pv1_*` and `sensor.mppsolar_inverter_pv2_*` entities are assigned to the off-grid arrays. Two details still need confirmation:

- `sensor.mppsolar_inverter_pv1_charging_powe` was supplied without the final `r`. Keep it if that is the real Home Assistant entity ID; otherwise change it to `sensor.mppsolar_inverter_pv1_charging_power`.
- The individual 16 cell-voltage entity IDs for each battery pack were not supplied. Average, minimum, and maximum cell voltage are already displayed. Add each pack's `cells:` list when those 48 IDs are known.

The example uses `sensor.powerbox_grid_power` as signed live power: positive for import and negative for export. Power sent from the Power Box to the off-grid inverter is read separately from `sensor.to_shed_power`.

If your sensors use the opposite convention, create a Home Assistant template sensor that multiplies the value by `-1`.

```yaml
template:
  - sensor:
      - name: "Battery bank power for flow card"
        unique_id: battery_bank_power_for_flow_card
        unit_of_measurement: W
        device_class: power
        state_class: measurement
        state: "{{ states('sensor.your_battery_power') | float(0) * -1 }}"
```

## Cell warnings

`cell_warning_delta` is the voltage spread at which a battery pack's cell-spread label changes colour. The default example is `0.030` V (30 mV). The displayed spread is calculated directly from the 16 configured cell sensors.

## Adjusting the diagram

The desktop schematic is defined in `_flowSvg()` and the `.node-*` CSS rules in `home-power-flow-card.js`. If your physical wiring differs, the node positions and flow paths can be adjusted to match it.

## Development

`home-power-flow-card.js` is the readable source file. `dist/HA-home-power-flow-card.js` is the HACS distributable and must be regenerated from the source whenever the card changes. `preview.html` tests the card and `editor-preview.html` tests the visual configuration editor locally.
