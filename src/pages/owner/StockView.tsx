import React, { useState } from 'react';
import { Package, Plus, AlertCircle, ShoppingCart, Check, Phone, MessageSquare, Flame, Trash2 } from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { db, RawMaterial, GasCylinderLog } from '../../db/db';
import { formatPaise, rupeesToPaise, paiseToRupees } from '../../lib/money';
import { calculateGasCostPerDay } from '../../lib/formulas';
import { feedback } from '../../lib/feedback';

export const StockView: React.FC = () => {
  const { rawMaterials, language, t, refreshShopData, subscription } = useShop();

  const [activeTab, setActiveTab] = useState<'inventory' | 'purchase' | 'closing' | 'gas'>('inventory');

  // Purchase Form
  const [selectedMaterialId, setSelectedMaterialId] = useState('');
  const [purchaseQty, setPurchaseQty] = useState('');
  const [purchaseCostRupees, setPurchaseCostRupees] = useState('');
  const [supplierName, setSupplierName] = useState('');

  // Daily Closing Form
  const [closingLeftovers, setClosingLeftovers] = useState<Record<string, string>>({});

  // Gas Tracker Form
  const [gasPriceRupees, setGasPriceRupees] = useState('3237'); // Chennai commercial LPG average
  const [gasStartDate, setGasStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [gasLogs, setGasLogs] = useState<GasCylinderLog[]>([]);

  // Add Material Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMatNameTa, setNewMatNameTa] = useState('');
  const [newMatNameEn, setNewMatNameEn] = useState('');
  const [newMatUnit, setNewMatUnit] = useState<'L' | 'kg' | 'g' | 'nos' | 'packet' | 'cylinder'>('kg');
  const [newMatStock, setNewMatStock] = useState('10');
  const [newMatReorder, setNewMatReorder] = useState('2');
  const [newMatSupplier, setNewMatSupplier] = useState('');
  const [newMatPhone, setNewMatPhone] = useState('');

  // Load gas logs
  React.useEffect(() => {
    db.gasTracker.toArray().then(setGasLogs);
  }, []);

  const lowStockItems = rawMaterials.filter(m => m.currentStock <= m.reorderLevel);

  const handleLogPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subscription?.isReadOnly) return;
    const material = rawMaterials.find(m => m.id === selectedMaterialId);
    if (!material) return;

    const qty = parseFloat(purchaseQty);
    const costRupees = parseFloat(purchaseCostRupees);
    if (isNaN(qty) || qty <= 0 || isNaN(costRupees) || costRupees <= 0) return;

    const totalCostPaise = rupeesToPaise(costRupees);
    const costPerUnitPaise = Math.round(totalCostPaise / qty);
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Update material stock & cost
    const newStock = material.currentStock + qty;
    await db.rawMaterials.update(material.id, {
      currentStock: newStock,
      costPerUnitPaise,
      supplierName: supplierName || material.supplierName,
      updatedAt: Date.now(),
    });

    // 2. Log purchase record
    await db.purchases.put({
      id: `pur_${Date.now()}`,
      materialId: material.id,
      materialName: material.nameTa,
      quantity: qty,
      totalCostPaise,
      costPerUnitPaise,
      supplierName: supplierName || material.supplierName,
      dateKey: todayStr,
      createdAt: Date.now(),
    });

    // 3. Automatically record in shop operating expenses (no double entry!)
    await db.expenses.put({
      id: `exp_pur_${Date.now()}`,
      category: material.unit === 'cylinder' ? 'gas' : 'raw_materials',
      amountPaise: totalCostPaise,
      isRecurring: false,
      isFixed: false,
      notes: `${material.nameTa} (${qty} ${material.unit}) கொள்முதல்`,
      dateKey: todayStr,
      createdAt: Date.now(),
    });

    feedback.playPaymentSuccessTone();
    setPurchaseQty('');
    setPurchaseCostRupees('');
    setActiveTab('inventory');
    await refreshShopData();
  };

  const handleAddNewMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatNameTa.trim()) return;

    await db.rawMaterials.put({
      id: `mat_${Date.now()}`,
      nameTa: newMatNameTa.trim(),
      nameEn: newMatNameEn.trim() || newMatNameTa.trim(),
      unit: newMatUnit,
      currentStock: parseFloat(newMatStock) || 0,
      reorderLevel: parseFloat(newMatReorder) || 0,
      costPerUnitPaise: 0,
      supplierName: newMatSupplier.trim(),
      supplierPhone: newMatPhone.trim(),
      updatedAt: Date.now(),
    });

    setShowAddModal(false);
    setNewMatNameTa('');
    setNewMatNameEn('');
    await refreshShopData();
  };

  const handleSaveDailyClosing = async () => {
    const todayStr = new Date().toISOString().split('T')[0];

    // Update stock with entered closing leftovers
    for (const [matId, leftoverStr] of Object.entries(closingLeftovers)) {
      const leftover = parseFloat(leftoverStr);
      if (!isNaN(leftover)) {
        await db.rawMaterials.update(matId, {
          currentStock: leftover,
          updatedAt: Date.now(),
        });
      }
    }

    feedback.playPaymentSuccessTone();
    alert(language === 'ta' ? 'இன்றைய கடை மூடல் கணக்கு வெற்றிகரமாக பதிவானது!' : 'Daily closing stock saved successfully!');
    await refreshShopData();
    setActiveTab('inventory');
  };

  const shareBuyListWhatsApp = () => {
    const lines = [
      `🛒 *${language === 'ta' ? 'சரக்கு கொள்முதல் பட்டியல்' : "Tomorrow's Buy List"}*`,
      `தேதி: ${new Date().toLocaleDateString('ta-IN')}`,
      '--------------------------------',
      ...lowStockItems.map(
        i => `• ${i.nameTa} - தேவை: சுமார் ${(i.reorderLevel * 2).toFixed(1)} ${i.unit}`
      ),
      '--------------------------------',
      'தயவுசெய்து காலைக்குள் அனுப்பி வைக்கவும்.',
    ];
    window.open(`https://wa.me/?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  };

  const handleStartNewGasCylinder = async () => {
    const priceRupees = parseFloat(gasPriceRupees);
    if (isNaN(priceRupees) || priceRupees <= 0) return;

    const pricePaidPaise = rupeesToPaise(priceRupees);
    const todayStr = new Date().toISOString().split('T')[0];

    // If an existing open cylinder exists, close it
    const activeCylinder = gasLogs.find(g => !g.dateEnded);
    if (activeCylinder) {
      const start = new Date(activeCylinder.dateStarted).getTime();
      const end = new Date(todayStr).getTime();
      const diffDays = Math.max(1, Math.round((end - start) / 86400000));
      const costPerDay = calculateGasCostPerDay(activeCylinder.pricePaidPaise, diffDays);

      await db.gasTracker.update(activeCylinder.id, {
        dateEnded: todayStr,
        daysLasted: diffDays,
        costPerDayPaise: costPerDay,
      });
    }

    // Start new cylinder
    const newCyl: GasCylinderLog = {
      id: `gas_${Date.now()}`,
      name: '19kg Commercial LPG',
      dateStarted: todayStr,
      pricePaidPaise,
      createdAt: Date.now(),
    };
    await db.gasTracker.put(newCyl);

    // Record gas expense
    await db.expenses.put({
      id: `exp_gas_${Date.now()}`,
      category: 'gas',
      amountPaise: pricePaidPaise,
      isRecurring: false,
      isFixed: true,
      notes: '19kg கமர்ஷியல் கேஸ் சிலிண்டர் வாங்கியது',
      dateKey: todayStr,
      createdAt: Date.now(),
    });

    const updated = await db.gasTracker.toArray();
    setGasLogs(updated);
    alert(language === 'ta' ? 'புதிய சிலிண்டர் பயன்பாடு தொடங்கியது!' : 'New gas cylinder started!');
    await refreshShopData();
  };

  return (
    <div className="pb-32 max-w-4xl mx-auto px-2 sm:px-4">
      {/* Low Stock Warning Banner */}
      {lowStockItems.length > 0 && (
        <div className="mb-4 p-4 rounded-2xl bg-amber-500 text-white flex justify-between items-center shadow-md">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-6 h-6 flex-shrink-0" />
            <div>
              <h4 className="font-bold text-sm sm:text-base">
                {t.lowStockAlert}
              </h4>
              <p className="text-xs text-amber-100">
                {lowStockItems.map(i => i.nameTa).join(', ')}
              </p>
            </div>
          </div>
          <button
            onClick={shareBuyListWhatsApp}
            className="bg-white text-amber-900 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 shadow touch-target"
          >
            <MessageSquare className="w-4 h-4 text-emerald-600" />
            <span>{language === 'ta' ? 'வாட்ஸ்அப் பட்டியல்' : 'Buy List'}</span>
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition touch-target ${
            activeTab === 'inventory'
              ? 'bg-brand-700 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>{language === 'ta' ? 'இருப்பு' : 'Stock'}</span>
        </button>

        <button
          onClick={() => setActiveTab('purchase')}
          className={`py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition touch-target ${
            activeTab === 'purchase'
              ? 'bg-brand-700 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>{language === 'ta' ? 'வாங்குதல்' : 'Buy'}</span>
        </button>

        <button
          onClick={() => setActiveTab('closing')}
          className={`py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition touch-target ${
            activeTab === 'closing'
              ? 'bg-brand-700 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <Check className="w-4 h-4" />
          <span>{language === 'ta' ? 'கடை மூடல்' : 'Closing'}</span>
        </button>

        <button
          onClick={() => setActiveTab('gas')}
          className={`py-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition touch-target ${
            activeTab === 'gas'
              ? 'bg-brand-700 text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          <Flame className="w-4 h-4" />
          <span>{language === 'ta' ? 'கேஸ்' : 'Gas'}</span>
        </button>
      </div>

      {/* TAB 1: INVENTORY LIST */}
      {activeTab === 'inventory' && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-slate-800 text-base">
              {t.stockTitle}
            </h3>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 touch-target shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addMaterial}</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {rawMaterials.map(mat => {
              const isLow = mat.currentStock <= mat.reorderLevel;

              return (
                <div
                  key={mat.id}
                  className={`bg-white rounded-2xl p-4 border transition shadow-sm flex items-center justify-between ${
                    isLow ? 'border-amber-400 bg-amber-50/40' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-800 text-base">
                        {language === 'ta' ? mat.nameTa : mat.nameEn}
                      </h4>
                      {isLow && (
                        <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                          {language === 'ta' ? 'குறைவு' : 'Low'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {language === 'ta' ? 'குறைந்தபட்ச இருப்பு:' : 'Reorder level:'}{' '}
                      <span className="font-semibold">{mat.reorderLevel} {mat.unit}</span>
                    </p>
                    {mat.supplierPhone && (
                      <div className="flex gap-2 mt-2">
                        <a
                          href={`tel:${mat.supplierPhone}`}
                          className="text-xs text-brand-700 font-semibold flex items-center gap-1 bg-brand-50 px-2 py-1 rounded-lg border border-brand-100"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>{mat.supplierName || 'Call'}</span>
                        </a>
                      </div>
                    )}
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900">
                      {mat.currentStock}
                    </span>
                    <span className="text-xs text-slate-500 ml-1 font-bold">
                      {mat.unit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: QUICK PURCHASE ENTRY */}
      {activeTab === 'purchase' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {t.quickPurchase}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {language === 'ta'
              ? 'சரக்கு வாங்கியதை இங்கு உள்ளிட்டால், தானாக இருப்பு கூடும் மற்றும் செலவு கணக்கிலும் பதிவாகும்.'
              : 'Logs purchase, updates stock count, and records the expense automatically.'}
          </p>

          <form onSubmit={handleLogPurchase} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                {language === 'ta' ? 'பொருள் தேர்ந்தெடுக்கவும்' : 'Select Raw Material'} *
              </label>
              <select
                value={selectedMaterialId}
                onChange={e => setSelectedMaterialId(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base"
              >
                <option value="">-- {language === 'ta' ? 'தேர்ந்தெடுக்கவும்' : 'Select'} --</option>
                {rawMaterials.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.nameTa} ({m.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  {t.purchaseQty} *
                </label>
                <input
                  type="number"
                  step="any"
                  value={purchaseQty}
                  onChange={e => setPurchaseQty(e.target.value)}
                  placeholder="e.g. 10"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  {t.purchaseTotalCost} *
                </label>
                <input
                  type="number"
                  step="any"
                  value={purchaseCostRupees}
                  onChange={e => setPurchaseCostRupees(e.target.value)}
                  placeholder="e.g. 450"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                {language === 'ta' ? 'சப்ளையர் பெயர் (விருப்பப்பட்டால்)' : 'Supplier Name (Optional)'}
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={e => setSupplierName(e.target.value)}
                placeholder="e.g. ஆவின் டெய்ரி"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 text-base"
              />
            </div>

            <button
              type="submit"
              disabled={subscription?.isReadOnly}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl shadow-md transition touch-target active:scale-95 disabled:opacity-50"
            >
              {language === 'ta' ? 'கொள்முதலை பதிவு செய்' : 'Save Purchase'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: DAILY CLOSING LEFTOVERS */}
      {activeTab === 'closing' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {t.dailyClosing}
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            {language === 'ta'
              ? 'கடை மூடும் போது மீதமான அளவை மட்டும் உள்ளிடுங்கள் (60 விநாடிகள்). உண்மையான பயன்பாடும் லாபமும் கணக்கிடப்படும்.'
              : 'Enter physical leftovers at closing time in under 60 seconds to compute exact wastage.'}
          </p>

          <div className="space-y-3 mb-6">
            {rawMaterials.map(mat => (
              <div key={mat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{mat.nameTa}</h4>
                  <p className="text-xs text-slate-500">{language === 'ta' ? 'அலகு:' : 'Unit:'} {mat.unit}</p>
                </div>
                <div className="w-28">
                  <input
                    type="number"
                    step="any"
                    placeholder={`${mat.currentStock}`}
                    value={closingLeftovers[mat.id] || ''}
                    onChange={e =>
                      setClosingLeftovers({
                        ...closingLeftovers,
                        [mat.id]: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-right font-bold text-base"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={handleSaveDailyClosing}
            disabled={subscription?.isReadOnly}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl shadow-md transition touch-target active:scale-95 disabled:opacity-50"
          >
            {language === 'ta' ? 'கடை மூடல் கணக்கை சேமி' : 'Save Closing Stock'}
          </button>
        </div>
      )}

      {/* TAB 4: GAS CYLINDER TRACKER */}
      {activeTab === 'gas' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 mb-2 text-brand-700">
              <Flame className="w-6 h-6" />
              <h3 className="text-lg font-bold text-slate-800">
                {language === 'ta' ? 'கேஸ் சிலிண்டர் பயன்பாட்டு கணக்கு' : 'LPG Cylinder Tracker'}
              </h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              {language === 'ta'
                ? 'ஒரு சிலிண்டர் எத்தனை நாட்கள் நீடிக்கிறது மற்றும் நாள் ஒன்றுக்கு ஆகும் கேஸ் செலவை துல்லியமாக கண்காணிக்கலாம்.'
                : 'Tracks cylinder duration and daily gas cost.'}
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'ta' ? 'சிலிண்டர் விலை (₹)' : 'Price Paid (₹)'}
                </label>
                <input
                  type="number"
                  value={gasPriceRupees}
                  onChange={e => setGasPriceRupees(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-base"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {language === 'ta' ? 'தொடங்கிய தேதி' : 'Date Started'}
                </label>
                <input
                  type="date"
                  value={gasStartDate}
                  onChange={e => setGasStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleStartNewGasCylinder}
              disabled={subscription?.isReadOnly}
              className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl shadow transition touch-target text-sm active:scale-95 disabled:opacity-50"
            >
              {language === 'ta' ? 'புதிய சிலிண்டர் மாற்றினேன்' : 'Start New Cylinder'}
            </button>
          </div>

          {/* Past Cylinders Log */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200">
            <h4 className="font-bold text-sm text-slate-800 mb-3">
              {language === 'ta' ? 'சிலிண்டர் வரலாறு' : 'Cylinder History'}
            </h4>
            {gasLogs.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">
                {language === 'ta' ? 'பதிவுகள் இல்லை' : 'No records yet'}
              </p>
            ) : (
              <div className="space-y-2">
                {gasLogs.map(log => (
                  <div key={log.id} className="p-3 bg-slate-50 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{log.name}</span>
                      <p className="text-slate-500 mt-0.5">
                        {log.dateStarted} {log.dateEnded ? `முதல் ${log.dateEnded}` : '(செயலில் உள்ளது)'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-800">{formatPaise(log.pricePaidPaise)}</div>
                      {log.daysLasted && (
                        <span className="text-brand-700 font-semibold">
                          {log.daysLasted} {language === 'ta' ? 'நாட்கள்' : 'days'} ({formatPaise(log.costPerDayPaise || 0)}/நாள்)
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add New Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-800 mb-4">
              {t.addMaterial}
            </h3>

            <form onSubmit={handleAddNewMaterial} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  பொருள் பெயர் (தமிழ்) *
                </label>
                <input
                  type="text"
                  value={newMatNameTa}
                  onChange={e => setNewMatNameTa(e.target.value)}
                  placeholder="எ.கா: கடலைப்பருப்பு"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Item Name (English)
                </label>
                <input
                  type="text"
                  value={newMatNameEn}
                  onChange={e => setNewMatNameEn(e.target.value)}
                  placeholder="e.g. Chana Dal"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    அலகு (Unit)
                  </label>
                  <select
                    value={newMatUnit}
                    onChange={e => setNewMatUnit(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  >
                    <option value="kg">kg</option>
                    <option value="L">L (லிட்டர்)</option>
                    <option value="g">g (கிராம்)</option>
                    <option value="nos">nos (எண்ணிக்கை)</option>
                    <option value="packet">packet (பாக்கெட்)</option>
                    <option value="cylinder">cylinder (சிலிண்டர்)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    குறைந்தபட்ச இருப்பு
                  </label>
                  <input
                    type="number"
                    value={newMatReorder}
                    onChange={e => setNewMatReorder(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  சப்ளையர் போன்
                </label>
                <input
                  type="tel"
                  value={newMatPhone}
                  onChange={e => setNewMatPhone(e.target.value)}
                  placeholder="9840012345"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl text-sm touch-target"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl shadow text-sm touch-target"
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
