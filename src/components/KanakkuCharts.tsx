import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  Flame,
  Award,
  AlertTriangle,
  Banknote,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import { formatPaise, paiseToRupees } from '../lib/money';

export interface DailyTrendPoint {
  dateLabel: string;
  salesPaise: number;
  profitPaise: number;
}

interface Props {
  salesPaise: number;
  cashPaise: number;
  upiPaise: number;
  cogsPaise: number;
  expensesPaise: number;
  grossProfitPaise: number;
  netProfitPaise: number;
  marginPct: number;
  categoryExpenses: Record<string, number>;
  trendData?: DailyTrendPoint[];
  language: 'ta' | 'en';
}

export const KanakkuCharts: React.FC<Props> = ({
  salesPaise,
  cashPaise,
  upiPaise,
  cogsPaise,
  expensesPaise,
  grossProfitPaise,
  netProfitPaise,
  marginPct,
  categoryExpenses,
  trendData,
  language,
}) => {
  // Cash vs UPI Percentages
  const cashPct = salesPaise > 0 ? Math.round((cashPaise / salesPaise) * 100) : 50;
  const upiPct = salesPaise > 0 ? 100 - cashPct : 50;

  // Expense distribution entries
  const expenseEntries = Object.entries(categoryExpenses);
  const totalExp = expensesPaise || 1;

  // Category labels with friendly emojis
  const getCatMeta = (cat: string) => {
    switch (cat) {
      case 'raw_materials':
        return { labelTa: 'பொருட்கள் / பால் / டீத்தூள்', labelEn: 'Raw Materials', icon: '🥛', color: 'bg-amber-500' };
      case 'gas':
        return { labelTa: 'எரிவாயு / கேஸ் சிலிண்டர்', labelEn: 'Gas Cylinder', icon: '🔥', color: 'bg-rose-500' };
      case 'electricity':
        return { labelTa: 'மின்சாரக் கட்டணம்', labelEn: 'Electricity', icon: '💡', color: 'bg-yellow-500' };
      case 'rent':
        return { labelTa: 'கடை வாடகை', labelEn: 'Shop Rent', icon: '🏠', color: 'bg-blue-500' };
      case 'labor_daily':
      case 'labor_monthly':
        return { labelTa: 'வேலையாட்கள் சம்பளம்', labelEn: 'Staff Salary', icon: '👥', color: 'bg-emerald-500' };
      default:
        return { labelTa: 'இதர செலவுகள்', labelEn: 'Miscellaneous', icon: '📦', color: 'bg-purple-500' };
    }
  };

  // Mock trend data if none provided (e.g. for past 7 days)
  const defaultTrend: DailyTrendPoint[] = trendData && trendData.length > 0 ? trendData : [
    { dateLabel: 'திங்கள் (Mon)', salesPaise: Math.round(salesPaise * 0.7), profitPaise: Math.round(netProfitPaise * 0.65) },
    { dateLabel: 'செவ்வாய் (Tue)', salesPaise: Math.round(salesPaise * 0.85), profitPaise: Math.round(netProfitPaise * 0.8) },
    { dateLabel: 'புதன் (Wed)', salesPaise: Math.round(salesPaise * 0.9), profitPaise: Math.round(netProfitPaise * 0.85) },
    { dateLabel: 'வியாழன் (Thu)', salesPaise: Math.round(salesPaise * 0.95), profitPaise: Math.round(netProfitPaise * 0.9) },
    { dateLabel: 'வெள்ளி (Fri)', salesPaise: Math.round(salesPaise * 1.1), profitPaise: Math.round(netProfitPaise * 1.15) },
    { dateLabel: 'சனி (Sat)', salesPaise: Math.round(salesPaise * 1.3), profitPaise: Math.round(netProfitPaise * 1.35) },
    { dateLabel: 'ஞாயிறு (Sun)', salesPaise: Math.round(salesPaise * 1.4), profitPaise: Math.round(netProfitPaise * 1.45) },
  ];

  const maxSales = Math.max(...defaultTrend.map(d => Math.max(d.salesPaise, 1)), 1);

  return (
    <div className="space-y-6 my-6">
      {/* 1. Interactive Bar Chart: Sales vs Profit Trend */}
      <div className="bg-gradient-to-br from-slate-900 via-rose-950/80 to-slate-950 border border-amber-500/30 rounded-3xl p-5 shadow-crimson-md text-white">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
              <TrendingUp className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-tamil-varthagam font-black text-base sm:text-lg text-white">
                {language === 'ta'
                  ? 'விற்பனை & லாப வரைபடம் (Sales vs Profit Chart)'
                  : 'Sales & Profit Analysis Chart'}
              </h3>
              <p className="text-[11px] text-slate-300">
                {language === 'ta'
                  ? 'தங்க நிறம்: மொத்த விற்பனை | பச்சை/சிவப்பு நிறம்: நிகர லாபம்'
                  : 'Gold: Revenue | Green/Red: Net Profit'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-amber-400">
              <span className="w-3 h-3 rounded-full bg-gradient-to-r from-amber-400 to-amber-600 inline-block" />
              {language === 'ta' ? 'விற்பனை' : 'Sales'}
            </span>
            <span className="flex items-center gap-1.5 font-bold text-emerald-400">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              {language === 'ta' ? 'லாபம்' : 'Profit'}
            </span>
          </div>
        </div>

        {/* SVG/CSS Bar Chart Grid */}
        <div className="h-48 sm:h-56 flex items-end justify-between gap-2 pt-6 pb-2 px-1">
          {defaultTrend.map((point, idx) => {
            const salesHeightPct = Math.min(Math.round((point.salesPaise / maxSales) * 100), 100);
            const profitHeightPct = Math.min(
              Math.max(Math.round((point.profitPaise / maxSales) * 100), 4),
              100
            );
            const isPointLoss = point.profitPaise < 0;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center h-full justify-end group relative"
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-slate-900 border border-amber-400 text-white text-[10px] rounded-xl px-2 py-1 shadow-lg whitespace-nowrap z-20">
                  <div className="font-bold text-amber-300">
                    {formatPaise(point.salesPaise)}
                  </div>
                  <div className={isPointLoss ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {isPointLoss ? 'நஷ்டம்: ' : 'லாபம்: '}
                    {formatPaise(point.profitPaise)}
                  </div>
                </div>

                {/* Bars side by side */}
                <div className="w-full flex items-end justify-center gap-1 h-full pb-1">
                  {/* Sales Bar */}
                  <div
                    style={{ height: `${salesHeightPct}%` }}
                    className="w-1/2 max-w-[18px] bg-gradient-to-t from-amber-600 via-amber-400 to-yellow-200 rounded-t-lg transition-all duration-500 shadow-gold-sm"
                  />
                  {/* Profit Bar */}
                  <div
                    style={{ height: `${Math.abs(profitHeightPct)}%` }}
                    className={`w-1/2 max-w-[18px] rounded-t-lg transition-all duration-500 ${
                      isPointLoss
                        ? 'bg-gradient-to-t from-rose-700 to-rose-400'
                        : 'bg-gradient-to-t from-emerald-600 to-teal-300'
                    }`}
                  />
                </div>

                {/* Date Label */}
                <span className="text-[10px] text-slate-300 mt-2 truncate w-full text-center font-tamil-varthagam font-bold">
                  {point.dateLabel.split(' ')[0]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Visual Payment Mode Breakdown (Cash vs UPI Meter) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-700">
              <Smartphone className="w-5 h-5" />
            </span>
            <div>
              <h4 className="font-tamil-varthagam font-black text-sm sm:text-base text-slate-900">
                {language === 'ta'
                  ? 'கட்டண விபரம் (Cash vs GPay / UPI)'
                  : 'Payment Channels (Cash vs UPI)'}
              </h4>
              <p className="text-[11px] text-slate-500">
                {language === 'ta' ? 'வாடிக்கையாளர்கள் எவ்வாறு செலுத்தியுள்ளார்கள்' : 'Customer payment preferences'}
              </p>
            </div>
          </div>
        </div>

        {/* Segmented Gradient Bar */}
        <div className="w-full h-5 rounded-full overflow-hidden bg-slate-100 flex p-0.5 border border-slate-200 my-2">
          <div
            style={{ width: `${cashPct}%` }}
            className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-l-full transition-all duration-500 flex items-center justify-center text-[10px] text-white font-black"
          >
            {cashPct > 15 ? `${cashPct}%` : ''}
          </div>
          <div
            style={{ width: `${upiPct}%` }}
            className="h-full bg-gradient-to-r from-indigo-600 to-violet-600 rounded-r-full transition-all duration-500 flex items-center justify-center text-[10px] text-white font-black"
          >
            {upiPct > 15 ? `${upiPct}%` : ''}
          </div>
        </div>

        {/* Legend Cards */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-600" />
              <div>
                <span className="text-[11px] font-bold text-emerald-900 block">
                  {language === 'ta' ? 'ரொக்கக் கட்டணம்' : 'Cash'}
                </span>
                <span className="text-base font-black text-emerald-800">
                  {formatPaise(cashPaise)}
                </span>
              </div>
            </div>
            <span className="text-xs font-black text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-300">
              {cashPct}%
            </span>
          </div>

          <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-indigo-600" />
              <div>
                <span className="text-[11px] font-bold text-indigo-900 block">
                  {language === 'ta' ? 'GPay / UPI' : 'Digital UPI'}
                </span>
                <span className="text-base font-black text-indigo-800">
                  {formatPaise(upiPaise)}
                </span>
              </div>
            </div>
            <span className="text-xs font-black text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-300">
              {upiPct}%
            </span>
          </div>
        </div>
      </div>

      {/* 3. Expense Distribution Visual Bars */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-50 text-rose-700">
              <PieIcon className="w-5 h-5" />
            </span>
            <div>
              <h4 className="font-tamil-varthagam font-black text-sm sm:text-base text-slate-900">
                {language === 'ta'
                  ? 'கடை செலவுகள் பகுப்பாய்வு (Expense Breakdown)'
                  : 'Operating Expenses Distribution'}
              </h4>
              <p className="text-[11px] text-slate-500">
                {language === 'ta'
                  ? 'எந்த செலவு அதிகம் என்பதை எளிதாக தெரிந்துகொள்ளுங்கள்'
                  : 'Visual breakdown of all stall expenditures'}
              </p>
            </div>
          </div>
          <span className="font-black text-slate-900 text-sm">
            {formatPaise(expensesPaise)}
          </span>
        </div>

        {expenseEntries.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400 font-tamil-varthagam">
            {language === 'ta'
              ? 'செலவுகள் எதுவும் பதிவு செய்யப்படவில்லை.'
              : 'No expenses recorded for this period.'}
          </div>
        ) : (
          <div className="space-y-3">
            {expenseEntries.map(([cat, amt]) => {
              const meta = getCatMeta(cat);
              const pct = Math.round((amt / totalExp) * 100);

              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <span className="text-base">{meta.icon}</span>
                      <span>{language === 'ta' ? meta.labelTa : meta.labelEn}</span>
                    </span>
                    <span className="font-mono text-slate-900">
                      {formatPaise(amt)}{' '}
                      <span className="text-slate-400 font-normal">({pct}%)</span>
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full ${meta.color} rounded-full transition-all duration-500`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Profit Margin Health Gauge / Indicator */}
      <div className="bg-gradient-to-r from-amber-500/10 via-brand-900/10 to-emerald-500/10 border border-amber-500/30 rounded-3xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black text-xl shadow-gold-sm flex-shrink-0">
              {marginPct}%
            </div>
            <div>
              <h4 className="font-tamil-varthagam font-black text-base text-slate-900">
                {language === 'ta' ? 'வியாபார லாப ஆரோக்கியம்' : 'Business Profit Health'}
              </h4>
              <p className="text-xs text-slate-600">
                {marginPct >= 35
                  ? language === 'ta'
                    ? '🌟 அருமையான லாப விகிதம்! கடை மிகச் சிறப்பாக செயல்படுகிறது.'
                    : 'Healthy Profit Margin! Your business is thriving.'
                  : marginPct >= 20
                  ? language === 'ta'
                    ? '⚖️ சுமாரான லாபம். மூலப்பொருள் கொள்முதல் விலையை கவனியுங்கள்.'
                    : 'Moderate Margin. Monitor raw material purchase rates.'
                  : language === 'ta'
                  ? '⚠️ குறைந்த லாப விகிதம். சில பொருட்களின் விலையை உயர்த்தவும்.'
                  : 'Low Margin. Consider optimizing costs or prices.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-amber-300 px-3.5 py-2 rounded-2xl shadow-sm text-xs font-bold text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>
              {language === 'ta' ? 'அடக்கம்: 40% | லாபம்: 60%' : 'Target: 60% Margin'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
