import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  ExternalLink,
  MessageSquare,
  Sparkles,
  Zap,
  Check,
  Copy,
  Clock,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { saveLicenseToken, verifyLicenseToken } from '../../lib/license';
import { feedback } from '../../lib/feedback';
import QRCode from 'qrcode';

interface PlanTier {
  id: 'tea' | 'tiffin' | 'stores' | 'others';
  nameTa: string;
  nameEn: string;
  categoryDescTa: string;
  categoryDescEn: string;
  monthlyRupees: number;
  yearlyRupees: number;
  popular?: boolean;
}

export const SubscriptionView: React.FC = () => {
  const { settings, subscription, language, t, refreshShopData } = useShop();

  const [utrNumber, setUtrNumber] = useState('');
  const [selectedPlanDuration, setSelectedPlanDuration] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedTier, setSelectedTier] = useState<'tea' | 'tiffin' | 'stores' | 'others'>('tea');
  const [manualToken, setManualToken] = useState('');
  const [adminUpiQr, setAdminUpiQr] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [activationMsg, setActivationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const adminUpi = import.meta.env.VITE_ADMIN_UPI_ID || 'owner@upi';
  const adminPhone = import.meta.env.VITE_ADMIN_WHATSAPP || '919876543210';

  const PLAN_TIERS: PlanTier[] = [
    {
      id: 'tea',
      nameTa: 'டீ கடை திட்டம்',
      nameEn: 'Tea Stall Plan',
      categoryDescTa: 'டீ, காபி, பால், பிஸ்கட், வடை கடைகள்',
      categoryDescEn: 'Tea stalls, milk bars, roadside chai spots',
      monthlyRupees: 499,
      yearlyRupees: 4999,
    },
    {
      id: 'tiffin',
      nameTa: 'இட்லி / டிபன் கடை திட்டம்',
      nameEn: 'Idly / Tiffin Cart Plan',
      categoryDescTa: 'இட்லி, தோசை, பொங்கல், பரோட்டா உணவகங்கள்',
      categoryDescEn: 'Idly carts, tiffin stalls, morning/dinner messes',
      monthlyRupees: 999,
      yearlyRupees: 9999,
      popular: true,
    },
    {
      id: 'stores',
      nameTa: 'மளிகை & பலசரக்கு கடைகள்',
      nameEn: 'Stores & Provision Plan',
      categoryDescTa: 'மளிகை, பேக்கரி, தின்பண்ட கடைகள்',
      categoryDescEn: 'Grocery stores, provision stalls, bakeries',
      monthlyRupees: 1499,
      yearlyRupees: 14999,
    },
    {
      id: 'others',
      nameTa: 'மற்றவை & பெரிய உணவகம்',
      nameEn: 'Others & Full Restaurants',
      categoryDescTa: 'முழு நேர உணவகங்கள் மற்றும் பிற கடைகள்',
      categoryDescEn: 'Full dining restaurants, multi-cuisine outlets',
      monthlyRupees: 1999,
      yearlyRupees: 19999,
    },
  ];

  // Auto-detect matching tier from shopType
  useEffect(() => {
    if (settings?.shopType) {
      if (settings.shopType === 'tea') setSelectedTier('tea');
      else if (settings.shopType === 'tiffin') setSelectedTier('tiffin');
      else if (settings.shopType === 'snack') setSelectedTier('stores');
      else setSelectedTier('others');
    }
  }, [settings?.shopType]);

  const activeTierConfig = PLAN_TIERS.find(p => p.id === selectedTier) || PLAN_TIERS[0];
  const payableAmount =
    selectedPlanDuration === 'monthly'
      ? activeTierConfig.monthlyRupees
      : activeTierConfig.yearlyRupees;

  useEffect(() => {
    const currentMonthYear = new Date()
      .toLocaleDateString('en-US', { month: '2-digit', year: '2-digit' })
      .replace('/', '');
    const refCode = `VT-${settings?.shopCode || 'SHOP'}-${currentMonthYear}`;
    const upiUri = `upi://pay?pa=${adminUpi}&pn=${encodeURIComponent(
      'VARTHAGAM'
    )}&am=${payableAmount}.00&cu=INR&tn=${encodeURIComponent(refCode)}&tr=${refCode}`;

    QRCode.toDataURL(upiUri, { width: 300, margin: 2 }).then(setAdminUpiQr);
  }, [selectedTier, selectedPlanDuration, settings?.shopCode, payableAmount, adminUpi]);

  const handleActivateToken = async (tokenToVerify: string) => {
    if (!tokenToVerify.trim() || !settings) return;
    setIsVerifying(true);
    setActivationMsg(null);

    try {
      const res = await verifyLicenseToken(tokenToVerify.trim(), settings.shopCode);
      if (res.valid && res.payload) {
        saveLicenseToken(tokenToVerify.trim());
        feedback.playPaymentSuccessTone();
        setActivationMsg({
          type: 'success',
          text:
            language === 'ta'
              ? 'வர்த்தகம் சந்தா வெற்றிகரமாக செயல்படுத்தப்பட்டது!'
              : 'VARTHAGAM subscription successfully activated!',
        });
        setManualToken('');
        await refreshShopData();
      } else {
        setActivationMsg({
          type: 'error',
          text: res.error || (language === 'ta' ? 'தவறான உரிம டோக்கன்' : 'Invalid license token'),
        });
      }
    } catch (e: any) {
      setActivationMsg({ type: 'error', text: e.message || 'Verification error' });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSendPaymentWhatsApp = () => {
    if (!utrNumber.trim()) {
      alert(language === 'ta' ? 'UTR எண் உள்ளிடவும்' : 'Please enter UTR number');
      return;
    }

    const currentMonthYear = new Date().toLocaleDateString('ta-IN', {
      month: 'short',
      year: 'numeric',
    });
    const waText = `வணக்கம்! வர்த்தகம் (VARTHAGAM) சந்தா கட்டணம் செலுத்தியுள்ளேன்.
    
• கடை குறியீடு: *${settings?.shopCode}*
• கடை பெயர்: *${settings?.name}*
• திட்டம்: *${activeTierConfig.nameTa} (₹${payableAmount} - ${
      selectedPlanDuration === 'monthly' ? '1 மாதம்' : '1 வருடம்'
    })*
• வங்கி UTR எண்: *${utrNumber.trim()}*
• காலம்: ${currentMonthYear}

தயவுசெய்து சரிபார்த்து செயலாக்க உரிம டோக்கனை அனுப்பவும். நன்றி!`;

    const waUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(waText)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="pb-36 max-w-4xl mx-auto px-2 sm:px-4 animate-in fade-in">
      {/* Current Subscription Status Badge */}
      <div className="bg-gradient-to-br from-brand-900 via-brand-950 to-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-crimson-md text-white mb-6 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-amber-300 font-extrabold uppercase tracking-wider">
                {language === 'ta' ? 'வர்த்தகம் சந்தா நிலை' : 'VARTHAGAM Subscription Status'}
              </span>
              <span
                className={`px-3 py-0.5 rounded-full text-[11px] font-black uppercase ${
                  subscription?.status === 'active'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : subscription?.status === 'trial'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                }`}
              >
                {subscription?.status === 'active'
                  ? language === 'ta'
                    ? 'செயலில் உள்ளது'
                    : 'Active'
                  : subscription?.status === 'trial'
                  ? language === 'ta'
                    ? 'இலவச சோதனை'
                    : 'Free Trial'
                  : language === 'ta'
                  ? 'காலாவதியானது (Read-Only)'
                  : 'Expired (Read-Only)'}
              </span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-amber-200 mt-1 font-display">
              {settings?.name} ({settings?.shopCode})
            </h3>
            <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {subscription?.daysRemaining !== undefined && subscription.daysRemaining >= 0
                  ? language === 'ta'
                    ? `இன்னும் ${subscription.daysRemaining} நாட்கள் எஞ்சியுள்ளன`
                    : `${subscription.daysRemaining} days remaining`
                  : language === 'ta'
                  ? 'சந்தா முடிந்தது'
                  : 'Subscription expired'}
              </span>
            </p>
          </div>

          <div className="bg-white/10 rounded-2xl p-3 border border-white/10 text-center">
            <span className="text-[10px] text-slate-300 uppercase tracking-wider block font-bold">
              {language === 'ta' ? 'உங்கள் கடை வகை' : 'Your Category'}
            </span>
            <span className="text-sm font-extrabold text-amber-300">
              {activeTierConfig.nameTa}
            </span>
            <div className="text-xl font-black text-white font-display mt-0.5">
              ₹{activeTierConfig.monthlyRupees}
              <span className="text-xs font-normal text-slate-400">/மாதம்</span>
            </div>
          </div>
        </div>
      </div>

      {/* Select Monthly or Yearly Duration */}
      <div className="flex justify-center mb-6">
        <div className="bg-slate-800 p-1.5 rounded-2xl border border-slate-700 flex items-center gap-1 shadow-sm">
          <button
            onClick={() => setSelectedPlanDuration('monthly')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition touch-target ${
              selectedPlanDuration === 'monthly'
                ? 'bg-gold-gradient text-slate-950 shadow-gold-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            {language === 'ta' ? 'மாதாந்திர சந்தா (Monthly)' : 'Monthly Plan'}
          </button>
          <button
            onClick={() => setSelectedPlanDuration('yearly')}
            className={`px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 touch-target ${
              selectedPlanDuration === 'yearly'
                ? 'bg-gold-gradient text-slate-950 shadow-gold-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <span>{language === 'ta' ? 'வருடாந்திர சந்தா (Yearly)' : 'Yearly Plan'}</span>
            <span className="text-[9px] bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded-full">
              2 மாதங்கள் இலவசம்
            </span>
          </button>
        </div>
      </div>

      {/* 4 Official Subscription Tiers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {PLAN_TIERS.map(tier => {
          const isSelected = selectedTier === tier.id;
          const displayPrice =
            selectedPlanDuration === 'monthly' ? tier.monthlyRupees : tier.yearlyRupees;

          return (
            <div
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={`rounded-3xl p-5 border-2 transition-all cursor-pointer select-none flex flex-col justify-between relative ${
                isSelected
                  ? 'bg-gradient-to-b from-brand-900/40 via-white to-amber-50/50 border-amber-500 shadow-gold-md scale-102'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 right-4 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-sm uppercase tracking-wider">
                  Popular
                </div>
              )}

              <div>
                <h4 className="font-tamil-varthagam font-black text-base text-slate-900 leading-tight">
                  {language === 'ta' ? tier.nameTa : tier.nameEn}
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 min-h-[32px]">
                  {language === 'ta' ? tier.categoryDescTa : tier.categoryDescEn}
                </p>

                <div className="my-3">
                  <div className="text-3xl font-black text-brand-800 font-display">
                    ₹{displayPrice}
                  </div>
                  <span className="text-[11px] font-bold text-slate-400">
                    {selectedPlanDuration === 'monthly'
                      ? language === 'ta'
                        ? '1 மாதத்திற்கு'
                        : 'per month'
                      : language === 'ta'
                      ? '1 வருடத்திற்கு (12 மாதங்கள்)'
                      : 'per year (12 months)'}
                  </span>
                </div>
              </div>

              <div
                className={`py-2 text-center rounded-xl text-xs font-bold transition ${
                  isSelected
                    ? 'bg-brand-700 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {isSelected
                  ? language === 'ta'
                    ? 'தேர்ந்தெடுக்கப்பட்டது'
                    : 'Selected'
                  : language === 'ta'
                  ? 'தேர்வு செய்க'
                  : 'Select'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment & QR Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-6">
        <h4 className="font-tamil-varthagam font-bold text-lg text-slate-900 mb-1">
          {language === 'ta' ? 'கட்டணம் செலுத்தும் முறை (UPI QR)' : 'Payment by UPI QR'}
        </h4>
        <p className="text-xs text-slate-500 mb-4">
          {language === 'ta'
            ? 'கீழே உள்ள QR குறியீட்டை Google Pay அல்லது PhonePe மூலம் ஸ்கேன் செய்து கட்டணம் செலுத்தவும்.'
            : 'Scan with any UPI app to pay subscription directly.'}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-amber-50/60 border border-amber-200 mb-5">
          {/* QR */}
          <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm flex-shrink-0 text-center">
            {adminUpiQr ? (
              <img src={adminUpiQr} alt="Admin UPI QR" className="w-52 h-52 mx-auto rounded-xl" />
            ) : (
              <div className="w-52 h-52 flex items-center justify-center text-slate-300">
                QR Loading...
              </div>
            )}
            <span className="text-[10px] text-slate-400 font-mono mt-1 block">
              UPI: {adminUpi}
            </span>
          </div>

          {/* Details & WhatsApp Form */}
          <div className="flex-1 space-y-3 w-full">
            <div>
              <span className="text-xs text-slate-500 font-bold">
                {language === 'ta' ? 'செலுத்த வேண்டிய தொகை:' : 'Amount to Pay:'}
              </span>
              <div className="text-3xl font-black text-brand-800 font-display">
                ₹{payableAmount}.00
              </div>
              <p className="text-xs text-amber-800 font-semibold mt-0.5">
                {activeTierConfig.nameTa} (
                {selectedPlanDuration === 'monthly' ? '1 மாதம்' : '1 வருடம்'})
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {language === 'ta'
                  ? 'பணம் செலுத்திய வங்கி UTR / Ref எண் (12 இலக்கங்கள்):'
                  : 'Enter 12-digit UPI UTR number after payment:'}
              </label>
              <input
                type="text"
                placeholder="e.g. 427812903456"
                value={utrNumber}
                onChange={e => setUtrNumber(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 font-mono text-sm focus:border-brand-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleSendPaymentWhatsApp}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 touch-target text-sm active:scale-95"
            >
              <MessageSquare className="w-5 h-5" />
              <span>
                {language === 'ta'
                  ? 'WhatsApp-ல் ரசீதை அனுப்பி டோக்கன் பெறுக'
                  : 'Send UTR via WhatsApp for License'}
              </span>
            </button>
          </div>
        </div>

        {/* Token Activation Input */}
        <div className="border-t border-slate-100 pt-5">
          <h5 className="font-bold text-sm text-slate-800 mb-1 flex items-center gap-1.5">
            <KeyRound className="w-4 h-4 text-amber-600" />
            <span>
              {language === 'ta'
                ? 'உங்களிடம் உரிம டோக்கன் உள்ளதா? (Activate License)'
                : 'Have a License Token? Activate Here'}
            </span>
          </h5>
          <p className="text-xs text-slate-500 mb-3">
            {language === 'ta'
              ? 'WhatsApp-ல் உங்களுக்கு அனுப்பப்பட்ட கையொப்பமிட்ட டோக்கனை இங்கே ஒட்டவும்.'
              : 'Paste your signed license token received via WhatsApp.'}
          </p>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="eyJzaG9wQ29kZSI..."
              value={manualToken}
              onChange={e => setManualToken(e.target.value)}
              className="flex-1 p-3 rounded-xl border border-slate-300 font-mono text-xs focus:border-brand-500 focus:outline-none"
            />
            <button
              onClick={() => handleActivateToken(manualToken)}
              disabled={isVerifying || !manualToken.trim()}
              className="bg-brand-700 hover:bg-brand-800 text-white font-bold px-5 py-3 rounded-xl text-xs transition shadow-md touch-target disabled:opacity-50 flex items-center gap-1"
            >
              <Check className="w-4 h-4" />
              <span>{isVerifying ? '...' : language === 'ta' ? 'செயல்படுத்து' : 'Activate'}</span>
            </button>
          </div>

          {activationMsg && (
            <div
              className={`p-3 mt-3 rounded-xl text-xs font-bold border ${
                activationMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}
            >
              {activationMsg.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
