/** Solar energy calculation references:
 * Instantaneous: https://www.pveducation.org/pvcdrom/properties-of-sunlight/calculation-of-solar-insolation
 * Energy formula: https://www.sunbasedata.com/blog/how-to-calculate-solar-panel-output
 * Methodology: https://palmetto.com/solar/how-much-energy-does-a-solar-panel-produce
 * General guide: https://www.ecoflow.com/us/blog/how-to-calculate-solar-panel-output
 */
/**
 * All angles are in degrees
 */
export interface SolarPosition {
    declination: number;
    hourAngle: number;
    altitude: number;
    azimuth: number;
    zenith: number;
    /**
     * W/m² (solar on horizontal)
     */
    irradiance: number;
}
/**
 * Computes solar position and horizontal surface irradiance for a given location and UTC time.
 *
 * Reference: https://www.pveducation.org/pvcdrom/properties-of-sunlight/calculation-of-solar-insolation
 */
export declare function computeSolarPotential(lat: number, lon: number, date: Date): SolarPosition;
/**
 * Compute instantaneous solar panel output (W) given panel specs and sun conditions.
 *
 * Reference: https://www.sunbasedata.com/blog/how-to-calculate-solar-panel-output
 *
 * Power = Area * Efficiency * Irradiance
 *
 * @param area Panel area in m²
 * @param efficiency Panel efficiency (fraction 0–1)
 * @param irradiance Solar irradiance in W/m² (from computeSolarPotential)
 */
export declare function computePanelPower(area: number, efficiency: number, irradiance: number): number;
/**
 * Estimate total electrical energy produced over a given interval.
 *
 * Main reference: https://www.ecoflow.com/us/blog/how-to-calculate-solar-panel-output
 *
 * E(kWh) = Area * Efficiency * H * PR
 * H = daily (or monthly/yearly) average insolation on panel in kWh/m²/day
 * PR = performance ratio (accounts for losses, default 0.75)
 * Reference: https://palmetto.com/solar/how-much-energy-does-a-solar-panel-produce
 */
export declare function estimateEnergyProduced(area: number, efficiency: number, averageIrradiance: number, periodHours: number, performanceRatio?: number): number;
//# sourceMappingURL=index.d.ts.map