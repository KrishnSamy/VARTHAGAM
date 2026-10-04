import { describe, it, expect } from 'vitest';
import {
  calculateCogsStockMethod,
  calculateCogsRecipeMethod,
  calculateGrossProfit,
  calculateNetProfit,
  calculateGrossMarginPercentage,
  calculateBreakEvenSales,
  calculateGasCostPerDay,
  calculateWastagePercentage,
  calculateSuggestedPrice,
  calculateForecast,
  amortizeMonthlyCostToDaily,
} from '../src/lib/formulas';

describe('Key Business & Financial Formulas (Section 9)', () => {
  it('1. COGS (Stock Method) = opening + purchases - closing', () => {
    // Opening: ₹2,000 (200000 paise), Purchases: ₹5,000 (500000 paise), Closing: ₹1,500 (150000 paise)
    // COGS = 2000 + 5000 - 1500 = ₹5,500 (550000 paise)
    const cogs = calculateCogsStockMethod(200000, 500000, 150000);
    expect(cogs).toBe(550000);
  });

  it('2. COGS (Recipe Method) = Sum(sold qty * recipe cost per unit)', () => {
    // 50 teas @ ₹6 cost (600 paise) = 30,000 paise
    // 30 vadais @ ₹4 cost (400 paise) = 12,000 paise
    // Total COGS = 42,000 paise (₹420)
    const items = [
      { soldQty: 50, recipeCostPerUnitPaise: 600 },
      { soldQty: 30, recipeCostPerUnitPaise: 400 },
    ];
    const cogs = calculateCogsRecipeMethod(items);
    expect(cogs).toBe(42000);
  });

  it('3. Gross profit = sales - COGS', () => {
    // Sales: ₹1,500 (150000 paise), COGS: ₹600 (60000 paise)
    // Gross Profit = 90,000 paise (₹900)
    expect(calculateGrossProfit(150000, 60000)).toBe(90000);
  });

  it('4. Net profit = Gross profit - operating expenses', () => {
    // Gross profit: ₹900 (90000 paise), Daily expenses (rent+EB): ₹350 (35000 paise)
    // Net profit = 55,000 paise (₹550)
    expect(calculateNetProfit(90000, 35000)).toBe(55000);

    // Net loss case
    expect(calculateNetProfit(30000, 45000)).toBe(-15000); // Loss of ₹150
  });

  it('5. Gross margin % = (Gross profit / Sales) * 100', () => {
    // Sales: ₹2,000 (200000 paise), Gross Profit: ₹1,000 (100000 paise) -> 50%
    expect(calculateGrossMarginPercentage(100000, 200000)).toBe(50);

    // Sales: ₹1,200 (120000 paise), Gross Profit: ₹450 (45000 paise) -> 37.5%
    expect(calculateGrossMarginPercentage(45000, 120000)).toBe(37.5);

    expect(calculateGrossMarginPercentage(0, 0)).toBe(0);
  });

  it('6. Break-even daily sales = daily fixed costs / gross margin %', () => {
    // Daily fixed costs: ₹600 (60000 paise), Gross Margin: 50%
    // Break-even sales = 60,000 / 0.50 = 120,000 paise (₹1,200)
    expect(calculateBreakEvenSales(60000, 50)).toBe(120000);
  });

  it('7. Gas cost per day = cylinder price / days lasted', () => {
    // 19kg cylinder: ₹3,237 (323700 paise), lasted 21 days
    // Cost per day = 323700 / 21 = 15,414 paise (~₹154.14/day)
    expect(calculateGasCostPerDay(323700, 21)).toBe(15414);
  });

  it('8. Wastage % = ((produced - sold - reused) / produced) * 100', () => {
    // Produced 100 vadais, sold 85, reused 0 -> 15% wastage
    expect(calculateWastagePercentage(100, 85, 0)).toBe(15);

    // Produced 50, sold 40, reused 5 -> (50 - 45) / 50 = 10%
    expect(calculateWastagePercentage(50, 40, 5)).toBe(10);
  });

  it('9. Suggested price = unit cost / (1 - target margin %) rounded to friendly step', () => {
    // Unit cost: ₹6 (600 paise), Target margin: 50%
    // Raw price: 600 / 0.50 = 1200 paise (₹12)
    expect(calculateSuggestedPrice(600, 50, 100)).toBe(1200);

    // Unit cost: ₹6.40 (640 paise), Target margin: 40%
    // Raw price: 640 / 0.60 = 1066.67 paise
    // Rounded to 100 paise (₹1 step) -> 1100 paise (₹11)
    expect(calculateSuggestedPrice(640, 40, 100)).toBe(1100);

    // Rounded to 500 paise (₹5 step) -> 1500 paise (₹15)
    expect(calculateSuggestedPrice(640, 40, 500)).toBe(1500);

    // Rounded to 50 paise (₹0.50 step) -> 1100 paise
    expect(calculateSuggestedPrice(640, 40, 50)).toBe(1100);
  });

  it('10. Forecast = weighted average of last 4 same weekdays (weights 4,3,2,1) * season factor', () => {
    // Sales of tea in litres for last 4 Mondays: [25, 22, 20, 18]
    // Weighted: (25*4 + 22*3 + 20*2 + 18*1) / 10 = (100 + 66 + 40 + 18) / 10 = 224 / 10 = 22.4 -> 22
    expect(calculateForecast([25, 22, 20, 18], 1.0)).toBe(22);

    // With rainy season factor 1.25 -> 22.4 * 1.25 = 28
    expect(calculateForecast([25, 22, 20, 18], 1.25)).toBe(28);
  });

  it('Amortizes monthly fixed expenses (rent, salary) to daily cost', () => {
    // Monthly shop rent ₹9,000 (900000 paise) / 30 days = 30,000 paise (₹300/day)
    expect(amortizeMonthlyCostToDaily(900000, 30)).toBe(30000);
  });
});
