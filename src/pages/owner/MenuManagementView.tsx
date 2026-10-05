import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  Check,
  AlertCircle,
  Lock,
  Unlock,
  Sparkles,
  ArrowUpDown,
  Search,
  CheckCircle2,
  XCircle,
  Coffee,
  ArrowLeft,
  Upload,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { MenuItem } from '../../db/db';
import { formatPaise, rupeesToPaise, paiseToRupees } from '../../lib/money';
import { feedback } from '../../lib/feedback';
import { PinModal } from '../../components/PinModal';
import { BulkItemUploadModal } from '../../components/BulkItemUploadModal';

interface Props {
  onBack?: () => void;
}

export const MenuManagementView: React.FC<Props> = ({ onBack }) => {
  const {
    items,
    language,
    t,
    refreshShopData,
    subscription,
    isOwnerUnlocked,
    lockOwner,
    updateItemPrice,
    addItem,
    updateItem,
    deleteItem,
    toggleItemAvailable,
    bulkUpdateCategoryPrices,
  } = useShop();

  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickPriceModal, setShowQuickPriceModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Add / Edit Form State
  const [nameTa, setNameTa] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [category, setCategory] = useState('Hot Drinks');
  const [priceRupees, setPriceRupees] = useState('');
  const [emoji, setEmoji] = useState('☕');
  const [morningOnly, setMorningOnly] = useState(false);

  // Quick Price Modal State
  const [quickPriceItem, setQuickPriceItem] = useState<MenuItem | null>(null);
  const [quickRupees, setQuickRupees] = useState<number>(0);

  // Bulk Price Modal State
  const [bulkCategory, setBulkCategory] = useState<string>('all');
  const [bulkIncreaseRupees, setBulkIncreaseRupees] = useState<string>('1');

  const categories = Array.from(new Set(items.map(i => i.category)));

  const emojiOptions = [
    '☕', '🍵', '🥛', '🍋', '⚪', '🥞', '🍩', '🥟', '🍘', '🥣',
    '🍛', '🍚', '🥤', '🫓', '🍪', '🥪', '🍹', '🍦', '🍱', '🍳'
  ];

  const filteredItems = items.filter(item => {
    const matchesCat = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch =
      item.nameTa.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleOpenAdd = () => {
    if (!isOwnerUnlocked) {
      setIsPinModalOpen(true);
      return;
    }
    setEditingItem(null);
    setNameTa('');
    setNameEn('');
    setCategory(categories[0] || 'Hot Drinks');
    setPriceRupees('12');
    setEmoji('☕');
    setMorningOnly(false);
    setShowAddModal(true);
  };

  const handleOpenEdit = (item: MenuItem) => {
    if (!isOwnerUnlocked) {
      setIsPinModalOpen(true);
      return;
    }
    setEditingItem(item);
    setNameTa(item.nameTa);
    setNameEn(item.nameEn);
    setCategory(item.category);
    setPriceRupees(paiseToRupees(item.pricePaise).toString());
    setEmoji(item.emoji);
    setMorningOnly(item.morningOnly || false);
    setShowAddModal(true);
  };

  const handleOpenQuickPrice = (item: MenuItem) => {
    if (!isOwnerUnlocked) {
      setIsPinModalOpen(true);
      return;
    }
    setQuickPriceItem(item);
    setQuickRupees(paiseToRupees(item.pricePaise));
    setShowQuickPriceModal(true);
  };

  const handleSaveQuickPrice = async () => {
    if (!quickPriceItem || quickRupees <= 0) return;
    const newPricePaise = rupeesToPaise(quickRupees);
    await updateItemPrice(quickPriceItem.id, newPricePaise, 'Quick owner price adjustment');
    feedback.playPaymentSuccessTone();
    setShowQuickPriceModal(false);
    setQuickPriceItem(null);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subscription?.isReadOnly) return;
    const rupees = parseFloat(priceRupees);
    if (isNaN(rupees) || rupees <= 0) return;

    const pricePaise = rupeesToPaise(rupees);

    if (editingItem) {
      await updateItem(editingItem.id, {
        nameTa: nameTa.trim(),
        nameEn: nameEn.trim() || nameTa.trim(),
        category,
        pricePaise,
        emoji,
        morningOnly,
      });
    } else {
      await addItem({
        nameTa: nameTa.trim(),
        nameEn: nameEn.trim() || nameTa.trim(),
        category,
        pricePaise,
        emoji,
        available: true,
        morningOnly,
        sortOrder: items.length + 1,
      });
    }

    feedback.playPaymentSuccessTone();
    setShowAddModal(false);
    setEditingItem(null);
  };

  const handleDelete = async (item: MenuItem) => {
    if (!isOwnerUnlocked) {
      setIsPinModalOpen(true);
      return;
    }
    const confirmText =
      language === 'ta'
        ? `"${item.nameTa}" பொருளை நிச்சயமாக நீக்க வேண்டுமா?`
        : `Are you sure you want to delete "${item.nameEn}"?`;

    if (window.confirm(confirmText)) {
      await deleteItem(item.id);
      feedback.vibrate(50);
    }
  };

  const handleBulkUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const incRupees = parseFloat(bulkIncreaseRupees);
    if (isNaN(incRupees) || incRupees === 0) return;

    const incPaise = rupeesToPaise(incRupees);
    await bulkUpdateCategoryPrices(bulkCategory, incPaise);
    feedback.playPaymentSuccessTone();
    setShowBulkModal(false);
  };

  return (
    <div className="pb-32 max-w-4xl mx-auto px-2 sm:px-4 animate-in fade-in">
      {/* Top Banner / Unlock Status */}
      <div className="bg-gradient-to-r from-brand-900 via-rose-950 to-slate-900 border border-amber-500/30 rounded-3xl p-5 mb-5 shadow-crimson-md text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-amber-200 mb-2 touch-target"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{language === 'ta' ? '← அமைப்புகளுக்கு திரும்புக (Back to Settings)' : '← Back to Settings'}</span>
            </button>
          )}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-tamil-varthagam font-black text-xl text-amber-300">
              {language === 'ta' ? 'பொருட்கள் & விலை மேலாண்மை' : 'Items & Menu Pricing'}
            </span>
            {isOwnerUnlocked ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Unlock className="w-3 h-3" />
                <span>{language === 'ta' ? 'PIN திறக்கப்பட்டது' : 'Unlocked'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <Lock className="w-3 h-3" />
                <span>{language === 'ta' ? 'PIN பூட்டப்பட்டுள்ளது' : 'PIN Locked'}</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-300">
            {language === 'ta'
              ? 'கடை முதலாளி மட்டுமே PIN எண் மூலம் பொருட்களை சேர்க்கவும் விலையை மாற்றவும் முடியும்.'
              : 'Only shop owners can add items & modify prices with their 4-digit PIN.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isOwnerUnlocked ? (
            <button
              onClick={() => setIsPinModalOpen(true)}
              className="bg-gold-gradient text-slate-950 font-bold px-4 py-2.5 rounded-2xl text-xs shadow-gold-sm hover:brightness-105 active:scale-95 transition flex items-center gap-1.5 touch-target"
            >
              <KeyIcon className="w-4 h-4" />
              <span>{language === 'ta' ? 'PIN உள்ளிடவும்' : 'Enter PIN'}</span>
            </button>
          ) : (
            <button
              onClick={() => lockOwner()}
              className="bg-white/10 hover:bg-white/15 text-slate-300 font-bold px-3 py-2 rounded-2xl text-xs border border-white/10 transition flex items-center gap-1 touch-target"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'பூட்டுக' : 'Lock'}</span>
            </button>
          )}

          <button
            onClick={() => {
              if (!isOwnerUnlocked) {
                setIsPinModalOpen(true);
                return;
              }
              setShowBulkUploadModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-2.5 rounded-2xl text-xs shadow-md transition flex items-center gap-1.5 touch-target active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>{language === 'ta' ? '📦 50 பொருட்கள் சேர்' : '📦 Bulk Add 50'}</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="bg-brand-600 hover:bg-brand-500 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-md transition flex items-center gap-1.5 touch-target active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{language === 'ta' ? '+ புதிய பொருள்' : '+ Add Item'}</span>
          </button>
        </div>
      </div>

      {/* Action Bar: Search & Bulk Change */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            placeholder={language === 'ta' ? 'பொருளைத் தேடுக...' : 'Search items...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-slate-200 text-sm focus:outline-none focus:border-brand-500 shadow-sm"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              if (!isOwnerUnlocked) {
                setIsPinModalOpen(true);
                return;
              }
              setShowBulkUploadModal(true);
            }}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold px-3 py-2.5 rounded-2xl text-xs shadow-sm flex items-center justify-center gap-1.5 transition touch-target"
          >
            <Upload className="w-4 h-4 text-emerald-700" />
            <span>{language === 'ta' ? 'மொத்தப் பதிவேற்றம் (50)' : 'Bulk Upload (50)'}</span>
          </button>

          <button
            onClick={() => {
              if (!isOwnerUnlocked) {
                setIsPinModalOpen(true);
                return;
              }
              setShowBulkModal(true);
            }}
            className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold px-3 py-2.5 rounded-2xl text-xs shadow-sm flex items-center justify-center gap-1.5 transition touch-target"
          >
            <TrendingUp className="w-4 h-4 text-amber-700" />
            <span>{language === 'ta' ? 'விலை மாற்றம்' : 'Price Update'}</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition touch-target ${
            selectedCategory === 'all'
              ? 'bg-brand-700 text-white shadow-md'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          {language === 'ta' ? 'அனைத்தும்' : 'All'} ({items.length})
        </button>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition touch-target ${
              selectedCategory === cat
                ? 'bg-brand-700 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat} ({items.filter(i => i.category === cat).length})
          </button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {filteredItems.map(item => (
          <div
            key={item.id}
            className={`bg-white rounded-2xl p-4 border transition-all duration-200 shadow-sm relative ${
              !item.available
                ? 'opacity-60 border-slate-200 bg-slate-50'
                : 'border-slate-200 hover:border-amber-400 hover:shadow-md'
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2.5">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.nameTa}
                    className="w-12 h-12 rounded-2xl object-cover border border-amber-300 flex-shrink-0 shadow-sm"
                  />
                ) : (
                  <span className="text-3xl p-2 rounded-2xl bg-amber-50 border border-amber-100 flex-shrink-0">
                    {item.emoji}
                  </span>
                )}
                <div>
                  <h4 className="font-tamil-varthagam font-bold text-base text-slate-900 leading-tight">
                    {language === 'ta' ? item.nameTa : item.nameEn}
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    {language === 'ta' ? item.nameEn : item.nameTa} • {item.category}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <button
                onClick={() => {
                  if (!isOwnerUnlocked) {
                    setIsPinModalOpen(true);
                    return;
                  }
                  toggleItemAvailable(item.id);
                  feedback.vibrate(30);
                }}
                className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 transition ${
                  item.available
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {item.available ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{language === 'ta' ? 'விற்பனையில்' : 'Available'}</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3" />
                    <span>{language === 'ta' ? 'தீர்ந்தது' : 'Sold Out'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Price & Action Row */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-2">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                  {language === 'ta' ? 'விலை' : 'Price'}
                </span>
                <span className="font-extrabold text-xl text-brand-700 font-display">
                  {formatPaise(item.pricePaise)}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {/* 1-Tap Quick Price Changer */}
                <button
                  onClick={() => handleOpenQuickPrice(item)}
                  className="bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold px-2.5 py-1.5 rounded-xl text-xs border border-amber-200 transition flex items-center gap-1 touch-target"
                  title="Quick Price Edit"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                  <span>{language === 'ta' ? 'விலை மாற்று' : 'Price'}</span>
                </button>

                {/* Full Edit */}
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition touch-target"
                  title="Edit details"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(item)}
                  className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition touch-target"
                  title="Delete item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <div className="text-center py-12 bg-white rounded-3xl border border-slate-200 p-6">
          <Coffee className="w-12 h-12 text-slate-300 mx-auto mb-2" />
          <h4 className="font-bold text-slate-700">
            {language === 'ta' ? 'பொருட்கள் எதுவும் காணப்படவில்லை' : 'No items found'}
          </h4>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'ta'
              ? 'புதிய பொருளை சேர்க்க "+ புதிய பொருள்" பொத்தானை அழுத்தவும்.'
              : 'Tap "+ Add Item" to create your first menu item.'}
          </p>
        </div>
      )}

      {/* QUICK 1-TAP PRICE EDIT MODAL */}
      {showQuickPriceModal && quickPriceItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-amber-300">
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-xs text-amber-700 font-bold uppercase tracking-wider">
                  {language === 'ta' ? 'விரைவு விலை மாற்றம்' : 'Quick Price Change'}
                </span>
                <h3 className="font-tamil-varthagam font-black text-xl text-slate-900 mt-0.5">
                  {quickPriceItem.emoji} {language === 'ta' ? quickPriceItem.nameTa : quickPriceItem.nameEn}
                </h3>
              </div>
              <button
                onClick={() => setShowQuickPriceModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full touch-target"
              >
                ✕
              </button>
            </div>

            {/* Big Price Display */}
            <div className="my-5 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-center">
              <span className="text-xs text-slate-500 font-bold">
                {language === 'ta' ? 'புதிய விலை (New Price)' : 'New Price'}
              </span>
              <div className="text-4xl font-black text-brand-800 font-display mt-1">
                ₹{quickRupees.toFixed(2)}
              </div>
            </div>

            {/* Quick Increment / Decrement Step Buttons */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setQuickRupees(prev => Math.max(1, prev - 1))}
                className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm touch-target"
              >
                - ₹1
              </button>
              <button
                type="button"
                onClick={() => setQuickRupees(prev => prev + 1)}
                className="py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-sm touch-target"
              >
                + ₹1
              </button>
              <button
                type="button"
                onClick={() => setQuickRupees(prev => prev + 2)}
                className="py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-sm touch-target"
              >
                + ₹2
              </button>
              <button
                type="button"
                onClick={() => setQuickRupees(prev => prev + 5)}
                className="py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-sm touch-target"
              >
                + ₹5
              </button>
            </div>

            {/* Custom Input */}
            <div className="mb-5">
              <label className="text-xs font-bold text-slate-600 block mb-1">
                {language === 'ta' ? 'அல்லது நேரடியாக உள்ளிடவும் (₹):' : 'Or enter exact price (₹):'}
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                value={quickRupees}
                onChange={e => setQuickRupees(parseFloat(e.target.value) || 0)}
                className="w-full p-3 text-lg font-bold rounded-xl border border-slate-300 focus:border-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowQuickPriceModal(false)}
                className="w-1/3 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs touch-target"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={handleSaveQuickPrice}
                className="w-2/3 py-3 rounded-xl bg-gold-gradient text-slate-950 font-black text-xs shadow-gold-sm hover:brightness-105 transition flex items-center justify-center gap-1.5 touch-target"
              >
                <Check className="w-4 h-4" />
                <span>{language === 'ta' ? 'விலை உறுதிசெய்' : 'Update Price'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL ADD / EDIT ITEM MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-tamil-varthagam font-black text-lg text-slate-900">
                {editingItem
                  ? language === 'ta'
                    ? 'பொருள் திருத்துக'
                    : 'Edit Item'
                  : language === 'ta'
                  ? 'புதிய பொருள் சேர்க்க'
                  : 'Add New Item'}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full touch-target"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="space-y-4">
              {/* Emoji Selector */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  {language === 'ta' ? 'சின்னம் (Icon / Emoji)' : 'Item Icon'}
                </label>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {emojiOptions.map(em => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setEmoji(em)}
                      className={`text-2xl p-2 rounded-xl border transition touch-target ${
                        emoji === em
                          ? 'bg-amber-100 border-amber-500 scale-110 shadow-sm'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Names */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  {language === 'ta' ? 'பொருள் பெயர் (தமிழ்)' : 'Item Name (Tamil)'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="எ.கா: மசால் தோசை"
                  value={nameTa}
                  onChange={e => setNameTa(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 font-bold focus:border-brand-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  {language === 'ta' ? 'பொருள் பெயர் (ஆங்கிலம்)' : 'Item Name (English)'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Masala Dosa"
                  value={nameEn}
                  onChange={e => setNameEn(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:outline-none"
                />
              </div>

              {/* Category & Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    {language === 'ta' ? 'பிரிவு' : 'Category'}
                  </label>
                  <input
                    type="text"
                    list="catList"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 focus:border-brand-500 focus:outline-none text-sm"
                  />
                  <datalist id="catList">
                    {categories.map(c => (
                      <option key={c} value={c} />
                    ))}
                    <option value="Hot Drinks" />
                    <option value="Tiffin" />
                    <option value="Snacks" />
                    <option value="Meals" />
                    <option value="Packaged" />
                  </datalist>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    {language === 'ta' ? 'விலை (₹)' : 'Price (₹)'} *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    required
                    value={priceRupees}
                    onChange={e => setPriceRupees(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 font-black text-brand-700 focus:border-brand-500 focus:outline-none text-lg"
                  />
                </div>
              </div>

              {/* Morning Only Checkbox */}
              <label className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={morningOnly}
                  onChange={e => setMorningOnly(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded"
                />
                <span className="text-xs font-bold text-slate-700">
                  {language === 'ta'
                    ? 'காலை நேர டிபன் மட்டும் (Morning Only)'
                    : 'Available in morning hours only'}
                </span>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/3 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs touch-target"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 rounded-xl bg-brand-700 hover:bg-brand-800 text-white font-bold text-xs shadow-md transition touch-target"
                >
                  {editingItem
                    ? language === 'ta'
                      ? 'மாற்றங்களை சேமிக்க'
                      : 'Save Changes'
                    : language === 'ta'
                    ? 'பொருள் சேர்'
                    : 'Create Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK PRICE UPDATE MODAL */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-amber-300">
            <h3 className="font-tamil-varthagam font-black text-lg text-slate-900 mb-2">
              {language === 'ta' ? 'ஒட்டுமொத்த விலை உயர்வு' : 'Bulk Price Increase'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {language === 'ta'
                ? 'பால் அல்லது கேஸ் விலை ஏறும் போது ஒரே கிளிக்கில் அனைத்து பொருட்களின் விலையையும் உயர்த்தலாம்.'
                : 'Instantly adjust prices for all items in a category following input cost hikes.'}
            </p>

            <form onSubmit={handleBulkUpdate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  {language === 'ta' ? 'பிரிவு தேர்ந்தெடுக்கவும்' : 'Select Category'}
                </label>
                <select
                  value={bulkCategory}
                  onChange={e => setBulkCategory(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 font-bold text-sm"
                >
                  <option value="all">
                    {language === 'ta' ? 'அனைத்து பொருட்கள் (All Items)' : 'All Items'}
                  </option>
                  {categories.map(c => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  {language === 'ta' ? 'உயர்த்த வேண்டிய தொகை (₹)' : 'Increase Amount (₹)'}
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {['1', '2', '5'].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setBulkIncreaseRupees(val)}
                      className={`py-2 rounded-xl font-bold text-sm border touch-target ${
                        bulkIncreaseRupees === val
                          ? 'bg-amber-100 border-amber-500 text-amber-900'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      + ₹{val}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  step="0.5"
                  required
                  value={bulkIncreaseRupees}
                  onChange={e => setBulkIncreaseRupees(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 font-black text-brand-700"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkModal(false)}
                  className="w-1/3 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs touch-target"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 rounded-xl bg-gold-gradient text-slate-950 font-black text-xs shadow-gold-sm hover:brightness-105 transition flex items-center justify-center gap-1.5 touch-target"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>{language === 'ta' ? 'விலைகளை உயர்த்து' : 'Apply Bulk Increase'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PIN Unlock Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        titleTa="பொருட்கள் & விலை மாற்ற PIN"
        titleEn="Enter Owner PIN for Menu & Prices"
        descriptionTa="பொருட்களை சேர்க்கவோ அல்லது விலையை மாற்றவோ உங்கள் 4 இலக்க PIN எண்ணை உள்ளிடவும்."
        descriptionEn="Enter your 4-digit secret PIN to add items or adjust prices."
        onSuccess={() => {
          setIsPinModalOpen(false);
          feedback.playPaymentSuccessTone();
        }}
        onCancel={() => setIsPinModalOpen(false)}
      />

      {/* Bulk Item Upload Modal (Up to 50 Items) */}
      <BulkItemUploadModal
        isOpen={showBulkUploadModal}
        onClose={() => setShowBulkUploadModal(false)}
      />
    </div>
  );
};

// KeyIcon helper for modern badge
function KeyIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </svg>
  );
}
