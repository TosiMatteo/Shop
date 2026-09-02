import fc from 'fast-check';
import { DiscountPercentagePipe } from './discount-percentage.pipe';

/**
 * Contratto OP-7 di docs/SPECIFICA.md.
 *
 * I primi test sono a esempio (casi notevoli e di confine); quelli marcati
 * "property" verificano le formule universalmente quantificate Q1, Q2 e Q3 su
 * input generati da fast-check, che in caso di fallimento riduce il
 * controesempio al caso minimo.
 */
describe('DiscountPercentagePipe', () => {
  const pipe = new DiscountPercentagePipe();

  // ─── Casi a esempio ────────────────────────────────────────────────────────
  it('computes the discount as a rounded percentage', () => {
    expect(pipe.transform(100, 75)).toBe(25);
    expect(pipe.transform(15, 12)).toBe(20);
  });

  it('returns 0 when the price is not lower than the original price', () => {
    expect(pipe.transform(100, 100)).toBe(0);
    expect(pipe.transform(100, 120)).toBe(0);
  });

  it('returns 0 for a non positive original price', () => {
    expect(pipe.transform(0, 50)).toBe(0);
    expect(pipe.transform(-10, 5)).toBe(0);
  });

  it('accepts prices arriving from the backend as strings', () => {
    expect(pipe.transform('100.00', '50.00')).toBe(50);
  });

  // ─── Q1: 0 ≤ f(o, p) ≤ 100 ────────────────────────────────────────────────
  it('property: always returns a percentage between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 100_000, noNaN: true }),
        fc.double({ min: 0, max: 100_000, noNaN: true }),
        (original, price) => {
          const result = pipe.transform(original, price);
          expect(result).toBeGreaterThanOrEqual(0);
          expect(result).toBeLessThanOrEqual(100);
          expect(Number.isInteger(result)).toBe(true);
        },
      ),
    );
  });

  // ─── Q2: p ≥ o ⟹ f(o, p) = 0 ──────────────────────────────────────────────
  it('property: never shows a discount when the price is not lower', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 100_000, noNaN: true }),
        fc.double({ min: 0, max: 100_000, noNaN: true }),
        (original, extra) => {
          expect(pipe.transform(original, original + extra)).toBe(0);
        },
      ),
    );
  });

  // ─── Q3: p₁ ≤ p₂ ⟹ f(o, p₁) ≥ f(o, p₂) ────────────────────────────────────
  it('property: the discount never grows when the price grows', () => {
    fc.assert(
      fc.property(
        fc.double({ min: 0.01, max: 100_000, noNaN: true }),
        fc.double({ min: 0, max: 100_000, noNaN: true }),
        fc.double({ min: 0, max: 100_000, noNaN: true }),
        (original, a, b) => {
          const [lower, higher] = a <= b ? [a, b] : [b, a];
          expect(pipe.transform(original, lower)).toBeGreaterThanOrEqual(
            pipe.transform(original, higher),
          );
        },
      ),
    );
  });
});
