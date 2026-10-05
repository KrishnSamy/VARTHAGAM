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
  Mic,
  Sparkles,
  Download,
  X,
  FileText,
  Loader2,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { db, MenuItem, OrderItemLine, OrderBill } from '../../db/db';
import { formatPaise, paiseToRupees } from '../../lib/money';
import { feedback } from '../../lib/feedback';
import { VoiceBillingModal } from '../../components/VoiceBillingModal';
import { generateBillNumber } from '../../lib/billUtils';
import { generateLuxuryReceiptPdf } from '../../lib/luxuryPdf';
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
  const [lastCompletedOrder, setLastCompletedOrder] = useState<OrderBill | null>(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const handleDownloadPdf = async () => {
    if (!lastCompletedOrder) return;
    setIsGeneratingPdf(true);
    try {
      await generateLuxuryReceiptPdf(lastCompletedOrder, settings);
      feedback.playPaymentSuccessTone();
    } catch (e) {
      console.error('PDF error:', e);
      alert(language === 'ta' ? 'PDF உருவாக்கம் தோல்வி. மீண்டும் முயற்சிக்கவும்.' : 'Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

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

  const handleAddVoiceItems = (voiceItems: { id: string; qty: number }[]) => {
    setCart(prev => {
      const copy = { ...prev };
      for (const v of voiceItems) {
        copy[v.id] = (copy[v.id] || 0) + v.qty;
      }
      return copy;
    });
  };

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
      const billNumber = generateBillNumber(settings?.shopCode, tokenNumber);

      const newOrder: OrderBill = {
        id: `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        tokenNumber,
        billNumber,
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
      setShowReceiptModal(true);
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

      {/* AI Voice Billing Banner */}
      <div className="mb-4 bg-gradient-to-r from-brand-900 via-rose-950 to-slate-900 border border-amber-500/30 rounded-3xl p-3.5 sm:p-4 text-white flex items-center justify-between gap-3 shadow-crimson-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowVoiceModal(true)}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-gold-sm hover:scale-105 active:scale-95 transition touch-target flex-shrink-0 animate-pulse"
          >
            <Mic className="w-6 h-6" />
          </button>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-tamil-varthagam font-black text-sm sm:text-base text-amber-300">
                {language === 'ta' ? '🎤 AI உள்ளூர் குரல் பில்லிங்' : '🎤 AI Local Voice Billing'}
              </span>
              <span className="text-[10px] bg-rose-500/30 text-rose-300 px-2 py-0.5 rounded-full font-bold border border-rose-500/40">
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-slate-300 line-clamp-1">
              {language === 'ta'
                ? 'டீ, காபி, வடை என தமிழில் பேசினால் நொடியில் பில் போடலாம்!'
                : 'Speak food items in Tamil to auto-add to bill in milliseconds!'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowVoiceModal(true)}
          className="bg-gold-gradient text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs shadow-gold-sm hover:brightness-105 transition flex items-center gap-1.5 touch-target flex-shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{language === 'ta' ? 'பேசுக' : 'Speak'}</span>
        </button>
      </div>

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
                <div className="flex justify-center mb-1.5">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.nameTa}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-amber-300 shadow-sm"
                    />
                  ) : (
                    <div className="text-3xl sm:text-4xl py-1">{item.emoji || '🍽️'}</div>
                  )}
                </div>
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
        <div className="fixed bottom-[3.6rem] sm:bottom-16 left-0 right-0 p-2.5 sm:p-3 bg-slate-900/95 backdrop-blur-md border-t border-amber-500/30 shadow-2xl z-30 max-w-5xl mx-auto text-white animate-in slide-in-from-bottom">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] sm:text-[11px] bg-amber-400/20 text-amber-300 border border-amber-400/30 font-bold px-2 py-0.5 rounded-full">
                  {cartLines.reduce((s, i) => s + i.qty, 0)} {language === 'ta' ? 'பொருட்கள்' : 'items'}
                </span>
                <button
                  onClick={clearCart}
                  className="text-[10px] sm:text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-0.5 underline"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>{t.clearCart}</span>
                </button>
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-300 font-display mt-0.5">
                {formatPaise(totalPaise)}
              </div>
            </div>

            {/* Quick Cash & UPI Actions */}
            <div className="flex gap-1.5 sm:gap-2">
              <button
                onClick={() => handleCheckout('cash')}
                disabled={subscription?.isReadOnly}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl shadow-md flex items-center gap-1 touch-target active:scale-95 disabled:opacity-50 text-xs sm:text-sm"
              >
                <Banknote className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-black">{language === 'ta' ? 'ரொக்கம்' : 'Cash'}</span>
              </button>

              <button
                onClick={() => handleCheckout('upi')}
                disabled={subscription?.isReadOnly}
                className="bg-gold-gradient text-slate-950 font-black px-3 py-2.5 sm:px-4 sm:py-3 rounded-2xl shadow-gold-sm hover:brightness-105 flex items-center gap-1 touch-target active:scale-95 disabled:opacity-50 text-xs sm:text-sm"
              >
                <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>UPI QR</span>
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

      {/* AI Voice Billing Modal */}
      <VoiceBillingModal
        isOpen={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        menuItems={items}
        onAddItemsToCart={handleAddVoiceItems}
        language={language}
      />

      {/* Completed Bill Luxury Receipt Modal */}
      {showReceiptModal && lastCompletedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border-2 border-amber-400 p-6 shadow-2xl text-white relative">
            <button
              onClick={() => setShowReceiptModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-white/10"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center mb-4">
              <span className="text-[11px] font-bold text-amber-300 uppercase tracking-widest bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
                {language === 'ta' ? 'அதிகாரப்பூர்வ பில்' : 'Official Receipt'}
              </span>
              <h3 className="font-tamil-varthagam font-black text-xl text-white mt-2">
                {settings?.name || 'Varthagam'}
              </h3>
              <p className="text-xs font-mono text-amber-300">
                {language === 'ta' ? 'பில் எண்:' : 'Bill No:'}{' '}
                <span className="font-bold text-white">
                  {lastCompletedOrder.billNumber || generateBillNumber(settings?.shopCode, lastCompletedOrder.tokenNumber)}
                </span>
              </p>
            </div>

            {/* Token Badge */}
            <div className="bg-slate-950 border border-amber-500/40 rounded-2xl p-3 text-center my-3 shadow-inner">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                {language === 'ta' ? 'டோக்கன் எண்' : 'TOKEN'}
              </span>
              <div className="text-4xl font-black text-amber-400 font-mono">
                {lastCompletedOrder.tokenNumber}
              </div>
            </div>

            {/* Items list */}
            <div className="bg-white/5 rounded-2xl p-3 max-h-40 overflow-y-auto space-y-1.5 my-3 text-xs">
              {lastCompletedOrder.items.map((line, idx) => (
                <div key={idx} className="flex justify-between text-slate-200">
                  <span>{line.nameTa} × {line.qty}</span>
                  <span className="font-mono font-bold text-amber-200">{formatPaise(line.totalPaise)}</span>
                </div>
              ))}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center py-2 border-t border-white/10 text-sm">
              <span className="text-slate-300">{language === 'ta' ? 'மொத்தம்' : 'Total'}:</span>
              <span className="text-xl font-black text-amber-400 font-display">
                {formatPaise(lastCompletedOrder.totalPaise)}
              </span>
            </div>

            {/* Actions: Download Luxury PDF / Next Bill */}
            <div className="space-y-2 mt-4">
              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="w-full bg-gold-gradient text-slate-950 font-black py-3 rounded-xl shadow-gold-sm hover:brightness-105 active:scale-95 transition flex items-center justify-center gap-2 text-xs touch-target disabled:opacity-60"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>{language === 'ta' ? 'PDF தயாராகிறது...' : 'Generating PDF...'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-slate-950" />
                    <span>{language === 'ta' ? '📄 ஆடம்பர பில் PDF பதிவிறக்கு' : 'Download Luxury PDF'}</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setShowReceiptModal(false)}
                className="w-full bg-white/10 hover:bg-white/15 text-slate-200 font-bold py-2.5 rounded-xl transition text-xs touch-target"
              >
                {language === 'ta' ? 'அடுத்த பில் போடவும்' : 'Next Bill'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
