import React, { useState } from 'react';
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  Crown,
  AlertOctagon,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Calculator,
  Calendar,
  DollarSign,
  Coffee,
  ShoppingBag,
  BarChart3,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import {
  evaluateAdvisorRules,
  getTodaysHighlightedTip,
  analyzeBusinessPerformance,
  AdvisorTip,
  AdvisorContext,
} from '../../lib/advisor';
import { formatPaise, paiseToRupees } from '../../lib/money';
import { calculateSuggestedPrice, calculateBreakEvenSales } from '../../lib/formulas';

export const AdvisorView: React.FC = () => {
  const { language, t, items, rawMaterials, orders, expenses, subscription } = useShop();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedWhyTip, setSelectedWhyTip] = useState<AdvisorTip | null>(null);

  // Price-change impact simulation tool state
  const [milkPriceHikeRupees, setMilkPriceHikeRupees] = useState('4'); // e.g. +₹4 / L
  const [targetMarginPct, setTargetMarginPct] = useState('50');

  // Compute business performance analytics (Items higher/lower, Days higher/lower, Profit/Loss)
  const analytics = analyzeBusinessPerformance(orders, expenses, items);

  // Build context for 40+ rules engine
  const todayStr = new Date().toISOString().split('T')[0];
  const todaysOrders = orders.filter(o => o.dateKey === todayStr);
  const todaysSales = todaysOrders.reduce((s, o) => s + o.totalPaise, 0);
  const unconfirmedCount = todaysOrders.filter(o => o.state === 'pending' && o.payMode === 'upi').length;
  const cashSales = todaysOrders.filter(o => o.payMode === 'cash').reduce((s, o) => s + o.totalPaise, 0);
  const upiSales = todaysOrders.filter(o => o.payMode === 'upi').reduce((s, o) => s + o.totalPaise, 0);

  const lowStock = rawMaterials
    .filter(m => m.currentStock <= m.reorderLevel)
    .map(m => ({ nameTa: m.nameTa, nameEn: m.nameEn, current: m.currentStock, reorder: m.reorderLevel, unit: m.unit }));

  const ctx: AdvisorContext = {
    todaySalesPaise: todaysSales || 250000,
    todayCogsPaise: Math.round((todaysSales || 250000) * 0.4),
    todayGrossProfitPaise: Math.round((todaysSales || 250000) * 0.6),
    todayExpensesPaise: 40000,
    todayNetProfitPaise: Math.round((todaysSales || 250000) * 0.6) - 40000,
    todayWastagePaise: 0,
    todayBillsCount: todaysOrders.length || 35,
    cashSalesPaise: cashSales || 100000,
    upiSalesPaise: upiSales || 150000,
    unconfirmedUpiCount: unconfirmedCount,
    lowStockItems: lowStock,
    gasCylindersAvgDays: 21,
    currentGasDays: 14,
    hasActiveGasAlert: false,
    topSellingItems: items.slice(0, 3).map(i => ({ nameTa: i.nameTa, nameEn: i.nameEn, soldQty: 25, marginPct: 45 })),
    slowSellingItems: items.slice(-2).map(i => ({ nameTa: i.nameTa, nameEn: i.nameEn, soldQty: 2 })),
    wastagePercentage: 4,
    subscriptionDaysRemaining: subscription?.daysRemaining || 14,
    isSubscriptionExpired: subscription?.isReadOnly || false,
    currentMonth: new Date().getMonth(),
    currentHour: new Date().getHours(),
  };

  const allTips = evaluateAdvisorRules(ctx);
  const todaysHeroTip = getTodaysHighlightedTip(ctx);

  const filteredTips = allTips.filter(
    tip => activeCategory === 'all' || tip.category === activeCategory
  );

  // Price-change impact calculation
  const milkHikeRupees = parseFloat(milkPriceHikeRupees) || 0;
  const costIncreasePerCupPaise = Math.round((milkHikeRupees * 100) / 25); // paise per cup (40ml milk/cup)
  const currentTea = items.find(i => i.nameTa.includes('டீ') || i.nameEn.toLowerCase().includes('tea')) || items[0];
  const currentTeaPricePaise = currentTea?.pricePaise || 1200;
  const baselineCostPerCupPaise = 550; // base ~₹5.50
  const newCostPerCupPaise = baselineCostPerCupPaise + costIncreasePerCupPaise;
  const targetMargin = parseFloat(targetMarginPct) || 50;
  const suggestedSellingPricePaise = calculateSuggestedPrice(newCostPerCupPaise, targetMargin, 100);

  // Break-even daily revenue
  const dailyFixedCostsPaise = 50000; // estimated ₹500/day
  const breakEvenRevenuePaise = calculateBreakEvenSales(dailyFixedCostsPaise, targetMargin);
  const cupsNeededForBreakEven = Math.ceil(breakEvenRevenuePaise / (currentTeaPricePaise || 1200));

  return (
    <div className="pb-36 max-w-5xl mx-auto px-2 sm:px-4 animate-in fade-in">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-brand-950 via-brand-900 to-slate-950 text-white p-5 rounded-3xl shadow-crimson-md border border-amber-500/30 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>{language === 'ta' ? 'வர்த்தகம் வணிக ஆலோசகர்' : 'VARTHAGAM Business Advisor'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-amber-100 font-tamil-varthagam leading-tight">
            {language === 'ta'
              ? 'விற்பனை & லாப நஷ்ட நுண்ணறிவு பகுப்பாய்வு'
              : 'Sales, Profit & Loss Intelligence'}
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {language === 'ta'
              ? 'உங்கள் கடையின் சிறந்த விற்பனை, மந்தமான பொருட்கள், அதிக லாபம் மற்றும் நஷ்ட நாட்களின் நேரடி அறிக்கை.'
              : 'Automated analytics on top/low sellers, peak/slow days, and high-profit vs loss days.'}
          </p>
        </div>

        <div className="px-3.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-[11px] text-amber-300 font-bold flex items-center gap-1.5 self-stretch sm:self-auto justify-center">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>7-நாள் பகுப்பாய்வு (7-Day Cycle)</span>
        </div>
      </div>

      {/* SECTION 1: ITEMS SALES ANALYSIS (HIGHER vs LOWER) */}
      <div className="mb-6">
        <h3 className="font-tamil-varthagam font-black text-base sm:text-lg text-slate-900 mb-3 flex items-center gap-2">
          <Coffee className="w-5 h-5 text-brand-800" />
          <span>{language === 'ta' ? '1. பொருட்கள் விற்பனை பகுப்பாய்வு' : '1. Item Sales Performance'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Highest Sold Item Card */}
          <div className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white rounded-3xl p-5 border-2 border-emerald-500/40 shadow-xl relative overflow-hidden">
            <div className="absolute top-3 right-3 p-2 bg-emerald-500/20 rounded-2xl text-emerald-300 border border-emerald-500/40">
              <Crown className="w-5 h-5 text-amber-400" />
            </div>

            <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'அதிகம் விற்பனையான பொருள் (Top Seller)' : 'Highest Sold Item'}</span>
            </div>

            <div className="flex items-center gap-3 my-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl">
                {analytics.highestSoldItem.emoji}
              </div>
              <div>
                <h4 className="text-xl font-black text-white font-tamil-varthagam">
                  {analytics.highestSoldItem.nameTa}
                </h4>
                <p className="text-xs text-slate-400">{analytics.highestSoldItem.nameEn}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">{language === 'ta' ? 'விற்பனையான எண்ணிக்கை' : 'Qty Sold'}</span>
                <span className="text-lg font-black text-emerald-300 font-mono">
                  {analytics.highestSoldItem.soldQty} {language === 'ta' ? 'எண்ணிக்கை' : 'nos'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">{language === 'ta' ? 'மொத்த வருவாய்' : 'Total Revenue'}</span>
                <span className="text-lg font-black text-gold-gradient font-display">
                  {formatPaise(analytics.highestSoldItem.revenuePaise)}
                </span>
              </div>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-500/30 p-2.5 rounded-xl text-xs text-emerald-200">
              <p className="font-bold mb-0.5">💡 ஆலோசகர் வழிகாட்டுதல் (Advisor Tip):</p>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {language === 'ta'
                  ? 'இந்த பொருள் தான் உங்கள் கடையின் பிரதான வருவாய் தூண்! காலை 7-9 மற்றும் மாலை 5-7 மணி வரை இதன் மூலப்பொருட்கள் (பால்/மாவு) தட்டுப்பாடின்றி இருப்பதை உறுதி செய்யவும்.'
                  : 'This item drives your primary revenue! Ensure raw materials (milk/batter) never run out during morning and evening rush.'}
              </p>
            </div>
          </div>

          {/* Lowest Sold Item Card */}
          <div className="bg-gradient-to-br from-rose-950 via-slate-900 to-slate-950 text-white rounded-3xl p-5 border-2 border-rose-500/40 shadow-xl relative overflow-hidden">
            <div className="absolute top-3 right-3 p-2 bg-rose-500/20 rounded-2xl text-rose-300 border border-rose-500/40">
              <TrendingDown className="w-5 h-5 text-rose-400" />
            </div>

            <div className="text-[11px] font-bold text-rose-400 uppercase tracking-widest mb-1 flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'குறைவாக விற்பனையான பொருள் (Slow Mover)' : 'Lowest Sold Item'}</span>
            </div>

            <div className="flex items-center gap-3 my-2">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-3xl">
                {analytics.lowestSoldItem.emoji}
              </div>
              <div>
                <h4 className="text-xl font-black text-white font-tamil-varthagam">
                  {analytics.lowestSoldItem.nameTa}
                </h4>
                <p className="text-xs text-slate-400">{analytics.lowestSoldItem.nameEn}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 my-3 p-3 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">{language === 'ta' ? 'விற்பனையான எண்ணிக்கை' : 'Qty Sold'}</span>
                <span className="text-lg font-black text-rose-300 font-mono">
                  {analytics.lowestSoldItem.soldQty} {language === 'ta' ? 'எண்ணிக்கை' : 'nos'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">{language === 'ta' ? 'மொத்த வருவாய்' : 'Total Revenue'}</span>
                <span className="text-lg font-black text-slate-200 font-display">
                  {formatPaise(analytics.lowestSoldItem.revenuePaise)}
                </span>
              </div>
            </div>

            <div className="bg-rose-950/40 border border-rose-500/30 p-2.5 rounded-xl text-xs text-rose-200">
              <p className="font-bold mb-0.5">⚠️ ஆலோசகர் தீர்வு (Action Plan):</p>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                {language === 'ta'
                  ? 'இதன் தயாரிப்பை குறைத்து வீணாவதை தடுக்கவும். அல்லது அதிகம் விற்கும் டீயுடன் காம்போ (டீ + சமோசா ₹20) சலுகை அறிவித்து வேகமாக விற்றுத் தீர்க்கலாம்.'
                  : 'Reduce preparation quantity to avoid food spoilage. Bundle with hot tea as a combo offer to accelerate clearance.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: DAYS SALES ANALYSIS (PEAK vs SLOW DAY) */}
      <div className="mb-6">
        <h3 className="font-tamil-varthagam font-black text-base sm:text-lg text-slate-900 mb-3 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-800" />
          <span>{language === 'ta' ? '2. நாட்கள் வாரியான விற்பனை பகுப்பாய்வு' : '2. Day-by-Day Sales Comparison'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Highest Sales Day */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div>
                <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 uppercase">
                  {language === 'ta' ? 'அதிக விற்பனை நடந்த நாள்' : 'Highest Sales Day'}
                </span>
                <h4 className="text-xl font-black text-slate-900 mt-1">
                  {analytics.highestSalesDay.dayNameTa} ({analytics.highestSalesDay.displayDate})
                </h4>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-brand-900 font-display">
                  {formatPaise(analytics.highestSalesDay.revenuePaise)}
                </span>
                <span className="text-[10px] text-slate-400 block font-bold">
                  {analytics.highestSalesDay.ordersCount} {language === 'ta' ? 'ஆர்டர்கள்' : 'bills'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'ta'
                ? `இந்த நாளில் வாடிக்கையாளர் கூட்டம் அதிகம் (${formatPaise(analytics.highestSalesDay.revenuePaise)}). வார இறுதி கூட்டம் என்பதால் கூடுதல் பணியாளர் மற்றும் முன் தயாரிப்பு அவசியம்.`
                : `Peak customer footfall (${formatPaise(analytics.highestSalesDay.revenuePaise)}). Keep backup milk/gas pre-staged for this day.`}
            </p>
          </div>

          {/* Lowest Sales Day */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div>
                <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200 uppercase">
                  {language === 'ta' ? 'குறைவான விற்பனை நடந்த நாள்' : 'Lowest Sales Day'}
                </span>
                <h4 className="text-xl font-black text-slate-800 mt-1">
                  {analytics.lowestSalesDay.dayNameTa} ({analytics.lowestSalesDay.displayDate})
                </h4>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-slate-700 font-display">
                  {formatPaise(analytics.lowestSalesDay.revenuePaise)}
                </span>
                <span className="text-[10px] text-slate-400 block font-bold">
                  {analytics.lowestSalesDay.ordersCount} {language === 'ta' ? 'ஆர்டர்கள்' : 'bills'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {language === 'ta'
                ? `மந்தமான விற்பனை நாள் (${formatPaise(analytics.lowestSalesDay.revenuePaise)}). அன்றைய தினம் பால் மற்றும் மாவு அளவை 20% குறைத்து வாங்குவதன் மூலம் தேக்கத்தை தவிர்க்கலாம்.`
                : `Slowest business day (${formatPaise(analytics.lowestSalesDay.revenuePaise)}). Scale down perishable raw materials by 20% to avoid waste.`}
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 3: PROFIT vs LOSS ANALYSIS BY DAY */}
      <div className="mb-6">
        <h3 className="font-tamil-varthagam font-black text-base sm:text-lg text-slate-900 mb-3 flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-brand-800" />
          <span>{language === 'ta' ? '3. அதிக லாபம் vs நஷ்டம் உள்ள நாள்' : '3. Most Profitable Day vs Loss Day'}</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Most Profitable Day */}
          <div className="bg-emerald-50 border-2 border-emerald-400/80 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                💰 {language === 'ta' ? 'அதிக லாபம் ஈட்டிய நாள்' : 'Most Profitable Day'}
              </span>
              <span className="text-xs font-bold text-emerald-700">
                {analytics.mostProfitableDay.dayNameTa} ({analytics.mostProfitableDay.displayDate})
              </span>
            </div>

            <div className="my-2">
              <div className="text-xs text-slate-500">{language === 'ta' ? 'நிகர லாபம் (Net Profit):' : 'Net Profit:'}</div>
              <div className="text-3xl font-black text-emerald-700 font-display">
                +{formatPaise(analytics.mostProfitableDay.profitPaise)}
              </div>
            </div>

            <div className="text-[11px] text-slate-600 bg-white p-3 rounded-2xl border border-emerald-200 mt-3 space-y-1">
              <div className="flex justify-between">
                <span>{language === 'ta' ? 'விற்பனை வருவாய்:' : 'Revenue:'}</span>
                <span className="font-bold text-slate-800">{formatPaise(analytics.mostProfitableDay.revenuePaise)}</span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'ta' ? 'அன்றைய செலவுகள்:' : 'Expenses:'}</span>
                <span className="font-bold text-slate-800">-{formatPaise(analytics.mostProfitableDay.expensesPaise)}</span>
              </div>
              <div className="pt-1 border-t border-slate-100 text-emerald-800 font-bold">
                {language === 'ta'
                  ? 'காரணம்: குறைந்த கழிவு மற்றும் அதிக மார்ஜின் பொருட்கள் விற்பனை.'
                  : 'Key Driver: Low wastage and optimal high-margin product mix.'}
              </div>
            </div>
          </div>

          {/* Loss / Lowest Profit Day */}
          <div className="bg-rose-50 border-2 border-rose-400/80 rounded-3xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black text-rose-800 bg-rose-100 px-3 py-1 rounded-full border border-rose-300">
                ⚠️ {language === 'ta' ? 'நஷ்டம் / மிகை செலவு நாள்' : 'Loss / High Cost Day'}
              </span>
              <span className="text-xs font-bold text-rose-700">
                {analytics.lossOrLowestProfitDay.dayNameTa} ({analytics.lossOrLowestProfitDay.displayDate})
              </span>
            </div>

            <div className="my-2">
              <div className="text-xs text-slate-500">{language === 'ta' ? 'நிகர லாபம் / நஷ்டம்:' : 'Net Profit / Loss:'}</div>
              <div className={`text-3xl font-black font-display ${analytics.lossOrLowestProfitDay.profitPaise < 0 ? 'text-rose-700' : 'text-amber-800'}`}>
                {analytics.lossOrLowestProfitDay.profitPaise < 0 ? '-' : '+'}
                {formatPaise(Math.abs(analytics.lossOrLowestProfitDay.profitPaise))}
              </div>
            </div>

            <div className="text-[11px] text-slate-600 bg-white p-3 rounded-2xl border border-rose-200 mt-3 space-y-1">
              <div className="flex justify-between">
                <span>{language === 'ta' ? 'விற்பனை வருவாய்:' : 'Revenue:'}</span>
                <span className="font-bold text-slate-800">{formatPaise(analytics.lossOrLowestProfitDay.revenuePaise)}</span>
              </div>
              <div className="flex justify-between">
                <span>{language === 'ta' ? 'அன்றைய செலவுகள்:' : 'Expenses:'}</span>
                <span className="font-bold text-rose-700">-{formatPaise(analytics.lossOrLowestProfitDay.expensesPaise)}</span>
              </div>
              <div className="pt-1 border-t border-slate-100 text-rose-800 font-bold">
                {language === 'ta'
                  ? 'காரணம்: இந்த நாளில் கமர்ஷியல் LPG சிலிண்டர் (ரூ.993 உயர்வு) அல்லது மொத்த மளிகை வாங்கியதால் செலவு அதிகமாகி நஷ்டம் காட்டியுள்ளது. இந்த செலவை மாதத்தின் 25 நாட்களுக்கு பிரித்து கணக்கிடவும்.'
                  : 'Cause: Bulk purchase or LPG refill caused single-day spike. Spread cylinder cost across 25 working days (~₹120/day).'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: 7-DAY COMPLETE PERFORMANCE BREAKDOWN TABLE */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-6">
        <h3 className="font-tamil-varthagam font-black text-sm sm:text-base text-slate-900 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-800" />
            <span>{language === 'ta' ? '7-நாள் தினசரி கணக்கு அறிக்கை' : '7-Day Financial Breakdown'}</span>
          </span>
          <span className="text-xs text-slate-400 font-normal">
            {language === 'ta' ? 'விற்பனை vs செலவு vs நிகர லாபம்' : 'Revenue vs Expense vs Net'}
          </span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 font-bold">
                <th className="py-2.5 px-3">{language === 'ta' ? 'நாள் / தேதி' : 'Day / Date'}</th>
                <th className="py-2.5 px-3 text-right">{language === 'ta' ? 'விற்பனை' : 'Revenue'}</th>
                <th className="py-2.5 px-3 text-right">{language === 'ta' ? 'செலவு' : 'Expenses'}</th>
                <th className="py-2.5 px-3 text-right">{language === 'ta' ? 'நிகர லாபம் / நஷ்டம்' : 'Net P&L'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.dailyPerformance.map(day => (
                <tr key={day.dateKey} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 font-bold text-slate-800">
                    {day.dayNameTa} <span className="text-[11px] text-slate-400 font-mono">({day.displayDate})</span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {formatPaise(day.revenuePaise)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                    {formatPaise(day.expensesPaise)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-mono font-black text-xs ${
                        day.isProfit
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {day.profitPaise >= 0 ? '+' : '-'}
                      {formatPaise(Math.abs(day.profitPaise))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 5: HERO HIGHLIGHTED TIP */}
      {todaysHeroTip && (
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl mb-6">
          <div className="flex items-center gap-2 text-amber-100 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-4 h-4" />
            <span>{t.todaysTip}</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black mb-2 leading-snug">
            {language === 'ta' ? todaysHeroTip.titleTa : todaysHeroTip.titleEn}
          </h3>

          <p className="text-sm opacity-95 leading-relaxed mb-4">
            {language === 'ta' ? todaysHeroTip.textTa : todaysHeroTip.textEn}
          </p>

          <button
            onClick={() => setSelectedWhyTip(todaysHeroTip)}
            className="text-xs bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center gap-1.5 touch-target"
          >
            <HelpCircle className="w-4 h-4" />
            <span>{language === 'ta' ? 'இந்த யோசனை ஏன்?' : 'Why am I seeing this?'}</span>
          </button>
        </div>
      )}

      {/* SECTION 6: PRICE-CHANGE IMPACT SIMULATOR TOOL */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center gap-2 text-brand-700 mb-1">
          <Calculator className="w-6 h-6" />
          <h3 className="font-extrabold text-lg text-slate-800">
            {language === 'ta' ? 'விலை உயர்வு தாக்கக் கருவி' : 'Price-Change Impact Tool'}
          </h3>
        </div>
        <p className="text-xs text-slate-500 mb-4">
          {language === 'ta'
            ? 'பால் விலை அல்லது கேஸ் விலை கூடும் போது, டீ விலையை எவ்வளவு மாற்ற வேண்டும் என்று முன் கூட்டியே தெரிந்து கொள்ளுங்கள்.'
            : 'Simulate milk or LPG price hikes to find the ideal selling price and protect your profit margin.'}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {language === 'ta' ? 'பால் விலை உயர்வு (ரூ./லிட்டர்)' : 'Milk Hike (₹/Litre)'}
            </label>
            <input
              type="number"
              step="any"
              value={milkPriceHikeRupees}
              onChange={e => setMilkPriceHikeRupees(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold text-base"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              {language === 'ta' ? 'இலக்கு லாப விகிதம் (%)' : 'Target Margin (%)'}
            </label>
            <input
              type="number"
              value={targetMarginPct}
              onChange={e => setTargetMarginPct(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 font-bold text-base"
            />
          </div>
        </div>

        {/* Impact Output Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
            <div className="bg-white p-3 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400 font-semibold">
                {language === 'ta' ? 'ஒரு டீக்கு கூடுதல் செலவு' : 'Extra Cost / Cup'}
              </span>
              <div className="text-lg font-black text-rose-600 mt-1">
                +{formatPaise(costIncreasePerCupPaise)}
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-400 font-semibold">
                {language === 'ta' ? 'புதிய அடக்கவிலை' : 'New Unit Cost'}
              </span>
              <div className="text-lg font-black text-slate-800 mt-1">
                {formatPaise(newCostPerCupPaise)}
              </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-amber-300 bg-amber-50/50 col-span-2 sm:col-span-1">
              <span className="text-[11px] text-amber-800 font-bold">
                {language === 'ta' ? 'பரிந்துரைக்கப்படும் விலை' : 'Suggested Price'}
              </span>
              <div className="text-xl font-black text-brand-900 mt-1">
                {formatPaise(suggestedSellingPricePaise)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* WHY AM I SEEING THIS MODAL */}
      {selectedWhyTip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-amber-300">
            <div className="flex items-center gap-2 text-brand-800 mb-2">
              <HelpCircle className="w-6 h-6 text-amber-500" />
              <h3 className="font-tamil-varthagam font-black text-lg text-slate-900">
                {language === 'ta' ? 'இந்த யோசனை ஏன்?' : 'Why am I seeing this?'}
              </h3>
            </div>

            <p className="text-sm font-bold text-slate-800 mb-3">
              {language === 'ta' ? selectedWhyTip.titleTa : selectedWhyTip.titleEn}
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-950 mb-5 leading-relaxed">
              {language === 'ta' ? selectedWhyTip.whyTa : selectedWhyTip.whyEn}
            </div>

            <button
              onClick={() => setSelectedWhyTip(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-2xl text-xs touch-target transition"
            >
              {language === 'ta' ? 'புரிந்தது (Close)' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
