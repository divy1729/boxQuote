import test from "node:test";
import assert from "node:assert/strict";
import { calculateQuote } from "./calculator.js";

const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 0.005, `${actual} !== ${expected}`);

test("brief case A", () => {
  const r = calculateQuote({ lengthMm: 300, widthMm: 200, heightMm: 150, gsm: 140, paperRate: 52, conversionRate: 4.5, wastagePercent: 2, marginPercent: 15, quantity: 1000 });
  assert.equal(r.sheetLengthMm, 1040); assert.equal(r.sheetWidthMm, 356); close(r.boardAreaSqm, .37024); close(r.weightKg, .0518336); close(r.costPerBox, 4.45); close(r.pricePerBox, 5.12); close(r.quoteTotal, 5115.95);
});
test("brief case B", () => {
  const r = calculateQuote({ lengthMm: 500, widthMm: 350, heightMm: 300, gsm: 180, paperRate: 58, conversionRate: 5.25, wastagePercent: 2, marginPercent: 12, quantity: 500 });
  assert.equal(r.sheetLengthMm, 1740); assert.equal(r.sheetWidthMm, 656); close(r.boardAreaSqm, 1.14144); close(r.weightKg, .2054592); close(r.costPerBox, 18.27); close(r.pricePerBox, 20.46); close(r.quoteTotal, 10229.73);
});
test("brief case C", () => {
  const r = calculateQuote({ lengthMm: 250, widthMm: 250, heightMm: 250, gsm: 120, paperRate: 48, conversionRate: 4, wastagePercent: 0, marginPercent: 0, quantity: 1 });
  assert.equal(r.sheetLengthMm, 1040); assert.equal(r.sheetWidthMm, 506); close(r.boardAreaSqm, .52624); close(r.weightKg, .0631488); close(r.costPerBox, 5.13703424); close(r.pricePerBox, 5.13703424); close(r.quoteTotal, 5.13703424);
});
