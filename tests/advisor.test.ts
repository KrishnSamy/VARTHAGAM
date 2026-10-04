import { describe, it, expect } from 'vitest';
import {
  evaluateAdvisorRules,
  getTodaysHighlightedTip,
  ADVISOR_RULES,
  AdvisorContext,
  analyzeBusinessPerformance,
} from '../src/lib/advisor';

describe('Business Advisor Rule Engine (Section 5.9)', () => {
  const baseContext: AdvisorContext = {
    todaySalesPaise: 250000, // ₹2,500
    todayCogsPaise: 100000,  // ₹1,000
    todayGrossProfitPaise: 150000, // ₹1,500
    todayExpensesPaise: 40000, // ₹400
    todayNetProfitPaise: 110000, // ₹1,100
    todayWastagePaise: 5000,
    todayBillsCount: 45,
    cashSalesPaise: 100000,
    upiSalesPaise: 150000,
    unconfirmedUpiCount: 0,
    lowStockItems: [],
    gasCylindersAvgDays: 22,
    currentGasDays: 10,
    hasActiveGasAlert: false,
    topSellingItems: [
      { nameTa: 'டீ', nameEn: 'Tea', soldQty: 120, marginPct: 50 },
    ],
    slowSellingItems: [],
    wastagePercentage: 3.5,
    subscriptionDaysRemaining: 10,
    isSubscriptionExpired: false,
    currentMonth: 9, // October
    currentHour: 7, // 7 AM
  };

  it('contains at least 40 business rules with Tamil & English guidance', () => {
    expect(ADVISOR_RULES.length).toBeGreaterThanOrEqual(40);
  });

  it('triggers high-priority unconfirmed UPI alert when pending confirmations exist', () => {
    const ctx: AdvisorContext = {
      ...baseContext,
      unconfirmedUpiCount: 4,
    };
    const tips = evaluateAdvisorRules(ctx);
    const unconfirmedTip = tips.find(t => t.id === 'unconfirmed-upi');
    expect(unconfirmedTip).toBeDefined();
    expect(unconfirmedTip?.priority).toBe('high');
    expect(unconfirmedTip?.textTa).toContain('சவுண்ட்பாக்ஸில்');
  });

  it('triggers gas leak alert when cylinder finishes too fast', () => {
    const ctx: AdvisorContext = {
      ...baseContext,
      hasActiveGasAlert: true,
    };
    const tips = evaluateAdvisorRules(ctx);
    const gasTip = tips.find(t => t.id === 'gas-leak-check');
    expect(gasTip).toBeDefined();
    expect(gasTip?.priority).toBe('high');
    expect(gasTip?.textTa).toContain('பர்னர்');
  });

  it('triggers critical low stock alert with missing item names in Tamil and English', () => {
    const ctx: AdvisorContext = {
      ...baseContext,
      lowStockItems: [
        { nameTa: 'பால்', nameEn: 'Milk', current: 2, reorder: 5, unit: 'L' },
        { nameTa: 'சர்க்கரை', nameEn: 'Sugar', current: 1, reorder: 2, unit: 'kg' },
      ],
    };
    const tips = evaluateAdvisorRules(ctx);
    const stockTip = tips.find(t => t.id === 'critical-low-stock');
    expect(stockTip).toBeDefined();
    expect(stockTip?.priority).toBe('high');
    expect(stockTip?.textTa).toContain('பால்');
  });

  it('prioritizes high urgency alerts ahead of medium and low tips', () => {
    const ctx: AdvisorContext = {
      ...baseContext,
      subscriptionDaysRemaining: 1,
      unconfirmedUpiCount: 2,
    };
    const tips = evaluateAdvisorRules(ctx);
    expect(tips[0].priority).toBe('high');
  });

  it('suggests rainy season items (bajji & sukku coffee) in monsoon months', () => {
    const ctx: AdvisorContext = {
      ...baseContext,
      currentMonth: 10, // November (NE Monsoon)
    };
    const tips = evaluateAdvisorRules(ctx);
    const monsoonTip = tips.find(t => t.id === 'rainy-season-snack');
    expect(monsoonTip).toBeDefined();
    expect(monsoonTip?.textTa).toContain('பஜ்ஜி');
  });

  it('returns a highlighted Today Tip for display on the dashboard', () => {
    const tip = getTodaysHighlightedTip(baseContext);
    expect(tip).toBeDefined();
    expect(tip.titleTa).toBeTruthy();
    expect(tip.whyTa).toBeTruthy();
  });

  describe('analyzeBusinessPerformance', () => {
    it('accurately identifies highest and lowest sold items from order history', () => {
      const items = [
        { id: '1', nameTa: 'டீ', nameEn: 'Tea', pricePaise: 1200, category: 'tea', emoji: '☕', available: true, sortOrder: 1, createdAt: 1, updatedAt: 1 },
        { id: '2', nameTa: 'காபி', nameEn: 'Coffee', pricePaise: 1500, category: 'tea', emoji: '☕', available: true, sortOrder: 2, createdAt: 1, updatedAt: 1 },
        { id: '3', nameTa: 'வடை', nameEn: 'Vadai', pricePaise: 1000, category: 'snack', emoji: '🍩', available: true, sortOrder: 3, createdAt: 1, updatedAt: 1 },
      ];

      const orders = [
        {
          id: 'o1',
          tokenNumber: 'T-001',
          items: [
            { itemId: '1', nameTa: 'டீ', nameEn: 'Tea', pricePaise: 1200, qty: 50, totalPaise: 60000 },
            { itemId: '2', nameTa: 'காபி', nameEn: 'Coffee', pricePaise: 1500, qty: 10, totalPaise: 15000 },
          ],
          totalPaise: 75000,
          payMode: 'cash' as const,
          state: 'served' as const,
          source: 'counter' as const,
          createdAt: Date.now(),
          dateKey: '2026-10-01',
        },
        {
          id: 'o2',
          tokenNumber: 'T-002',
          items: [
            { itemId: '1', nameTa: 'டீ', nameEn: 'Tea', pricePaise: 1200, qty: 25, totalPaise: 30000 },
            { itemId: '3', nameTa: 'வடை', nameEn: 'Vadai', pricePaise: 1000, qty: 2, totalPaise: 2000 },
          ],
          totalPaise: 32000,
          payMode: 'upi' as const,
          state: 'confirmed' as const,
          source: 'counter' as const,
          createdAt: Date.now(),
          dateKey: '2026-10-02',
        },
      ];

      const analysis = analyzeBusinessPerformance(orders, [], items);
      expect(analysis.highestSoldItem.nameTa).toBe('டீ');
      expect(analysis.highestSoldItem.soldQty).toBe(75);
      expect(analysis.lowestSoldItem.nameTa).toBe('வடை');
      expect(analysis.lowestSoldItem.soldQty).toBe(2);
    });

    it('identifies highest and lowest sales days and most profitable vs loss days', () => {
      const orders = [
        {
          id: 'o1',
          tokenNumber: 'T-001',
          items: [],
          totalPaise: 500000, // ₹5,000
          payMode: 'cash' as const,
          state: 'served' as const,
          source: 'counter' as const,
          createdAt: 1,
          dateKey: '2026-10-01',
        },
        {
          id: 'o2',
          tokenNumber: 'T-002',
          items: [],
          totalPaise: 200000, // ₹2,000
          payMode: 'upi' as const,
          state: 'served' as const,
          source: 'counter' as const,
          createdAt: 2,
          dateKey: '2026-10-02',
        },
        {
          id: 'o3',
          tokenNumber: 'T-003',
          items: [],
          totalPaise: 800000, // ₹8,000 Peak sales
          payMode: 'cash' as const,
          state: 'served' as const,
          source: 'counter' as const,
          createdAt: 3,
          dateKey: '2026-10-03',
        },
        {
          id: 'o4',
          tokenNumber: 'T-004',
          items: [],
          totalPaise: 150000, // ₹1,500 Lowest sales
          payMode: 'cash' as const,
          state: 'served' as const,
          source: 'counter' as const,
          createdAt: 4,
          dateKey: '2026-10-04',
        },
      ];

      const expenses = [
        {
          id: 'e1',
          category: 'raw_materials' as const,
          amountPaise: 100000,
          isRecurring: false,
          isFixed: false,
          dateKey: '2026-10-01',
          createdAt: 1,
        },
        {
          id: 'e2',
          category: 'gas' as const,
          amountPaise: 350000, // Heavy expense (LPG) > Sales 150000 => LOSS DAY!
          isRecurring: false,
          isFixed: false,
          dateKey: '2026-10-04',
          createdAt: 4,
        },
      ];

      const analysis = analyzeBusinessPerformance(orders, expenses, []);
      expect(analysis.highestSalesDay.dateKey).toBe('2026-10-03');
      expect(analysis.highestSalesDay.revenuePaise).toBe(800000);

      expect(analysis.lowestSalesDay.dateKey).toBe('2026-10-04');
      expect(analysis.lowestSalesDay.revenuePaise).toBe(150000);

      // Profit / Loss check
      expect(analysis.mostProfitableDay.revenuePaise).toBeGreaterThan(0);
      expect(analysis.lossOrLowestProfitDay.dateKey).toBe('2026-10-04');
      expect(analysis.lossOrLowestProfitDay.profitPaise).toBeLessThan(0); // ₹1,500 - ₹3,500 = -₹2,000 (Loss)
    });
  });
});

