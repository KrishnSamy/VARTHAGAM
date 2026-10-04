import React, { useState } from 'react';
import {
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  QrCode,
  Banknote,
  Share2,
  Printer,
  AlertTriangle,
  ShoppingBag,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { db, MenuItem, OrderItemLine } from '../../db/db';
import { formatPaise, paiseToRupees } from '../../lib/money';
import { feedback } from '../../lib/feedback';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';

export const BillingView: React.FC = () => {
  const {
    items,
    settings,
    language,
    t,
    getNextTokenNumber,
    refreshShopData,
    subscription,
  } = useShop();

  const [cart, setCart] = useState<Record<string, number>>({});
  const [payMode, setPayMode] = useState<'cash' | 'upi'>('cash');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string>('');
  const [lastCompletedOrder, setLastCompletedOrder] = useState<any | null>(null);

  // Categories
  const categories = ['all', ...Array.from(new Set(items.map(i => i.category)))];

  const filteredItems = items.filter(
    item => activeCategory === 'all' || item.category === activeCategory
  );

  const addToCart = (itemId: string) => {
    if (subscription?.isReadOnly) return;
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1,
    }));
    feedback.vibrate(40);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const current = prev[itemId] || 0;
      if (current <= 1) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: current - 1 };
    });
    feedback.vibrate(25);
  };

  const clearCart = () => {
    setCart({});
  };

  // Calculate cart total in paise
  const cartLines: OrderItemLine[] = Object.entries(cart)
    .map(([itemId, qty]) => {
      const item = items.find(i => i.id === itemId);
      if (!item) return null;
      return {
        itemId: item.id,
        nameTa: item.nameTa,
        nameEn: item.nameEn,
        pricePaise: item.pricePaise,
        qty,
        totalPaise: item.pricePaise * qty,
      };
    })
    .filter((l): l is OrderItemLine => l !== null);

  const totalPaise = cartLines.reduce((sum, line) => sum + line.totalPaise, 0);

  const handleCheckout = async (chosenPayMode: 'cash' | 'upi') => {
    if (cartLines.length === 0 || subscription?.isReadOnly) return;

    if (chosenPayMode === 'upi') {
      const token = await getNextTokenNumber();
      const amountRupees = paiseToRupees(totalPaise).toFixed(2);
      const upiUrl = `upi://pay?pa=${settings?.upiId || 'shop@upi'}&pn=${encodeURIComponent(
        settings?.name || 'Varthagam'
      )}&am=${amountRupees}&cu=INR&tn=${encodeURIComponent(`Bill ${token}`)}&tr=VT${Date.now()}`;

      const qr = await QRCode.toDataURL(upiUrl, { width: 280, margin: 2 });
      setUpiQrDataUrl(qr);
      setPayMode('upi');
      setShowUpiModal(true);
      return;
    }

    await finalizeSale('cash');
  };

  const finalizeSale = async (confirmedPayMode: 'cash' | 'upi') => {
    try {
      const tokenNumber = await getNextTokenNumber();
      const todayStr = new Date().toISOString().split('T')[0];

      const newOrder = {
        id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tokenNumber,
        items: cartLines,
        totalPaise,
        payMode: confirmedPayMode,
        state: 'served' as const,
        source: 'counter' as const,
        dateKey: todayStr,
        createdAt: Date.now(),
      };

      await db.orders.put(newOrder);

      feedback.playPaymentSuccessTone();
      feedback.vibrate(100);

      try {
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#f59e0b', '#dc2626', '#10b981'],
        });
      } catch (err) {}

      setLastCompletedOrder(newOrder);
      setCart({});
      setShowUpiModal(false);
      await refreshShopData();
    } catch (e: any) {
      alert(`Sale error: ${e.message}`);
    }
  };

  return (
    <div className="pb-36 max-w-5xl mx-auto px-2 sm:px-4 animate-in fade-in">
      {/* Subscription Read-Only Warning */}
      {subscription?.isReadOnly && (
        <div className="p-3 mb-4 bg-amber-500/10 border border-amber-500/40 rounded-2xl flex items-center gap-2 text-amber-200 text-xs font-bold shadow-sm">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            {language === 'ta'
              ? 'சந்தா காலம் முடிந்தது. புதிய பில் போட சந்தாவை புதுப்பிக்கவும்.'
              : 'Subscription expired. Read-only mode active. Renew subscription to create bills.'}
          </span>
        </div>
      )}

      {/* Category Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 touch-target ${
              activeCategory === cat
                ? 'bg-gradient-to-r from-brand-700 to-brand-800 text-amber-200 shadow-crimson-md border border-amber-400/40'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {cat === 'all' ? (language === 'ta' ? 'அனைத்தும்' : 'All') : cat}
          </button>
        ))}
      </div>

      {/* Menu Item Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 sm:gap-3">
        {filteredItems.map(item => {
          const inCartCount = cart[item.id] || 0;
          const isSoldOut = !item.available;

          return (
            <div
              key={item.id}
              onClick={() => !isSoldOut && addToCart(item.id)}
              className={`relative bg-white rounded-2xl p-3 border transition-all duration-200 shadow-sm flex flex-col justify-between cursor-pointer select-none ${
                isSoldOut
                  ? 'opacity-50 grayscale border-slate-200 cursor-not-allowed bg-slate-50'
                  : inCartCount > 0
                  ? 'border-brand-600 bg-brand-50/40 shadow-crimson-md ring-2 ring-brand-500/30'
                  : 'border-slate-200 hover:border-amber-400 hover:shadow-md'
              }`}
            >
              {/* In-cart count badge */}
              <div className="flex justify-between items-start mb-1 h-6">
                {inCartCount > 0 ? (
                  <span className="w-6 h-6 rounded-full bg-brand-700 text-white font-black text-xs flex items-center justify-center shadow-sm">
                    {inCartCount}
                  </span>
                ) : (
                  <span />
                )}
              </div>

              {/* Item Content */}
              <div className="text-center py-1">
                <div className="text-3xl sm:text-4xl mb-1.5">{item.emoji || '🍽️'}</div>
                <h4 className="font-tamil-varthagam font-bold text-slate-800 text-sm leading-tight line-clamp-2">
                  {language === 'ta' ? item.nameTa : item.nameEn}
                </h4>
                <div className="text-base sm:text-lg font-black text-brand-800 font-display mt-1">
                  {formatPaise(item.pricePaise)}
                </div>
              </div>

              {/* Action Buttons */}
              {isSoldOut ? (
                <div className="mt-2 text-center py-1.5 bg-slate-100 rounded-xl text-[11px] font-bold text-slate-500">
                  {t.soldOut}
                </div>
              ) : inCartCount > 0 ? (
                <div
                  className="mt-2 flex items-center justify-between bg-white border border-brand-200 rounded-xl p-0.5 shadow-sm"
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center active:scale-95 touch-target"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-extrabold text-sm text-brand-900 px-1">
                    {inCartCount}
                  </span>
                  <button
                    onClick={() => addToCart(item.id)}
                    className="w-8 h-8 rounded-lg bg-brand-700 hover:bg-brand-800 text-white flex items-center justify-center active:scale-95 touch-target"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="mt-2 w-full py-1.5 bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-brand-800 text-xs font-bold rounded-xl border border-slate-100 flex items-center justify-center gap-1 transition">
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t.addToCart}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating Bottom Cart Bar */}
      {cartLines.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 p-3 bg-slate-900/95 backdrop-blur-md border-t border-amber-500/30 shadow-2xl z-30 max-w-5xl mx-auto text-white animate-in slide-in-from-bottom">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold px-2 py-0.5 rounded-full">
                  {cartLines.reduce((s, i) => s + i.qty, 0)} {language === 'ta' ? 'பொருட்கள்' : 'items'}
                </span>
                <button
                  onClick={clearCart}
                  className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-0.5 underline"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{t.clearCart}</span>
                </button>
              </div>
              <div className="text-2xl font-black text-amber-300 font-display mt-0.5">
                {formatPaise(totalPaise)}
              </div>
            </div>

            {/* Quick Cash & UPI Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleCheckout('cash')}
                disabled={subscription?.isReadOnly}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-3 rounded-2xl shadow-md flex items-center gap-1.5 touch-target active:scale-95 disabled:opacity-50"
              >
                <Banknote className="w-5 h-5" />
                <span className="text-sm font-black">{language === 'ta' ? 'ரொக்கம்' : 'Cash'}</span>
              </button>

              <button
                onClick={() => handleCheckout('upi')}
                disabled={subscription?.isReadOnly}
                className="bg-gold-gradient text-slate-950 font-black px-4 py-3 rounded-2xl shadow-gold-sm hover:brightness-105 flex items-center gap-1.5 touch-target active:scale-95 disabled:opacity-50"
              >
                <QrCode className="w-5 h-5" />
                <span className="text-sm">UPI QR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPI QR Display Modal */}
      {showUpiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center border border-amber-300">
            <h3 className="font-tamil-varthagam font-extrabold text-lg text-slate-900 mb-1">
              {language === 'ta' ? 'வாடிக்கையாளர் UPI QR' : 'Customer UPI QR'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Google Pay • PhonePe • Paytm • BHIM
            </p>

            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 inline-block mb-4">
              {upiQrDataUrl && (
                <img
                  src={upiQrDataUrl}
                  alt="UPI QR"
                  className="w-56 h-56 mx-auto rounded-xl"
                />
              )}
            </div>

            <div className="text-3xl font-black text-brand-800 font-display mb-1">
              {formatPaise(totalPaise)}
            </div>
            <p className="text-[11px] font-mono text-slate-400 mb-4">{settings?.upiId}</p>

            <div className="space-y-2">
              <button
                onClick={() => finalizeSale('upi')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 touch-target text-sm"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>
                  {language === 'ta'
                    ? 'பணம் பெறப்பட்டது (Confirm Received)'
                    : 'Payment Received'}
                </span>
              </button>

              <button
                onClick={() => setShowUpiModal(false)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition touch-target text-xs"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
