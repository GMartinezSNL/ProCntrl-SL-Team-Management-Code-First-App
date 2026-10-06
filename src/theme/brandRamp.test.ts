import { describe, expect, it } from 'vitest';
import { BRAND_KEYS, buildBrandRamp, flattenOnWhite, toHex } from './brandRamp';

describe('buildBrandRamp', () => {
  it('builds 16 shades with shade 80 equal to Main flattened onto white', () => {
    const main = flattenOnWhite({ red: 0, green: 51, blue: 160, alpha: 0.5 });
    const ramp = buildBrandRamp(main);

    expect(Object.keys(ramp)).toHaveLength(16);
    expect(BRAND_KEYS.every((key) => /^#[0-9a-f]{6}$/.test(ramp[key]))).toBe(true);
    expect(main).toEqual({ r: 128, g: 153, b: 208 });
    expect(ramp[80]).toBe(toHex(main));
  });

  it('gets darker toward 10 and lighter toward 160', () => {
    const ramp = buildBrandRamp(flattenOnWhite({ red: 0, green: 51, blue: 160, alpha: 1 }));
    const brightness = (hex: string) => Number.parseInt(hex.slice(1), 16);

    expect(brightness(ramp[10])).toBeLessThan(brightness(ramp[80]));
    expect(brightness(ramp[160])).toBeGreaterThan(brightness(ramp[80]));
  });
});
