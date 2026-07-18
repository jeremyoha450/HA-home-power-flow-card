# Home Power Flow Card

A dependency-free Home Assistant Lovelace card for a mixed off-grid and grid-tie power system.

The card includes:

- two expandable off-grid solar arrays;
- four expandable battery packs, including 16 cell voltages per pack;
- an expandable off-grid inverter;
- a grid-tie inverter with two expandable solar arrays;
- an expandable grid power box with import/export readings;
- live house consumption and grid import/export;
- animated, direction-aware power-flow lines; and
- built-in equipment illustrations, responsive mobile layout, and Home Assistant more-info dialogs.

The default view follows the compact power-flow approach used by inverter displays: only live sources, destinations, power values, and animated paths are visible. Voltage, current, temperature, daily energy, and individual pack information are kept behind the **System details** control. Set `show_overview: true` if you also want the four summary tiles above the diagram, or `details_open: true` to start with all equipment sections visible.

## Install with HACS

1. Open **HACS → Dashboard** in Home Assistant.
2. Open the three-dot menu and choose **Custom repositories**.
3. Add `https://github.com/jeremyoha450/HA-home-power-flow-card` and select **Dashboard** as the category.
4. Find **Home Power Flow Card** in HACS and choose **Download**.
5. Refresh Home Assistant after installation.
6. Add a **Manual** card to a dashboard and paste the contents of `example-card.yaml`.
7. Replace or adjust the example `sensor.*` entities for your system.

HACS should add the dashboard resource automatically. If it does not, add this as a JavaScript module under **Settings → Dashboards → Resources**:

```text
/hacsfiles/HA-home-power-flow-card/HA-home-power-flow-card.js
```

## Manual installation

1. Download `dist/HA-home-power-flow-card.js` and copy it to Home Assistant's `/config/www/` directory.
2. In Home Assistant, open **Settings → Dashboards → Resources**.
3. Add `/local/HA-home-power-flow-card.js` as a **JavaScript module**.
4. Refresh the browser. A hard refresh may be needed after replacing the file.
5. Add a **Manual** card to a dashboard and paste the contents of `example-card.yaml`.
6. Replace every example `sensor.*` entity with the corresponding entity from your system.

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
- `power_box.grid_import_power` and `power_box.grid_export_power`: separate, positive-valued sensors are preferred.
- `offgrid.grid_input_power`: power the off-grid inverter is taking from the grid/grid-tie power box.

For systems with only one bidirectional meter, `grid_tie.grid_power` remains supported as a fallback: positive is import and negative is export.

The compact schematic combines both existing Sunsynk views: grid and grid-tie generation meet at the power box, the power box connects to the off-grid inverter, and the off-grid inverter connects to the house, shed load, two solar inputs, and four individually visible battery packs. Tap any main component or battery pack to open its detailed readings.

## Current entity mapping

`example-card.yaml` is populated with the supplied MPP Solar, JK-BMS, power-box, house, and grid-tie entities. The `sensor.inverter_pv1_*` and `sensor.inverter_pv2_*` entities are assigned to the grid-tie arrays; the `sensor.mppsolar_inverter_pv1_*` and `sensor.mppsolar_inverter_pv2_*` entities are assigned to the off-grid arrays. Three details still need confirmation:

- `sensor.mppsolar_inverter_pv1_charging_powe` was supplied without the final `r`. Keep it if that is the real Home Assistant entity ID; otherwise change it to `sensor.mppsolar_inverter_pv1_charging_power`.
- Battery Pack 4 uses the assumed `sensor.jkbms_bat_4_jkbms_*` naming pattern. Change those entries if its actual entity prefix differs.
- The individual 16 cell-voltage entity IDs for each battery pack were not supplied. Average, minimum, and maximum cell voltage are already displayed. Add each pack's `cells:` list when those 64 IDs are known.

The example assumes `sensor.grid_power_watts` is signed live power: positive for import and negative for export. If `sensor.powerbox_grid_power` is the signed sensor instead, change both `power_box.power` and `grid_tie.grid_power` to that entity.

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

`home-power-flow-card.js` is the readable source file. `dist/HA-home-power-flow-card.js` is the HACS distributable and must be regenerated from the source whenever the card changes.
