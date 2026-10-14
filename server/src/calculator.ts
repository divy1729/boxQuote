export type QuoteInput = {
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  gsm: number;
  paperRate: number;
  conversionRate: number;
  wastagePercent: number;
  marginPercent: number;
  quantity: number;
};

export type Calculation = {
  sheetLengthMm: number;
  sheetWidthMm: number;
  boardAreaSqm: number;
  weightKg: number;
  materialCost: number;
  conversionCost: number;
  wastageCost: number;
  costPerBox: number;
  pricePerBox: number;
  quoteTotal: number;
};

// This intentionally does not round at intermediate steps. Formatting is a UI concern.
export function calculateQuote(input: QuoteInput): Calculation {
  const sheetLengthMm = 2 * (input.lengthMm + input.widthMm) + 40;
  const sheetWidthMm = input.widthMm + input.heightMm + 6;
  const boardAreaSqm = (sheetLengthMm * sheetWidthMm) / 1_000_000;
  const weightKg = (boardAreaSqm * input.gsm) / 1000;
  const materialCost = weightKg * input.paperRate;
  const conversionCost = boardAreaSqm * input.conversionRate;
  const wastageCost = (materialCost + conversionCost) * (input.wastagePercent / 100);
  const costPerBox = materialCost + conversionCost + wastageCost;
  const pricePerBox = costPerBox * (1 + input.marginPercent / 100);
  const quoteTotal = pricePerBox * input.quantity;
  return { sheetLengthMm, sheetWidthMm, boardAreaSqm, weightKg, materialCost, conversionCost, wastageCost, costPerBox, pricePerBox, quoteTotal };
}
