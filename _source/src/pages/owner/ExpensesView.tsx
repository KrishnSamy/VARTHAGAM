import React, { useState } from 'react';
import { Plus, Receipt, Calendar, UserMinus, Filter } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { db, ExpenseRecord, ExpenseCategory } from '../../db/db';
import { formatPaise, rupeesToPaise } from '../../lib/money';
import { feedback } from '../../lib/feedback';

export const ExpensesView: React.FC = () => {
  const { expenses, language, t, refreshShopData, subscription } = useShop();

  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState<ExpenseCategory>('raw_materials');
  const [amountRupees, setAmountRupees] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const [notes, setNotes] = useState('');
  const [dateKey, setDateKey] = useState(new Date().toISOString().split('T')[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categoriesConfig: Array<{ id: ExpenseCategory; labelTa: string; labelEn: string; icon: string; defaultFixed: boolean }> = [
    { id: 'raw_materials', labelTa: t.catRawMaterials, labelEn: 'Raw Materials', icon: '🛒', defaultFixed: false },
    { id: 'gas', labelTa: t.catGas, labelEn: 'LPG Gas', icon: '🔥', defaultFixed: true },
    { id: 'rent', labelTa: t.catRent, labelEn: 'Rent', icon: '🏪', defaultFixed: true },
    { id: 'salary', labelTa: t.catSalary, labelEn: 'Salary', icon: '👥', defaultFixed: true },
    { id: 'electricity', labelTa: t.catElectricity, labelEn: 'Electricity EB', icon: '⚡', defaultFixed: true },
    { id: 'water_can', labelTa: t.catWaterCan, labelEn: 'Water Cans', icon: '💧', defaultFixed: false },
    { id: 'packaging', labelTa: t.catPackaging, labelEn: 'Paper Cups/Packaging', icon: '📦', defaultFixed: false },
    { id: 'transport', labelTa: t.catTransport, labelEn: 'Transport', icon: '🛵', defaultFixed: false },
    { id: 'repairs', labelTa: t.catRepairs, labelEn: 'Repairs', icon: '🔧', defaultFixed: false },
    { id: 'license', labelTa: t.catLicense, labelEn: 'License / FSSAI', icon: '📋', defaultFixed: true },
    { id: 'loan_emi', labelTa: t.catLoanEmi, labelEn: 'Loan / EMI', icon: '🏦', defaultFixed: true },
    { id: 'owner_withdrawal', labelTa: t.catOwnerWithdrawal, labelEn: "Owner's Personal Withdrawal", icon: '👤', defaultFixed: false },
    { id: 'other', labelTa: t.catOther, labelEn: 'Other', icon: '📝', defaultFixed: false },
  ];

  const handleCategorySelect = (cat: ExpenseCategory) => {
    setCategory(cat);
    const cfg = categoriesConfig.find(c => c.id === cat);
    if (cfg) {
      setIsFixed(cfg.defaultFixed);
    }
    if (cat === 'rent' || cat === 'salary' || cat === 'loan_emi') {
      setIsRecurring(true);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subscription?.isReadOnly) return;
    const rupees = parseFloat(amountRupees);
    if (isNaN(rupees) || rupees <= 0) return;

    const amountPaise = rupeesToPaise(rupees);

    await db.expenses.put({
      id: `exp_${Date.now()}`,
      category,
      amountPaise,
      isRecurring,
      isFixed,
      notes: notes.trim(),
      dateKey,
      createdAt: Date.now(),
    });

    feedback.playPaymentSuccessTone();
    setShowAddModal(false);
    setAmountRupees('');
    setNotes('');
    await refreshShopData();
  };

  const filteredExpenses = expenses.filter(
    exp => categoryFilter === 'all' || exp.category === categoryFilter
  );

  // Separate shop operating expenses vs owner withdrawals
  const operatingExpenses = filteredExpenses.filter(e => e.category !== 'owner_withdrawal');
  const ownerWithdrawals = filteredExpenses.filter(e => e.category === 'owner_withdrawal');

  const totalOperatingPaise = operatingExpenses.reduce((s, e) => s + e.amountPaise, 0);
  const totalWithdrawalPaise = ownerWithdrawals.reduce((s, e) => s + e.amountPaise, 0);

  return (
    <div className="pb-32 max-w-4xl mx-auto px-2 sm:px-4">
      {/* Header Summary */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <p className="text-xs font-bold text-slate-500 mb-1">
            {language === 'ta' ? 'கடை இயக்க செலவுகள்' : 'Shop Operating Costs'}
          </p>
          <div className="text-2xl font-black text-rose-600">
            {formatPaise(totalOperatingPaise)}
          </div>
          <span className="text-[11px] text-slate-400">
            {operatingExpenses.length} {language === 'ta' ? 'பதிவுகள்' : 'entries'}
          </span>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1 text-slate-500 mb-1">
            <UserMinus className="w-4 h-4 text-brand-600" />
            <p className="text-xs font-bold">
              {language === 'ta' ? 'சொந்த தேவைக்கு எடுத்தது' : 'Owner Withdrawals'}
            </p>
          </div>
          <div className="text-2xl font-black text-slate-800">
            {formatPaise(totalWithdrawalPaise)}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">
            {language === 'ta' ? 'கடை செலவில் சேராது' : 'Not a shop expense'}
          </span>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-brand-700" />
          <h3 className="font-bold text-slate-800 text-base">
            {t.expensesTitle}
          </h3>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          disabled={subscription?.isReadOnly}
          className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm touch-target disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          <span>{t.addExpense}</span>
        </button>
      </div>

      {/* Categories Filter */}
      <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-none mb-3">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition ${
            categoryFilter === 'all'
              ? 'bg-slate-800 text-white'
              : 'bg-white text-slate-600 border border-slate-200'
          }`}
        >
          {language === 'ta' ? 'அனைத்தும்' : 'All'}
        </button>
        {categoriesConfig.map(c => (
          <button
            key={c.id}
            onClick={() => setCategoryFilter(c.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap flex items-center gap-1 transition ${
              categoryFilter === c.id
                ? 'bg-brand-700 text-white'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <span>{c.icon}</span>
            <span>{language === 'ta' ? c.labelTa : c.labelEn}</span>
          </button>
        ))}
      </div>

      {/* Expenses List */}
      <div className="space-y-2">
        {filteredExpenses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-semibold text-sm">
              {language === 'ta' ? 'செலவு பதிவுகள் எதுவும் இல்லை' : 'No expenses logged'}
            </p>
          </div>
        ) : (
          filteredExpenses.map(exp => {
            const catConfig = categoriesConfig.find(c => c.id === exp.category);
            const isOwner = exp.category === 'owner_withdrawal';

            return (
              <div
                key={exp.id}
                className={`bg-white rounded-2xl p-4 border transition flex justify-between items-center shadow-sm ${
                  isOwner ? 'border-brand-200 bg-brand-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl p-2 rounded-xl bg-slate-100 flex items-center justify-center">
                    {catConfig?.icon || '📝'}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">
                      {language === 'ta' ? catConfig?.labelTa : catConfig?.labelEn}
                    </h4>
                    {exp.notes && (
                      <p className="text-xs text-slate-500 mt-0.5">{exp.notes}</p>
                    )}
                    <span className="text-[11px] text-slate-400 font-mono">
                      {exp.dateKey} {exp.isFixed ? '• நிலையான செலவு' : '• மாறும் செலவு'}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-black text-lg ${
                      isOwner ? 'text-slate-900' : 'text-rose-600'
                    }`}
                  >
                    {formatPaise(exp.amountPaise)}
                  </div>
                  {isOwner && (
                    <span className="text-[10px] text-brand-700 font-bold bg-brand-100 px-1.5 py-0.5 rounded">
                      Withdrawal
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg text-slate-800 mb-1">
              {t.addExpense}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {language === 'ta'
                ? 'செலவு வகையை சரியாக குறிப்பது லாப கணக்கை துல்லியமாக்கும்.'
                : 'Correct categorization ensures exact gross and net profit computation.'}
            </p>

            <form onSubmit={handleAddExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  {t.expenseCategory} *
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border rounded-xl">
                  {categoriesConfig.map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleCategorySelect(c.id)}
                      className={`p-2.5 rounded-lg text-left text-xs font-semibold border flex items-center gap-2 transition ${
                        category === c.id
                          ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold'
                          : 'border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-base">{c.icon}</span>
                      <span className="line-clamp-1">{language === 'ta' ? c.labelTa : c.labelEn}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t.expenseAmount} *
                </label>
                <input
                  type="number"
                  step="any"
                  value={amountRupees}
                  onChange={e => setAmountRupees(e.target.value)}
                  placeholder="எ.கா: 300"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.expenseDate}
                  </label>
                  <input
                    type="date"
                    value={dateKey}
                    onChange={e => setDateKey(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 p-2 bg-slate-50 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isFixed}
                      onChange={e => setIsFixed(e.target.checked)}
                      className="w-4 h-4 text-brand-600 rounded"
                    />
                    <span>நிலையான செலவு (Fixed)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  குறிப்பு (Notes - Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="எ.கா: மாஸ்டர் முன்கூட்டிய சம்பளம்"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl text-sm touch-target"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl shadow text-sm touch-target"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
