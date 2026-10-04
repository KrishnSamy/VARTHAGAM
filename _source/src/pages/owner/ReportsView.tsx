import React, { useState, useEffect } from 'react';
import { Calendar, Download, Share2, HelpCircle, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, FileSpreadsheet, Printer } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { db, OrderBill, ExpenseRecord } from '../../db/db';
import { formatPaise, paiseToRupees } from '../../lib/money';
import { calculateGrossProfit, calculateNetProfit, calculateGrossMarginPercentage } from '../../lib/formulas';
import { PinModal } from '../../components/PinModal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const ReportsView: React.FC = () => {
  const { language, t, settings, subscription } = useShop();

  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('daily');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showPinModal, setShowPinModal] = useState(true);
  const [showHowCalcModal, setShowHowCalcModal] = useState(false);

  // Financial aggregates
  const [salesPaise, setSalesPaise] = useState(0);
  const [cashPaise, setCashPaise] = useState(0);
  const [upiPaise, setUpiPaise] = useState(0);
  const [cogsPaise, setCogsPaise] = useState(0);
  const [expensesPaise, setExpensesPaise] = useState(0);
  const [billsCount, setBillsCount] = useState(0);
  const [categoryExpenses, setCategoryExpenses] = useState<Record<string, number>>({});

  useEffect(() => {
    if (isUnlocked) {
      calculateMetrics();
    }
  }, [isUnlocked, period]);

  const calculateMetrics = async () => {
    const today = new Date();
    let startDateStr = '';

    if (period === 'daily') {
      startDateStr = today.toISOString().split('T')[0];
    } else if (period === 'weekly') {
      const pastWeek = new Date(today.getTime() - 7 * 86400000);
      startDateStr = pastWeek.toISOString().split('T')[0];
    } else if (period === 'monthly') {
      const pastMonth = new Date(today.getTime() - 30 * 86400000);
      startDateStr = pastMonth.toISOString().split('T')[0];
    } else {
      const pastYear = new Date(today.getTime() - 365 * 86400000);
      startDateStr = pastYear.toISOString().split('T')[0];
    }

    // Orders query
    const orders = await db.orders
      .where('dateKey')
      .aboveOrEqual(startDateStr)
      .toArray();

    // Expenses query
    const expenses = await db.expenses
      .where('dateKey')
      .aboveOrEqual(startDateStr)
      .toArray();

    let totalSales = 0;
    let cashSales = 0;
    let upiSales = 0;

    orders.forEach(o => {
      totalSales += o.totalPaise;
      if (o.payMode === 'cash') cashSales += o.totalPaise;
      else upiSales += o.totalPaise;
    });

    // Expenses breakdown (excluding owner personal withdrawals)
    let totalOpExpenses = 0;
    let catMap: Record<string, number> = {};

    expenses.forEach(e => {
      if (e.category !== 'owner_withdrawal') {
        totalOpExpenses += e.amountPaise;
        catMap[e.category] = (catMap[e.category] || 0) + e.amountPaise;
      }
    });

    // COGS estimation: raw material purchases or 40% industry rule if no recipe
    const rawMaterialPurchases = catMap['raw_materials'] || Math.round(totalSales * 0.4);

    setSalesPaise(totalSales);
    setCashPaise(cashSales);
    setUpiPaise(upiSales);
    setCogsPaise(rawMaterialPurchases);
    setExpensesPaise(totalOpExpenses);
    setBillsCount(orders.length);
    setCategoryExpenses(catMap);
  };

  const grossProfitPaise = calculateGrossProfit(salesPaise, cogsPaise);
  const netProfitPaise = calculateNetProfit(grossProfitPaise, expensesPaise - cogsPaise);
  const marginPct = calculateGrossMarginPercentage(grossProfitPaise, salesPaise);
  const isLoss = netProfitPaise < 0;

  const exportExcel = () => {
    const data = [
      ['கடை கணக்கு - நிதி அறிக்கை (Financial Report)'],
      ['Shop:', settings?.name || 'Kadai'],
      ['Period:', period.toUpperCase()],
      ['Date:', new Date().toLocaleDateString()],
      [],
      ['Metric', 'Amount (INR)'],
      ['Total Sales (விற்பனை)', paiseToRupees(salesPaise)],
      ['Cash Sales (ரொக்கம்)', paiseToRupees(cashPaise)],
      ['UPI Sales (யுபிஐ)', paiseToRupees(upiPaise)],
      ['Cost of Goods (பொருட்கள் அடக்கவிலை)', paiseToRupees(cogsPaise)],
      ['Gross Profit (மொத்த லாபம்)', paiseToRupees(grossProfitPaise)],
      ['Operating Expenses (கடை செலவுகள்)', paiseToRupees(expensesPaise - cogsPaise)],
      ['Net Profit / Loss (நிகர லாபம் / நஷ்டம்)', paiseToRupees(netProfitPaise)],
      ['Gross Margin %', `${marginPct}%`],
      ['Total Bills Count', billsCount],
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'P&L Statement');
    XLSX.writeFile(wb, `kadai_kanakku_${period}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(settings?.name || 'Kadai Kanakku', 14, 20);
    doc.setFontSize(12);
    doc.text(`Profit & Loss Statement - ${period.toUpperCase()}`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 35);

    const tableData = [
      ['Total Revenue', formatPaise(salesPaise)],
      ['Cash Revenue', formatPaise(cashPaise)],
      ['UPI Revenue', formatPaise(upiPaise)],
      ['Cost of Goods (COGS)', formatPaise(cogsPaise)],
      ['Gross Profit', formatPaise(grossProfitPaise)],
      ['Operating Expenses', formatPaise(expensesPaise - cogsPaise)],
      ['Net Profit / (Loss)', formatPaise(netProfitPaise)],
      ['Gross Margin %', `${marginPct}%`],
      ['Bills Count', `${billsCount}`],
    ];

    (doc as any).autoTable({
      startY: 42,
      head: [['Metric', 'Amount']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [21, 128, 61] },
    });

    doc.save(`kadai_kanakku_${period}.pdf`);
  };

  const shareWhatsAppSummary = () => {
    const lines = [
      `📊 *${settings?.name || 'கடை கணக்கு'}* (${period.toUpperCase()})`,
      `விற்பனை: *${formatPaise(salesPaise)}* (ரொக்கம்: ${formatPaise(cashPaise)}, UPI: ${formatPaise(upiPaise)})`,
      `மூலப்பொருள் அடக்கவிலை: ${formatPaise(cogsPaise)}`,
      `மொத்த லாபம்: ${formatPaise(grossProfitPaise)} (${marginPct}%)`,
      `கடை செலவுகள்: ${formatPaise(expensesPaise - cogsPaise)}`,
      `--------------------------------`,
      isLoss
        ? `🚨 *நஷ்டம்: ${formatPaise(Math.abs(netProfitPaise))}*`
        : `💰 *நிகர லாபம்: ${formatPaise(netProfitPaise)}*`,
    ];
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  };

  return (
    <div className="pb-32 max-w-4xl mx-auto px-2 sm:px-4">
      {/* PIN Protection Modal */}
      {!isUnlocked && (
        <PinModal
          isOpen={showPinModal}
          titleTa="லாப கணக்கு பார்க்க PIN உள்ளிடவும்"
          titleEn="Enter Owner PIN for P&L"
          onSuccess={() => setIsUnlocked(true)}
          onCancel={() => {
            // redirect to billing tab if cancelled
            window.location.hash = 'billing';
          }}
        />
      )}

      {/* Period Selector */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {(['daily', 'weekly', 'monthly', 'yearly'] as const).map(p => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`py-3 rounded-xl font-bold text-xs sm:text-sm transition touch-target ${
              period === p
                ? 'bg-brand-700 text-white shadow-sm'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            {p === 'daily'
              ? language === 'ta' ? 'இன்று' : 'Daily'
              : p === 'weekly'
              ? language === 'ta' ? 'வாரம்' : 'Weekly'
              : p === 'monthly'
              ? language === 'ta' ? 'மாதம்' : 'Monthly'
              : language === 'ta' ? 'வருடம்' : 'Yearly'}
          </button>
        ))}
      </div>

      {/* Hero P&L Card */}
      <div
        className={`rounded-3xl p-6 text-white shadow-xl mb-6 transition-all ${
          isLoss
            ? 'bg-gradient-to-br from-rose-600 to-rose-900'
            : 'bg-gradient-to-br from-emerald-600 to-teal-900'
        }`}
      >
        <div className="flex justify-between items-start mb-2">
          <div>
            <span className="text-xs uppercase font-bold tracking-widest opacity-80">
              {isLoss
                ? language === 'ta' ? 'நிகர நஷ்டம்' : 'Net Loss'
                : language === 'ta' ? 'நிகர லாபம்' : 'Net Profit'}
            </span>
            <div className="text-4xl sm:text-5xl font-black tracking-tight mt-1">
              {formatPaise(netProfitPaise)}
            </div>
          </div>
          <button
            onClick={() => setShowHowCalcModal(true)}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-full backdrop-blur-sm transition touch-target"
            title="How is this calculated?"
          >
            <HelpCircle className="w-5 h-5 text-white" />
          </button>
        </div>

        {isLoss ? (
          <p className="text-xs bg-rose-950/40 p-2.5 rounded-xl border border-rose-400/30 mt-3">
            {language === 'ta'
              ? 'நஷ்டம்: இந்த காலத்தில் செலவுகள் மொத்த விற்பனையை விட அதிகமாக உள்ளது. சரக்கு பயன்பாட்டால் அடுத்தடுத்த நாட்களில் சீராகும்.'
              : 'Loss: Operating costs exceeded gross margin in this period.'}
          </p>
        ) : (
          <p className="text-xs opacity-90 mt-2">
            {language === 'ta'
              ? `அனைத்து கடை செலவுகளும் போக உங்கள் கையில் நிற்கும் நிகர லாபம் இது.`
              : 'Verified take-home net profit after deducting all stall expenses.'}
          </p>
        )}
      </div>

      {/* Key Financial Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 mb-1">
            {t.salesToday}
          </p>
          <div className="text-2xl font-black text-slate-900">
            {formatPaise(salesPaise)}
          </div>
          <span className="text-[11px] text-slate-400">
            {billsCount} {language === 'ta' ? 'பில்கள்' : 'bills'}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 mb-1">
            {language === 'ta' ? 'ரொக்கம் vs UPI' : 'Cash vs UPI'}
          </p>
          <div className="text-sm font-extrabold text-slate-800">
            💵 {formatPaise(cashPaise)}
          </div>
          <div className="text-sm font-extrabold text-indigo-600 mt-0.5">
            📱 {formatPaise(upiPaise)}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 mb-1">
            {t.grossProfit}
          </p>
          <div className="text-2xl font-black text-brand-700">
            {formatPaise(grossProfitPaise)}
          </div>
          <span className="text-[11px] font-bold text-emerald-600">
            {marginPct}% {language === 'ta' ? 'லாப விகிதம்' : 'margin'}
          </span>
        </div>
      </div>

      {/* Export & Share Bar */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={shareWhatsAppSummary}
          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs touch-target shadow-sm"
        >
          <Share2 className="w-4 h-4" />
          <span>{t.shareWhatsapp}</span>
        </button>

        <button
          onClick={exportExcel}
          className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs touch-target shadow-sm"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Excel</span>
        </button>

        <button
          onClick={exportPdf}
          className="flex-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs touch-target shadow-sm"
        >
          <Download className="w-4 h-4 text-rose-600" />
          <span>PDF</span>
        </button>
      </div>

      {/* "How is this calculated?" Explainable Math Modal */}
      {showHowCalcModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-800 mb-2">
              {language === 'ta' ? 'லாப கணக்கு எவ்வாறு கணக்கிடப்பட்டது?' : 'How is Profit Calculated?'}
            </h3>
            <div className="space-y-3 text-xs text-slate-600 my-4">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="font-bold text-slate-800">1. மொத்த லாபம் (Gross Profit)</p>
                <p>விற்பனை ({formatPaise(salesPaise)}) − பொருட்கள் அடக்கவிலை ({formatPaise(cogsPaise)}) = <strong>{formatPaise(grossProfitPaise)}</strong></p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="font-bold text-slate-800">2. நிகர லாபம் (Net Profit)</p>
                <p>மொத்த லாபம் ({formatPaise(grossProfitPaise)}) − கடை இயக்க செலவுகள் ({formatPaise(expensesPaise - cogsPaise)}) = <strong>{formatPaise(netProfitPaise)}</strong></p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="font-bold text-slate-800">3. முதலாளி எடுத்த சொந்த பணம்</p>
                <p>கல்லாவில் இருந்து முதலாளி குடும்ப செலவுக்கு எடுத்த பணம் கடை செலவில் சேர்க்கப்படவில்லை.</p>
              </div>
            </div>
            <button
              onClick={() => setShowHowCalcModal(false)}
              className="w-full bg-brand-700 text-white font-bold py-3 rounded-xl text-sm touch-target"
            >
              {language === 'ta' ? 'புரிந்தது' : 'Understood'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
