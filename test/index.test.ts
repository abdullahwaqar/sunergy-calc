import {
    computePanelPower,
    computeSolarPotential,
    estimateEnergyProduced,
} from "../src";

describe("computeSolarPotential", () => {
    it("computes expected solar position at equator, equinox, solar noon", () => {
        const date = new Date(Date.UTC(2025, 2, 21, 12, 0, 0));
        const position = computeSolarPotential(0, 0, date);

        expect(Math.abs(position.declination)).toBeLessThan(0.5);

        // Allow up to 0.5 degree difference due to real-world astronomical subtlety
        // // Because the declination is not exactly zero and equations are approximate,
        // the solar altitude at equator/equinox/noon is close to but not exactly 90°.
        expect(Math.abs(position.altitude - 90)).toBeLessThan(0.5);
        expect(position.hourAngle).toBeCloseTo(0, 1);
        expect(position.irradiance).toBeGreaterThan(1350);
    });

    it("returns zero irradiance and NaN azimuth with nighttime (sun below horizon)", () => {
        const date = new Date(Date.UTC(2025, 2, 21, 0, 0, 0)); // Midnight UTC
        const position = computeSolarPotential(0, 0, date);
        expect(position.altitude).toBeLessThanOrEqual(0);
        expect(position.irradiance).toBe(0);
        expect(
            Number.isNaN(position.azimuth) || position.azimuth === undefined,
        ).toBe(true);
    });

    it("throws error on out-of-range latitude/longitude", () => {
        expect(() => computeSolarPotential(-91, 0, new Date())).toThrow();
        expect(() => computeSolarPotential(0, -181, new Date())).toThrow();
        expect(() => computeSolarPotential(0, 0, "bad-date" as any)).toThrow();
    });
});

describe("computePanelPower", () => {
    it("computes correct output", () => {
        const area = 2; // m²
        const eff = 0.2; // 20%
        const irrad = 1000; // W/m²
        expect(computePanelPower(area, eff, irrad)).toBeCloseTo(400);
    });

    it("returns zero if irradiance negative", () => {
        expect(computePanelPower(2, 0.2, -10)).toBe(0);
    });

    it("throws error on invalid input", () => {
        expect(() => computePanelPower(-2, 0.2, 1000)).toThrow();
        expect(() => computePanelPower(2, -0.1, 1000)).toThrow();
        expect(() => computePanelPower(2, 1.1, 1000)).toThrow();
    });
});

describe("estimateEnergyProduced", () => {
    it("computes correct daily energy", () => {
        // ~5kWh/m²/day under full sun for 2m² panel at 20% efficiency, PR=0.8
        const area = 2;
        const efficiency = 0.2;
        const avgIrr = 5000 / 24; // 5kWh/m²/day = ~208.3W/m² avg
        const kWh = estimateEnergyProduced(area, efficiency, avgIrr, 24, 0.8);
        // 2×0.2×5×0.8 = 1.6kWh/day
        expect(kWh).toBeCloseTo(1.6, 1);
    });

    it("throws error on invalid input", () => {
        expect(() => estimateEnergyProduced(-2, 0.2, 100, 24)).toThrow();
        expect(() => estimateEnergyProduced(2, -0.1, 100, 24)).toThrow();
        expect(() => estimateEnergyProduced(2, 0.2, -100, 24)).toThrow();
        expect(() => estimateEnergyProduced(2, 0.2, 100, 0)).toThrow();
        expect(() => estimateEnergyProduced(2, 0.2, 100, 24, 2)).toThrow();
    });
});
