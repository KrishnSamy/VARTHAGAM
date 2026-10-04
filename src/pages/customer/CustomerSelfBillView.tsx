import React, { useState, useEffect } from 'react';
import {
  Plus,
  Minus,
  CheckCircle,
  QrCode,
  Banknote,
  Clock,
  ArrowLeft,
  ExternalLink,
  AlertCircle,
  Copy,
  Sparkles,
  ShoppingBag,
  RotateCcw,
  UtensilsCrossed,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import { db, MenuItem } from '../../db/db';
import { formatPaise, paiseToRupees } from '../../lib/money';
import { feedback } from '../../lib/feedback';
import { relay, RelayPublicShop } from '../../lib/relay';
import { VarthagamLogo } from '../../components/VarthagamLogo';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';

interface Props {
  shopCode: string;
}

export const CustomerSelfBillView: React.FC<Props> = ({ shopCode }) => {
  const [shopPublic, setShopPublic] = useState<RelayPublicShop | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [orderState, setOrderState] = useState<
    'browsing' | 'review' | 'paying_upi' | 'paying_cash' | 'waiting_owner' | 'confirmed' | 'offline_counter'
  >('browsing');
  const [payMode, setPayMode] = useState<'cash' | 'upi'>('upi');
  const [generatedToken, setGeneratedToken] = useState<string>('');
  const [generatedBillId, setGeneratedBillId] = useState<string>('');
  const [upiQrUrl, setUpiQrUrl] = useState<string>('');
  const [upiDeepLink, setUpiDeepLink] = useState<string>('');
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [language, setLanguage] = useState<'ta' | 'en'>('ta');
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [resetCountdown, setResetCountdown] = useState<number>(45);

  useEffect(() => {
    loadShopAndMenu();
  }, [shopCode]);

  const loadShopAndMenu = async () => {
    // 1. Try local DB first (for same-device Kiosk Mode)
    const localShop = await db.settings.get('current_shop');
    if (localShop && localShop.shopCode.toUpperCase() === shopCode.toUpperCase()) {
      setShopPublic({
        code: localShop.shopCode,
        name: localShop.name,
        upiId: localShop.upiId,
        selfBillOpen: localShop.isSelfBillOpen !== false,
        activeUntil: localShop.activeUntil || Date.now() + 86400000,
        menuVersion: 1,
      });
      const localItems = await db.items.toArray();
      setItems(localItems);
      return;
    }

    // 2. Fetch from Cloud Relay (Firebase RTDB via REST)
    if (relay.isAvailable()) {
      const pub = await relay.getShopPublic(shopCode);
      if (pub) {
        setShopPublic(pub);
        if (!pub.selfBillOpen || pub.activeUntil < Date.now()) {
          setOrderState('offline_counter');
          return;
        }
        const cloudMenu = await relay.getMenu(shopCode);
        if (cloudMenu) {
          setItems(
            cloudMenu.map((m: any, idx: number) => ({
              id: m.id,
              nameTa: m.nameTa,
              nameEn: m.nameEn,
              pricePaise: m.pricePaise,
              category: m.category,
              emoji: m.emoji,
              available: m.available,
              morningOnly: m.morningOnly,
              sortOrder: idx,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            }))
          );
        }
      } else {
        setOrderState('offline_counter');
      }
    } else {
      setOrderState('offline_counter');
    }
  };

  const addToCart = (itemId: string) => {
    setCart(prev => {
      const cur = prev[itemId] || 0;
      if (cur >= 25) return prev;
      return { ...prev, [itemId]: cur + 1 };
    });
    feedback.vibrate(35);
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const cur = prev[itemId] || 0;
      if (cur <= 1) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: cur - 1 };
    });
    feedback.vibrate(25);
  };

  const cartLines = Object.entries(cart)
    .map(([itemId, qty]) => {
      const item = items.find(i => i.id === itemId);
      if (!item) return null;
      return {
        itemId,
        nameTa: item.nameTa,
        nameEn: item.nameEn,
        pricePaise: item.pricePaise,
        qty,
        totalPaise: item.pricePaise * qty,
      };
    })
    .filter(Boolean) as Array<{
    itemId: string;
    nameTa: string;
    nameEn: string;
    pricePaise: number;
    qty: number;
    totalPaise: number;
  }>;

  const totalPaise = cartLines.reduce((acc, curr) => acc + curr.totalPaise, 0);

  // Category list
  const categoryKeys = ['all', ...Array.from(new Set(items.map(i => i.category)))];
  const filteredItems = items.filter(
    item => activeCategory === 'all' || item.category === activeCategory
  );

  const getCategoryLabel = (cat: string) => {
    if (cat === 'all') return language === 'ta' ? '🌟 அனைத்தும்' : '🌟 All Items';
    if (cat === 'tea' || cat === 'drinks') return language === 'ta' ? '☕ டீ & பானங்கள்' : '☕ Tea & Drinks';
    if (cat === 'tiffin') return language === 'ta' ? '🥞 இட்லி & டிபன்' : '🥞 Tiffin & Idly';
    if (cat === 'snacks') return language === 'ta' ? '🧆 வடை & பஜ்ஜி' : '🧆 Vadai & Snacks';
    return cat;
  };

  const startCheckout = async (mode: 'cash' | 'upi') => {
    setPayMode(mode);

    if (mode === 'upi') {
      const rupees = paiseToRupees(totalPaise).toFixed(2);
      const shopUpi = shopPublic?.upiId || 'shopowner@upi';
      const shopName = shopPublic?.name || 'Varthagam Stall';
      const deepLink = `upi://pay?pa=${shopUpi}&pn=${encodeURIComponent(
        shopName
      )}&am=${rupees}&cu=INR&tn=${encodeURIComponent('Varthagam Food Order')}&tr=VTK${Date.now()}`;

      setUpiDeepLink(deepLink);
      const qrData = await QRCode.toDataURL(deepLink, {
        width: 320,
        margin: 2,
        color: { dark: '#1e1b4b', light: '#ffffff' },
      });
      setUpiQrUrl(qrData);
      setOrderState('paying_upi');
    } else {
      setOrderState('paying_cash');
    }
  };

  const copyUpiId = () => {
    if (shopPublic?.upiId) {
      navigator.clipboard.writeText(shopPublic.upiId);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
      feedback.vibrate(40);
    }
  };

  // Submit order for Shop Owner approval (NO bill or token generated yet!)
  const handleCustomerSubmitForApproval = async () => {
    const payloadItems = cartLines.map(l => ({ id: l.itemId, qty: l.qty }));
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // If local shop exists on same device (Kiosk Mode)
    const localShop = await db.settings.get('current_shop');
    if (localShop) {
      await db.orders.put({
        id: orderId,
        tokenNumber: 'சரிபார்க்கிறது...', // Pending approval
        items: cartLines,
        totalPaise,
        payMode,
        state: 'pending',
        source: 'kiosk',
        createdAt: Date.now(),
        dateKey: new Date().toISOString().split('T')[0],
      });

      setCurrentOrderId(orderId);
      setOrderState('waiting_owner');
      startPollingOrderStatus(orderId, true);
      return;
    }

    // Otherwise push via cloud relay
    if (relay.isAvailable()) {
      const cloudOrderId = await relay.submitOrder(shopCode, {
        token: 'சரிபார்க்கிறது...',
        items: JSON.stringify(payloadItems),
        payMode,
        state: 'pending' as const,
        createdAt: Date.now(),
        totalPaise,
      });

      if (cloudOrderId) {
        setCurrentOrderId(cloudOrderId);
        setOrderState('waiting_owner');
        startPollingOrderStatus(cloudOrderId, false);
      } else {
        setOrderState('waiting_owner');
      }
    } else {
      setOrderState('waiting_owner');
    }
  };

  // Poll until shop owner clicks "Approve & Generate Bill"
  const startPollingOrderStatus = (orderId: string, isLocal: boolean) => {
    const interval = setInterval(async () => {
      if (isLocal) {
        const ord = await db.orders.get(orderId);
        if (ord && (ord.state === 'confirmed' || ord.state === 'served')) {
          clearInterval(interval);
          setGeneratedToken(ord.tokenNumber);
          setGeneratedBillId(ord.id);
          setOrderState('confirmed');
          feedback.playPaymentSuccessTone();
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      } else if (relay.isAvailable()) {
        const ord = await relay.pollOrder(shopCode, orderId);
        if (ord && (ord.state === 'confirmed' || ord.state === 'served')) {
          clearInterval(interval);
          setGeneratedToken(ord.token || 'T-OK');
          setGeneratedBillId(orderId);
          setOrderState('confirmed');
          feedback.playPaymentSuccessTone();
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
      }
    }, 2000);
  };

  // Auto reset timer on confirmed bill screen
  useEffect(() => {
    let timer: any;
    if (orderState === 'confirmed') {
      setResetCountdown(45);
      timer = setInterval(() => {
        setResetCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setCart({});
            setOrderState('browsing');
            return 45;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [orderState]);

  // Offline / Paused Screen
  if (orderState === 'offline_counter') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-brand-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/90 border border-amber-500/30 rounded-3xl shadow-gold-md p-8 text-center backdrop-blur-md">
          <div className="w-20 h-20 bg-amber-500/10 border border-amber-500/40 rounded-3xl flex items-center justify-center mx-auto mb-4 text-amber-400">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-black text-amber-200 font-tamil-varthagam mb-2">
            {language === 'ta' ? 'கவுண்டரில் பில் போடவும்' : 'Direct Counter Billing'}
          </h2>
          <p className="text-sm text-slate-300 mb-6 leading-relaxed">
            {language === 'ta'
              ? 'இந்த கடையில் தற்போது நேரடி கவுண்டர் விற்பனை மட்டுமே நடைபெறுகிறது. தயவுசெய்து கவுண்டரில் பணம் செலுத்தி உணவைப் பெறவும்.'
              : 'Self-billing is currently paused for this stall. Please place your order directly at the counter.'}
          </p>
          <div className="p-4 bg-brand-950/70 border border-amber-500/20 rounded-2xl text-amber-300 font-bold flex items-center justify-center gap-2">
            <VarthagamLogo size="sm" showSubtitle={false} />
            <span>{shopPublic?.name || 'வர்த்தகம் கடை'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950">
      {/* Ultra Modern Royal Header */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-brand-950 via-brand-900 to-slate-950 text-white px-4 py-3 shadow-crimson-md border-b border-amber-500/30">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <VarthagamLogo size="sm" showSubtitle={false} />
            <div className="h-6 w-[1px] bg-amber-500/30" />
            <div>
              <h1 className="font-tamil-varthagam font-black text-base sm:text-lg leading-tight text-amber-100">
                {shopPublic?.name || 'வர்த்தகம் கடை'}
              </h1>
              <p className="text-[11px] text-amber-400/80 font-bold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>{language === 'ta' ? 'வாடிக்கையாளர் சுய பில்லிங் (Self-Billing)' : 'Customer Self-Billing'}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => setLanguage(language === 'ta' ? 'en' : 'ta')}
            className="text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-xl border border-amber-500/40 transition touch-target"
          >
            {language === 'ta' ? 'English' : 'தமிழ்'}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-3xl mx-auto w-full p-3 sm:p-4 pb-36">
        {/* State 1: Browsing Menu */}
        {orderState === 'browsing' && (
          <div>
            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
              {categoryKeys.map(cat => (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat);
                    feedback.vibrate(20);
                  }}
                  className={`px-4 py-2 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition touch-target ${
                    activeCategory === cat
                      ? 'bg-gold-gradient text-slate-950 shadow-gold-sm font-black'
                      : 'bg-slate-900 text-slate-300 border border-slate-800 hover:border-amber-500/30'
                  }`}
                >
                  {getCategoryLabel(cat)}
                </button>
              ))}
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {filteredItems.map(item => {
                const qty = cart[item.id] || 0;
                const isSoldOut = !item.available;

                return (
                  <div
                    key={item.id}
                    className={`relative rounded-3xl p-3.5 sm:p-4 transition flex flex-col justify-between backdrop-blur-md ${
                      isSoldOut
                        ? 'opacity-40 bg-slate-900 border border-slate-800'
                        : qty > 0
                        ? 'bg-gradient-to-b from-brand-950/80 to-slate-900 border-2 border-amber-400 shadow-gold-sm'
                        : 'bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/40 shadow-sm'
                    }`}
                  >
                    <div>
                      {/* Food Icon with radiant circle */}
                      <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-amber-500/20 to-brand-700/20 border border-amber-500/30 flex items-center justify-center text-3xl mb-3 shadow-inner">
                        {item.emoji || '☕'}
                      </div>

                      <h3 className="font-tamil-varthagam font-bold text-slate-100 text-sm sm:text-base leading-tight">
                        {language === 'ta' ? item.nameTa : item.nameEn}
                      </h3>
                      {language === 'ta' && (
                        <p className="text-[11px] text-slate-400 font-medium">
                          {item.nameEn}
                        </p>
                      )}

                      <div className="mt-2 flex items-baseline gap-1">
                        <span className="text-xl sm:text-2xl font-black text-gold-gradient">
                          {formatPaise(item.pricePaise)}
                        </span>
                      </div>
                    </div>

                    {isSoldOut ? (
                      <div className="mt-3 text-center py-2 bg-slate-800/80 rounded-2xl text-xs font-bold text-slate-400">
                        {language === 'ta' ? 'தீர்ந்துவிட்டது' : 'Sold Out'}
                      </div>
                    ) : qty > 0 ? (
                      <div className="mt-3 flex items-center justify-between bg-slate-950/90 rounded-2xl p-1 border border-amber-400/50 shadow-inner">
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-200 flex items-center justify-center active:scale-95 touch-target transition"
                        >
                          <Minus className="w-5 h-5" />
                        </button>
                        <span className="font-black text-lg text-amber-300 font-mono">
                          {qty}
                        </span>
                        <button
                          onClick={() => addToCart(item.id)}
                          className="w-10 h-10 rounded-xl bg-gold-gradient text-slate-950 flex items-center justify-center font-bold active:scale-95 touch-target shadow-gold-sm transition"
                        >
                          <Plus className="w-5 h-5 text-slate-950" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(item.id)}
                        className="mt-3 w-full bg-gradient-to-r from-brand-900 to-rose-950 hover:brightness-110 text-amber-200 font-bold py-2.5 rounded-2xl transition text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 touch-target border border-amber-500/40 shadow-crimson-sm"
                      >
                        <Plus className="w-4 h-4 text-amber-300" />
                        <span>{language === 'ta' ? 'சேர்' : 'Add'}</span>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* State 2: Direct GPay / UPI Payment Screen */}
        {orderState === 'paying_upi' && (
          <div className="bg-slate-900/95 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-gold-md text-center max-w-lg mx-auto animate-in fade-in">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <button
                onClick={() => setOrderState('browsing')}
                className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-amber-300 touch-target"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{language === 'ta' ? 'பொருட்கள் மாற்ற' : 'Edit Cart'}</span>
              </button>
              <div className="text-xs font-bold text-amber-300 uppercase tracking-widest">
                Google Pay / UPI
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-1">
              {language === 'ta' ? 'செலுத்த வேண்டிய மொத்த தொகை' : 'Total Amount to Pay'}
            </p>
            <div className="text-4xl font-black text-gold-gradient my-1">
              {formatPaise(totalPaise)}
            </div>

            {/* Dynamic Direct UPI QR with GPay styling */}
            {upiQrUrl && (
              <div className="bg-white p-4 rounded-3xl border-4 border-amber-400/80 inline-block my-3 shadow-gold-md relative">
                <img src={upiQrUrl} alt="UPI QR" className="w-56 h-56 sm:w-64 sm:h-64 mx-auto rounded-xl" />
                <div className="mt-2 flex items-center justify-center gap-1 text-[11px] font-bold text-slate-900">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>Google Pay • PhonePe • Paytm • BHIM</span>
                </div>
              </div>
            )}

            {/* Direct GPay App Launcher button on mobile devices */}
            <div className="space-y-2 mt-2 mb-4">
              <a
                href={upiDeepLink}
                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 text-white font-black py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-sm shadow-lg hover:brightness-105 active:scale-95 touch-target"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{language === 'ta' ? 'Google Pay / PhonePe-ல் திறக்க' : 'Open in Google Pay / UPI'}</span>
              </a>

              {/* Shop UPI ID with Copy Button */}
              <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
                <span className="text-slate-400 font-mono">{shopPublic?.upiId}</span>
                <button
                  onClick={copyUpiId}
                  className="flex items-center gap-1 text-amber-300 font-bold hover:text-amber-200"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedUpi ? 'நகலெடுக்கப்பட்டது!' : 'Copy UPI'}</span>
                </button>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 mb-4 text-xs text-amber-200 text-left">
              <p className="font-bold mb-0.5">⚠️ முக்கியமான குறிப்பு:</p>
              <p className="text-slate-300">
                {language === 'ta'
                  ? 'பணம் செலுத்திய பிறகு கீழே உள்ள பட்டனை அழுத்தவும். கடைக்காரர் கட்டணத்தை சரிபார்த்ததும் உங்கள் அதிகாரப்பூர்வ பில் உடனடியாக தோன்றும்.'
                  : 'After paying, tap below. Your official bill & token will be generated once verified by the owner.'}
              </p>
            </div>

            {/* Submit for Approval Button */}
            <button
              onClick={handleCustomerSubmitForApproval}
              className="w-full bg-gold-gradient text-slate-950 font-black py-4 rounded-2xl text-base shadow-gold-md hover:brightness-105 active:scale-95 touch-target transition flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5 text-slate-950" />
              <span>{language === 'ta' ? 'நான் பணம் செலுத்தினேன் • பில் பெற' : 'I Have Paid • Submit for Bill'}</span>
            </button>
          </div>
        )}

        {/* State 3: Cash Payment Screen */}
        {orderState === 'paying_cash' && (
          <div className="bg-slate-900/95 border border-emerald-500/40 rounded-3xl p-6 shadow-xl text-center max-w-lg mx-auto animate-in fade-in">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <button
                onClick={() => setOrderState('browsing')}
                className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-amber-300 touch-target"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{language === 'ta' ? 'பொருட்கள் மாற்ற' : 'Edit Cart'}</span>
              </button>
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                கவுண்டரில் ரொக்கம் (Cash)
              </div>
            </div>

            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Banknote className="w-10 h-10" />
            </div>

            <h2 className="text-xl font-black text-slate-100 font-tamil-varthagam mb-1">
              {language === 'ta' ? 'கவுண்டரில் ரொக்கம் செலுத்துக' : 'Pay Cash at Counter'}
            </h2>
            <div className="text-4xl font-black text-gold-gradient my-3">
              {formatPaise(totalPaise)}
            </div>
            <p className="text-sm text-slate-300 mb-6 max-w-sm mx-auto leading-relaxed">
              {language === 'ta'
                ? `தயவுசெய்து கவுண்டரில் ரூ.${paiseToRupees(totalPaise)} ரொக்கமாக வழங்கி பில் பெற கீழே அழுத்தவும்.`
                : `Hand ₹${paiseToRupees(totalPaise)} cash at the counter to get your verified bill.`}
            </p>

            <button
              onClick={handleCustomerSubmitForApproval}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 rounded-2xl text-base shadow-lg active:scale-95 touch-target transition"
            >
              {language === 'ta' ? 'ரொக்கம் கொடுத்தாச்சு • பில் பெற' : 'Cash Paid • Submit for Bill'}
            </button>
          </div>
        )}

        {/* State 4: Waiting for Shop Owner Approval */}
        {orderState === 'waiting_owner' && (
          <div className="bg-slate-900/95 border-2 border-amber-400/80 rounded-3xl p-6 sm:p-8 shadow-gold-md text-center max-w-lg mx-auto animate-in zoom-in-95">
            {/* Animated pulsating waves */}
            <div className="relative w-24 h-24 mx-auto mb-5 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping" />
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500/30 to-brand-700/30 border border-amber-400 flex items-center justify-center text-amber-300">
                <Clock className="w-10 h-10 animate-spin" />
              </div>
            </div>

            <div className="inline-block px-3 py-1 bg-amber-500/20 border border-amber-500/40 rounded-full text-amber-300 font-mono text-xs font-bold mb-3">
              கட்டணம் சரிபார்க்கப்படுகிறது...
            </div>

            <h2 className="text-2xl font-black text-slate-100 font-tamil-varthagam mb-2">
              {language === 'ta' ? 'கடைக்காரர் சரிபார்க்கிறார்...' : 'Shop Owner Verifying Payment...'}
            </h2>

            <p className="text-sm text-slate-300 max-w-sm mx-auto mb-6 leading-relaxed">
              {language === 'ta'
                ? 'உங்கள் ஜிபே / ரொக்க கட்டணத்தை கடைக்காரர் சரிபார்த்ததும், உங்களின் அதிகாரப்பூர்வ பில் மற்றும் டோக்கன் உடனடியாக இங்கே தோன்றும்!'
                : 'Once verified by the shop owner, your official bill and token number will be generated immediately here!'}
            </p>

            {/* Order Items Breakdown */}
            <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 text-left mb-6">
              <h4 className="text-xs font-bold text-amber-300 mb-2 border-b border-slate-800 pb-1">
                {language === 'ta' ? 'ஆர்டர் விபரம்:' : 'Order Summary:'}
              </h4>
              <div className="space-y-1.5">
                {cartLines.map(line => (
                  <div key={line.itemId} className="flex justify-between text-xs sm:text-sm">
                    <span className="text-slate-200">
                      {language === 'ta' ? line.nameTa : line.nameEn} x {line.qty}
                    </span>
                    <span className="font-mono font-bold text-amber-200">
                      {formatPaise(line.totalPaise)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between text-sm font-black border-t border-slate-800 pt-2 mt-2">
                <span className="text-slate-300">{language === 'ta' ? 'மொத்தம்' : 'Total'}</span>
                <span className="text-gold-gradient">{formatPaise(totalPaise)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              {language === 'ta'
                ? '☕ தயவுசெய்து திரையை மூடாமல் சில வினாடிகள் காத்திருக்கவும்...'
                : 'Please wait a moment while the owner approves...'}
            </p>
          </div>
        )}

        {/* State 5: Official Bill Generated & Token Issued (Approval-First Completed) */}
        {orderState === 'confirmed' && (
          <div className="bg-gradient-to-b from-slate-900 to-brand-950 border-2 border-amber-400 rounded-3xl p-6 sm:p-8 shadow-gold-lg text-center max-w-lg mx-auto animate-in zoom-in-95">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <CheckCircle className="w-9 h-9" />
            </div>

            <h2 className="text-2xl font-black text-amber-300 font-tamil-varthagam mb-1">
              {language === 'ta' ? 'பில் உருவாக்கப்பட்டது!' : 'Official Bill Generated!'}
            </h2>
            <p className="text-xs text-slate-300 font-semibold mb-4">
              {language === 'ta' ? 'கடைக்காரரால் உறுதிசெய்யப்பட்டு சமையலறைக்கு அனுப்பப்பட்டது' : 'Verified by owner & sent to kitchen'}
            </p>

            {/* Official Token Card */}
            <div className="bg-slate-950 rounded-3xl p-6 border-2 border-amber-400/80 shadow-gold-md my-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 left-0 h-1.5 bg-gold-gradient" />
              <p className="text-xs font-black text-amber-400/80 tracking-widest uppercase mb-1">
                {language === 'ta' ? 'உங்கள் டோக்கன் எண்' : 'YOUR TOKEN NUMBER'}
              </p>
              <div className="text-6xl sm:text-7xl font-black text-gold-gradient tracking-wider my-2 font-mono">
                {generatedToken}
              </div>
              <p className="text-xs text-slate-300">
                {language === 'ta'
                  ? 'இந்த டோக்கன் எண்ணை கவுண்டரில் காட்டி உணவை பெற்றுக்கொள்ளவும்'
                  : 'Show this token number at the counter to collect your order'}
              </p>
            </div>

            {/* Official Receipt Breakdown */}
            <div className="bg-slate-950/70 rounded-2xl p-4 border border-slate-800 text-left mb-6 text-xs">
              <div className="flex justify-between text-slate-400 pb-2 border-b border-slate-800">
                <span>{shopPublic?.name}</span>
                <span className="font-mono">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              <div className="py-2 space-y-1">
                {cartLines.map(line => (
                  <div key={line.itemId} className="flex justify-between text-slate-200">
                    <span>{line.nameTa} x {line.qty}</span>
                    <span className="font-mono">{formatPaise(line.totalPaise)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-bold text-amber-300 border-t border-slate-800 pt-2">
                <span>{language === 'ta' ? 'செலுத்தப்பட்ட தொகை' : 'Paid Amount'} ({payMode.toUpperCase()})</span>
                <span>{formatPaise(totalPaise)}</span>
              </div>
            </div>

            {/* Reset / Next Order Button with Countdown */}
            <button
              onClick={() => {
                setCart({});
                setOrderState('browsing');
              }}
              className="w-full bg-gold-gradient text-slate-950 font-black py-4 rounded-2xl text-base shadow-gold-sm hover:brightness-105 active:scale-95 touch-target flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-5 h-5 text-slate-950" />
              <span>
                {language === 'ta' ? 'அடுத்த வாடிக்கையாளர் ஆர்டர்' : 'Place Next Order'} ({resetCountdown}s)
              </span>
            </button>
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar (Ultra Modern Glassmorphic Pill) */}
      {orderState === 'browsing' && cartLines.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-slate-950/95 backdrop-blur-xl border-t border-amber-500/30 shadow-2xl z-40 max-w-3xl mx-auto">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-300 font-black">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] bg-brand-900/80 text-amber-300 font-bold px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  {cartLines.reduce((s, i) => s + i.qty, 0)} {language === 'ta' ? 'பொருட்கள்' : 'items'}
                </span>
                <div className="text-2xl font-black text-gold-gradient">
                  {formatPaise(totalPaise)}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => startCheckout('cash')}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-3.5 rounded-2xl shadow-md flex items-center gap-1.5 touch-target text-xs sm:text-sm active:scale-95 transition"
              >
                <Banknote className="w-4 h-4" />
                <span>{language === 'ta' ? 'ரொக்கம்' : 'Cash'}</span>
              </button>
              <button
                onClick={() => startCheckout('upi')}
                className="bg-gold-gradient text-slate-950 font-black px-5 py-3.5 rounded-2xl shadow-gold-sm flex items-center gap-1.5 touch-target text-xs sm:text-sm active:scale-95 transition hover:brightness-105"
              >
                <QrCode className="w-4 h-4 text-slate-950" />
                <span>Google Pay / UPI</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
