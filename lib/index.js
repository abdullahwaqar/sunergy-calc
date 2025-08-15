// The MIT License (MIT)
/** Helper for radians conversion */
const toRadians = (deg) => (deg * Math.PI) / 180;
const toDegrees = (rad) => (rad * 180) / Math.PI;
/** Clamp value between min and max */
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}
/**
 * Day of year from UTC date
 *
 * @param date
 * @returns
 */
function getDayOfYear(date) {
    const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
    const diff = date.getTime() - start.getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.floor(diff / oneDay);
}
/**
 * Computes solar position and horizontal surface irradiance for a given location and UTC time.
 *
 * Reference: https://www.pveducation.org/pvcdrom/properties-of-sunlight/calculation-of-solar-insolation
 */
export function computeSolarPotential(lat, lon, date) {
    if (Number.isNaN(lat) || lat < -90 || lat > 90) {
        throw new Error("Latitude must be in [-90, 90].");
    }
    if (Number.isNaN(lon) || lon < -180 || lon > 180) {
        throw new Error("Longitude must be in [-180, 180].");
    }
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
        throw new Error("Invalid Date object.");
    }
    /**
     * Solar constant, W/m²
     */
    const I0 = 1367;
    const n = getDayOfYear(date);
    // Solar declination (degrees), see https://www.pveducation.org/pvcdrom/properties-of-sunlight/declination-angle
    const decl = 23.45 * Math.sin(toRadians((360 / 365) * (n - 81)));
    // Solar time, see https://pvwatts.nrel.gov
    const hours = date.getUTCHours() +
        date.getUTCMinutes() / 60 +
        date.getUTCSeconds() / 3600;
    // Nearest standard meridian
    const lstm = 15 * Math.round(lon / 15);
    // Approx eq of time
    const eqTime = 7.5 * Math.sin(toRadians((360 / 365) * (n - 81)));
    const timeOffset = eqTime + 4 * (lon - lstm);
    const solarTime = hours + timeOffset / 60;
    const hourAngle = 15 * (solarTime - 12);
    // Angles in radians
    const latRad = toRadians(lat);
    const declRad = toRadians(decl);
    const haRad = toRadians(hourAngle);
    const sinAlt = clamp(Math.sin(latRad) * Math.sin(declRad) +
        Math.cos(latRad) * Math.cos(declRad) * Math.cos(haRad), -1, 1);
    const altitude = toDegrees(Math.asin(sinAlt));
    const zenith = 90 - altitude;
    let azimuth = NaN;
    let groundIrradiance = 0;
    if (altitude > 0) {
        // Azimuth: https://www.pveducation.org/pvcdrom/properties-of-sunlight/azimuth-angle
        const den = Math.cos(toRadians(altitude));
        let sinAz = den === 0 ? 0 : (Math.cos(declRad) * Math.sin(haRad)) / den;
        sinAz = clamp(sinAz, -1, 1);
        azimuth = toDegrees(Math.asin(sinAz));
        azimuth = hourAngle > 0 ? 180 - azimuth : 180 + azimuth;
        azimuth = (azimuth + 360) % 360;
        groundIrradiance = Math.max(0, I0 * sinAlt);
    }
    return {
        declination: decl,
        hourAngle: hourAngle,
        altitude,
        azimuth,
        zenith,
        irradiance: groundIrradiance,
    };
}
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
export function computePanelPower(area, efficiency, irradiance) {
    if (area < 0 || !Number.isFinite(area)) {
        throw new Error("Area must be >= 0.");
    }
    if (efficiency < 0 || efficiency > 1) {
        throw new Error("Efficiency in range 0–1.");
    }
    if (irradiance < 0) {
        return 0;
    }
    return area * efficiency * irradiance;
}
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
export function estimateEnergyProduced(area, efficiency, averageIrradiance, periodHours, performanceRatio = 0.75) {
    // For daily output, periodHours=24; for annual, periodHours=365 * 24, etc.
    if (area < 0 || !Number.isFinite(area)) {
        throw new Error("Panel area must be >= 0.");
    }
    if (efficiency < 0 || efficiency > 1) {
        throw new Error("Efficiency in range 0–1.");
    }
    if (averageIrradiance < 0) {
        throw new Error("Irradiance must be >= 0");
    }
    if (performanceRatio < 0 || performanceRatio > 1) {
        throw new Error("Performance ratio in 0–1");
    }
    if (periodHours <= 0) {
        throw new Error("Period hours must be > 0");
    }
    // Total Energy in kWh
    // averageIrradiance expected in W/m², so convert to kWh as averageIrradiance * period / 1000
    const energyKWh = area *
        efficiency *
        ((averageIrradiance * periodHours) / 1000) *
        performanceRatio;
    return energyKWh;
}
