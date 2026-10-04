/**
 * Key business and financial formulas for Kadai Kanakku (Section 9).
 * All money amounts are calculated and returned in integer paise unless explicitly marked as percentage or unit count.
 */

import { addPaise, subPaise, multiplyPaise } from './money';

/**
 * 1. Cost of goods (Stock Method)
 * COGS = opening stock value + purchases value - closing stock value
 */
export function calculateCogsStockMethod(
  openingStockPaise: number,
  purchasesPaise: number,
  closingStockPaise: number
): number {
  const totalAvailable = addPaise(openingStockPaise, purchasesPaise);
  const cogs = subPaise(totalAvailable, closingStockPaise);
  return Math.max(0, cogs);
}

/**
 * 2. Cost of goods (Recipe Method)
 * COGS = Sum(sold qty * recipe cost per unit)
 */
export function calculateCogsRecipeMethod(
  items: Array<{ soldQty: number; recipeCostPerUnitPaise: number }>
): number {
  return items.reduce((total, item) => {
    return addPaise(total, multiplyPaise(item.recipeCostPerUnitPaise, item.soldQty));
  }, 0);
}

/**
 * 3. Gross profit
 * Gross Profit = Sales - Cost of Goods
 */
export function calculateGrossProfit(salesPaise: number, cogsPaise: number): number {
  return subPaise(salesPaise, cogsPaise);
}

/**
 * 4. Net profit
 * Net Profit = Gross Profit - Operating Expenses (including daily amortized fixed expenses)
 */
export function calculateNetProfit(grossProfitPaise: number, operatingExpensesPaise: number): number {
  return subPaise(grossProfitPaise, operatingExpensesPaise);
}

/**
 * 5. Gross margin %
 * Gross margin % = (Gross Profit / Sales) * 100
 * Returns float percentage (e.g. 42.5 for 42.5%). Returns 0 if sales is 0.
 */
export function calculateGrossMarginPercentage(grossProfitPaise: number, salesPaise: number): number {
  if (!salesPaise || salesPaise <= 0) return 0;
  return Number(((grossProfitPaise / salesPaise) * 100).toFixed(2));
}

/**
 * 6. Break-even daily sales
 * Break-even daily sales = daily fixed costs / (Gross margin %)
 * e.g., if daily fixed costs = ₹500 (50,000 paise) and gross margin = 50% (0.50), break-even = ₹1,000 (100,000 paise).
 */
export function calculateBreakEvenSales(dailyFixedCostsPaise: number, grossMarginPct: number): number {
  if (!grossMarginPct || grossMarginPct <= 0) return 0;
  const marginRatio = grossMarginPct / 100;
  return Math.round(dailyFixedCostsPaise / marginRatio);
}

/**
 * 7. Gas cost per day
 * Gas cost per day = Cylinder price / Days lasted
 */
export function calculateGasCostPerDay(cylinderPricePaise: number, daysLasted: number): number {
  if (!daysLasted || daysLasted <= 0) return 0;
  return Math.round(cylinderPricePaise / daysLasted);
}

/**
 * 8. Wastage percentage
 * Wastage % = ((produced - sold - reused) / produced) * 100
 */
export function calculateWastagePercentage(produced: number, sold: number, reused = 0): number {
  if (!produced || produced <= 0) return 0;
  const wasted = Math.max(0, produced - sold - reused);
  return Number(((wasted / produced) * 100).toFixed(2));
}

export type PriceRoundingStep = 50 | 100 | 500; // 50 paise (₹0.50), 100 paise (₹1), 500 paise (₹5)

/**
 * 9. Suggested selling price for a target margin
 * Suggested price = Unit cost / (1 - target margin %)
 * Rounded to friendly step (50 paise, 100 paise = ₹1, or 500 paise = ₹5)
 */
export function calculateSuggestedPrice(
  unitCostPaise: number,
  targetMarginPct: number,
  roundingStepPaise: PriceRoundingStep = 100
): number {
  if (targetMarginPct >= 100 || targetMarginPct < 0) return unitCostPaise;
  const marginRatio = targetMarginPct / 100;
  const rawPrice = unitCostPaise / (1 - marginRatio);

  // Round up to nearest friendly step
  const rounded = Math.ceil(rawPrice / roundingStepPaise) * roundingStepPaise;
  return Math.max(unitCostPaise, rounded);
}

/**
 * 10. Tomorrow's forecast
 * Weighted average of the last 4 same weekdays (weights 4, 3, 2, 1) * season factor
 * Weights:
 * - Most recent same weekday: 4
 * - 2 weeks ago same weekday: 3
 * - 3 weeks ago same weekday: 2
 * - 4 weeks ago same weekday: 1
 * Total weights = 10
 */
export function calculateForecast(
  historicalSalesQuantities: [number, number, number, number], // [mostRecent, 2wksAgo, 3wksAgo, 4wksAgo]
  seasonFactor = 1.0
): number {
  const [w1, w2, w3, w4] = historicalSalesQuantities;
  const weightedSum = (w1 * 4) + (w2 * 3) + (w3 * 2) + (w4 * 1);
  const weightedAvg = weightedSum / 10;
  return Math.round(weightedAvg * Math.max(0.1, seasonFactor));
}

/**
 * Spread monthly fixed expenses into daily amortized cost (assuming 30 days)
 */
export function amortizeMonthlyCostToDaily(monthlyPaise: number, daysInMonth = 30): number {
  if (!daysInMonth || daysInMonth <= 0) return 0;
  return Math.round(monthlyPaise / daysInMonth);
}
