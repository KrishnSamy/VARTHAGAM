import React, { useState } from 'react';
import {
  Coffee,
  Utensils,
  Flame,
  Store,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  QrCode,
  Sparkles,
  Download,
  Key,
  Copy,
  Check,
  MessageSquare,
  Lock,
  LogIn,
  AlertCircle,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { SHOP_TEMPLATES } from '../../lib/templates';
import { verifyOwnerUniqueKey } from '../../lib/security';
import { feedback } from '../../lib/feedback';
import QRCode from 'qrcode';
import confetti from 'canvas-confetti';
import { VarthagamLogo } from '../../components/VarthagamLogo';

export const OnboardingView: React.FC = () => {
  const { t, language, setLanguage, createInitialShop, loginWithUniqueKey } = useShop();

  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedType, setSelectedType] = useState<'tea' | 'tiffin' | 'snack' | 'mixed'>('tea');
  const [shopName, setShopName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [shopCode, setShopCode] = useState(() => `VT-${Math.floor(1000 + Math.random() * 9000)}`);
  const [uniqueKey, setUniqueKey] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Login form state
  const [loginCode, setLoginCode] = useState('');
  const [loginKey, setLoginKey] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');

  const shopTypeOptions = [
    {
      id: 'tea',
      titleTa: 'டீ கடை (Tea Stall)',
      titleEn: 'Tea Stall',
      priceTag: '₹499/மாதம்',
      icon: Coffee,
      descTa: 'டீ, காபி, பால், வடை, சமோசா, பிஸ்கட்',
      descEn: 'Tea, Coffee, Milk, Vadai, Samosa, Biscuits',
    },
    {
      id: 'tiffin',
      titleTa: 'இட்லி / டிபன் கடை (Tiffin Cart)',
      titleEn: 'Idly / Tiffin Cart',
      priceTag: '₹999/மாதம்',
      icon: Utensils,
      descTa: 'இட்லி, தோசை, பொங்கல், பூரி, பரோட்டா',
      descEn: 'Idly, Dosa, Pongal, Poori, Parotta',
    },
    {
      id: 'snack',
      titleTa: 'மளிகை / பலசரக்கு & தின்பண்ட கடை',
      titleEn: 'Stores & Snack Stall',
      priceTag: '₹1,499/மாதம்',
      icon: Flame,
      descTa: 'பஜ்ஜி, போண்டா, மளிகை, பேக்கரி தின்பண்டங்கள்',
      descEn: 'Snacks, Bajji, Provisions, Grocery, Bakery',
    },
    {
      id: 'mixed',
      titleTa: 'உணவகம் & பெரிய கடைகள் (Others)',
      titleEn: 'Restaurant & Others',
      priceTag: '₹1,999/மாதம்',
      icon: Store,
      descTa: 'டீ, டிபன், சாப்பாடு, அனைத்து உணவுகள் கலந்தது',
      descEn: 'Full dining restaurant, multi-cuisine combo',
    },
  ];

  const handleNextStep1 = () => {
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (!shopName.trim()) {
      setErrorMsg(language === 'ta' ? 'கடை பெயரை உள்ளிடவும்' : 'Please enter shop name');
      return;
    }
    if (!upiId.trim() || !upiId.includes('@')) {
      setErrorMsg(
        language === 'ta'
          ? 'சரியான UPI ID உள்ளிடவும் (எ.கா: name@bank)'
          : 'Please enter a valid UPI ID (e.g. name@bank)'
      );
      return;
    }
    setErrorMsg('');
    setStep(3);
  };

  const handleNextStep3 = () => {
    if (pin.length !== 4) {
      setErrorMsg(language === 'ta' ? 'PIN எண் 4 இலக்கங்கள் இருக்க வேண்டும்' : 'PIN must be 4 digits');
      return;
    }
    if (pin !== confirmPin) {
      setErrorMsg(language === 'ta' ? 'PIN எண் பொருந்தவில்லை' : 'PIN does not match');
      return;
    }
    setErrorMsg('');
    setStep(4);
  };

  const handleVerifyKeyAndCreateShop = async () => {
    const cleanKey = uniqueKey.trim().toUpperCase();
    const cleanShopCode = shopCode.trim().toUpperCase();

    if (!cleanKey) {
      setErrorMsg(
        language === 'ta'
          ? 'சூப்பர் அட்மின் வழங்கிய பிரத்யேக சாவியை (Unique Key) உள்ளிடவும்'
          : 'Please enter the Super Admin Unique Key'
      );
      return;
    }

    if (!verifyOwnerUniqueKey(cleanShopCode, cleanKey)) {
      setErrorMsg(
        language === 'ta'
          ? `தவறான சாவி! ${cleanShopCode} கடைக்கான சரியான சாவியை சூப்பர் அட்மினிடம் வாட்ஸ்அப்பில் பெறவும்.`
          : `Invalid key! Please request the valid key for ${cleanShopCode} from the Super Admin.`
      );
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      await createInitialShop(
        selectedType,
        shopName.trim(),
        upiId.trim(),
        pin,
        cleanKey,
        cleanShopCode
      );

      // Generate printable QR sticker for self-billing
      const customerUrl = `${window.location.origin}/s/${cleanShopCode}`;
      const qrSvg = await QRCode.toDataURL(customerUrl, { width: 300, margin: 2 });
      setQrDataUrl(qrSvg);

      feedback.playPaymentSuccessTone();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (err) {}

      setStep(5);
    } catch (e: any) {
      setErrorMsg(e.message || 'Setup failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoginExistingShop = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanCode = loginCode.trim().toUpperCase();
    const cleanKey = loginKey.trim().toUpperCase();

    if (!cleanCode || !cleanKey) {
      setLoginError(
        language === 'ta'
          ? 'கடை குறியீடு மற்றும் சாவியை உள்ளிடவும்'
          : 'Please enter both Shop Code and Unique Key'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await loginWithUniqueKey(cleanCode, cleanKey, loginPin || '1234');
      if (ok) {
        feedback.playPaymentSuccessTone();
        window.location.reload();
      } else {
        setLoginError(
          language === 'ta'
            ? 'தவறான கடை குறியீடு அல்லது உரிமையாளர் சாவி!'
            : 'Invalid Shop Code or Owner Unique Key!'
        );
      }
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const waRequestUrl = `https://wa.me/919840012345?text=${encodeURIComponent(
    `வணக்கம், வர்த்தகம் (VARTHAGAM) செயலியின் எனது கடை குறியீடு: ${shopCode}. கடை பெயர்: ${shopName || 'புதிய கடை'}. மாதாந்திர சந்தா செலுத்திவிட்டேன். உரிமையாளர் பிரத்யேக சாவி (Owner Unique Key) தரவும்.`
  )}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-brand-950 flex flex-col justify-center items-center p-4">
      {/* Brand Header */}
      <div className="w-full max-w-md flex justify-between items-center mb-4">
        <VarthagamLogo size="md" />
        <button
          onClick={() => setLanguage(language === 'ta' ? 'en' : 'ta')}
          className="text-xs font-bold bg-white/10 hover:bg-white/20 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-amber-200 transition touch-target"
        >
          {language === 'ta' ? 'English' : 'தமிழ்'}
        </button>
      </div>

      {/* Mode Selector Toggle: Register vs Login */}
      <div className="w-full max-w-md flex bg-slate-900/90 p-1 rounded-2xl border border-amber-500/30 mb-4 shadow-lg">
        <button
          onClick={() => {
            setMode('register');
            setErrorMsg('');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
            mode === 'register'
              ? 'bg-gradient-to-r from-brand-700 to-brand-800 text-amber-200 shadow-crimson-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>{language === 'ta' ? 'புதிய கடை பதிவு' : 'New Stall Register'}</span>
        </button>
        <button
          onClick={() => {
            setMode('login');
            setLoginError('');
          }}
          className={`flex-1 py-2.5 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
            mode === 'login'
              ? 'bg-gradient-to-r from-brand-700 to-brand-800 text-amber-200 shadow-crimson-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <LogIn className="w-4 h-4 text-amber-400" />
          <span>{language === 'ta' ? 'சாவி கொண்டு உள்நுழைக' : 'Login with Key'}</span>
        </button>
      </div>

      {/* Main Form Box */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-amber-500/20 overflow-hidden">
        {mode === 'register' ? (
          <>
            {/* Progress Bar (5 Steps) */}
            <div className="h-2 bg-slate-100 w-full">
              <div
                className="h-full bg-gradient-to-r from-brand-600 via-amber-500 to-gold-500 transition-all duration-300"
                style={{ width: `${(step / 5) * 100}%` }}
              />
            </div>

            <div className="p-6">
              {/* STEP 1: Select Stall Category */}
              {step === 1 && (
                <div>
                  <h2 className="font-tamil-varthagam font-black text-xl text-slate-900 mb-1">
                    {t.selectShopType}
                  </h2>
                  <p className="text-xs text-slate-500 mb-5">
                    {language === 'ta'
                      ? 'உங்கள் கடைக்கு ஏற்ற மாதிரி பொருட்கள் மற்றும் மாத சந்தா தானாக அமைக்கப்படும்.'
                      : 'Prefills menu items and subscription tier tailored to your stall.'}
                  </p>

                  <div className="space-y-2.5 mb-6">
                    {shopTypeOptions.map(opt => {
                      const Icon = opt.icon;
                      const isSelected = selectedType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          onClick={() => setSelectedType(opt.id as any)}
                          className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between gap-3 touch-target ${
                            isSelected
                              ? 'border-amber-500 bg-amber-50/50 shadow-gold-sm ring-1 ring-amber-400'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2.5 rounded-xl ${
                                isSelected
                                  ? 'bg-gradient-to-br from-brand-700 to-amber-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              <Icon className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-tamil-varthagam font-bold text-sm text-slate-800">
                                {opt.titleTa}
                              </h4>
                              <p className="text-[11px] text-slate-500 line-clamp-1">{opt.descTa}</p>
                            </div>
                          </div>

                          <span className="text-xs font-black text-brand-800 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-200 whitespace-nowrap">
                            {opt.priceTag}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleNextStep1}
                    className="w-full bg-gold-gradient text-slate-950 font-black py-4 px-4 rounded-2xl shadow-gold-sm hover:brightness-105 transition flex items-center justify-center gap-2 touch-target text-sm active:scale-95"
                  >
                    <span>{t.next}</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* STEP 2: Shop Details & UPI */}
              {step === 2 && (
                <div>
                  <h2 className="font-tamil-varthagam font-black text-xl text-slate-900 mb-1">
                    {language === 'ta' ? 'கடை & UPI விவரங்கள்' : 'Stall & UPI Setup'}
                  </h2>
                  <p className="text-xs text-slate-500 mb-5">
                    {language === 'ta'
                      ? 'வாடிக்கையாளர் நேரடியாக உங்கள் வங்கி கணக்கிற்கு பணம் செலுத்த இது உதவும்.'
                      : 'Enables direct customer payments to your existing bank account.'}
                  </p>

                  {errorMsg && (
                    <div className="p-3 mb-4 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        {t.shopNameLabel} *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={t.shopNamePlaceholder}
                        value={shopName}
                        onChange={e => setShopName(e.target.value)}
                        className="w-full p-3.5 rounded-xl border border-slate-300 font-bold focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        {t.upiIdLabel} *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={t.upiIdPlaceholder}
                        value={upiId}
                        onChange={e => setUpiId(e.target.value)}
                        className="w-full p-3.5 rounded-xl border border-slate-300 font-mono text-sm focus:border-brand-500 focus:outline-none"
                      />
                      <span className="text-[11px] text-slate-400 mt-1 block">{t.upiHelp}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep(1)}
                      className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition touch-target text-xs"
                    >
                      {t.back}
                    </button>
                    <button
                      onClick={handleNextStep2}
                      className="w-2/3 bg-brand-700 hover:bg-brand-800 text-white font-bold py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 touch-target text-sm active:scale-95"
                    >
                      <span>{t.next}</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Secret Owner PIN */}
              {step === 3 && (
                <div>
                  <div className="flex items-center gap-2 text-brand-700 mb-2">
                    <ShieldCheck className="w-6 h-6" />
                    <h2 className="font-tamil-varthagam font-black text-xl text-slate-900">
                      {t.ownerPinLabel}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">{t.ownerPinHelp}</p>

                  {errorMsg && (
                    <div className="p-3 mb-4 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        {language === 'ta' ? '4 இலக்க ரகசிய PIN:' : '4-Digit Secret PIN:'}
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        inputMode="numeric"
                        placeholder="••••"
                        value={pin}
                        onChange={e => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full p-4 rounded-xl border border-slate-300 text-center tracking-[1em] text-2xl font-black focus:border-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        {t.confirmPinLabel}
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        inputMode="numeric"
                        placeholder="••••"
                        value={confirmPin}
                        onChange={e => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full p-4 rounded-xl border border-slate-300 text-center tracking-[1em] text-2xl font-black focus:border-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep(2)}
                      className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition touch-target text-xs"
                    >
                      {t.back}
                    </button>
                    <button
                      onClick={handleNextStep3}
                      className="w-2/3 bg-gold-gradient text-slate-950 font-black py-3.5 rounded-xl shadow-gold-sm hover:brightness-105 transition flex items-center justify-center gap-2 touch-target text-sm active:scale-95"
                    >
                      <span>{t.next}</span>
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 4: MANDATORY SUPER ADMIN UNIQUE KEY VERIFICATION GATE */}
              {step === 4 && (
                <div>
                  <div className="flex items-center gap-2 text-brand-800 mb-2">
                    <Key className="w-6 h-6 text-amber-500" />
                    <h2 className="font-tamil-varthagam font-black text-xl text-slate-900">
                      {language === 'ta'
                        ? 'உரிமையாளர் பிரத்யேக சாவி'
                        : 'Super Admin Unique Key'}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">
                    {language === 'ta'
                      ? 'செயலியை பயன்படுத்த சூப்பர் அட்மின் வழங்கிய பிரத்யேக சாவி (Unique Key) கட்டாயமாகும்.'
                      : 'You must enter the Super Admin-issued Owner Unique Key to use the app.'}
                  </p>

                  {/* Shop Code Display & Copy Box */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-amber-400/40 mb-4 text-white">
                    <span className="text-[11px] text-amber-300 font-bold block mb-1">
                      {language === 'ta' ? 'உங்கள் கடை குறியீடு (Shop Code):' : 'Your Stall Code:'}
                    </span>
                    <div className="flex items-center justify-between">
                      <input
                        type="text"
                        value={shopCode}
                        onChange={e => setShopCode(e.target.value.toUpperCase())}
                        className="bg-transparent font-mono text-xl font-black text-gold-gradient focus:outline-none w-40"
                        title="Edit Shop Code if given by Admin"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(shopCode);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className="bg-white/10 hover:bg-white/20 text-amber-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 touch-target"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="p-3 mb-4 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Unique Key Input Field */}
                  <div className="mb-4">
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      {language === 'ta'
                        ? 'பிரத்யேக சாவி உள்ளிடவும் (எ.கா: VTK-8A3F-92B1) *'
                        : 'Enter Unique Key (e.g. VTK-XXXX-YYYY) *'}
                    </label>
                    <input
                      type="text"
                      placeholder="VTK-XXXX-YYYY"
                      value={uniqueKey}
                      onChange={e => setUniqueKey(e.target.value.toUpperCase())}
                      className="w-full p-3.5 rounded-xl border-2 border-amber-400/80 font-mono font-black text-center text-lg uppercase tracking-wider focus:border-brand-600 focus:outline-none bg-amber-50/20"
                    />
                  </div>

                  {/* WhatsApp Help Button to Contact Super Admin */}
                  <div className="mb-5 p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-2">
                    <div className="text-[11px] text-emerald-900">
                      <p className="font-bold">
                        {language === 'ta' ? 'சாவி இல்லையா?' : 'Need Unique Key?'}
                      </p>
                      <p className="text-[10px] text-emerald-700">
                        {language === 'ta' ? 'வாட்ஸ்அப்பில் சாவியை உடனே பெறலாம்' : 'Contact Super Admin via WhatsApp'}
                      </p>
                    </div>
                    <a
                      href={waRequestUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1 shadow-sm touch-target"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{language === 'ta' ? 'சாவி கேட்க' : 'WhatsApp'}</span>
                    </a>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep(3)}
                      className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3.5 rounded-xl transition touch-target text-xs"
                    >
                      {t.back}
                    </button>
                    <button
                      onClick={handleVerifyKeyAndCreateShop}
                      disabled={isSubmitting}
                      className="w-2/3 bg-gradient-to-r from-brand-800 via-rose-900 to-brand-950 text-white font-black py-3.5 rounded-xl shadow-crimson-md hover:brightness-110 transition flex items-center justify-center gap-2 touch-target text-sm active:scale-95 disabled:opacity-50"
                    >
                      <span>{isSubmitting ? 'சரிபார்க்கிறது...' : (language === 'ta' ? 'சரிபார்த்து திறக்க' : 'Verify & Activate')}</span>
                      <CheckCircle className="w-5 h-5 text-amber-400" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 5: Success & Shop QR Sticker Preview */}
              {step === 5 && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-amber-100 text-brand-800 rounded-full flex items-center justify-center mx-auto mb-3 shadow-gold-sm">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                  </div>

                  <h2 className="font-tamil-varthagam font-black text-2xl text-slate-900 mb-1">
                    {language === 'ta' ? 'வாழ்த்துகள்! உங்கள் கடை தயார்' : 'Congratulations! Stall Ready'}
                  </h2>
                  <p className="text-xs text-slate-600 mb-5">
                    {language === 'ta'
                      ? 'உங்கள் கடை வெற்றிகரமாக செயல்படுத்தப்பட்டது. வர்த்தகம் தொடங்க தயார்!'
                      : 'Your stall has been activated with Super Admin Key. Ready to sell!'}
                  </p>

                  {/* QR Sticker Preview Card */}
                  <div className="bg-slate-50 border-2 border-dashed border-amber-300 rounded-2xl p-5 mb-5">
                    <h3 className="font-tamil-varthagam font-black text-lg text-slate-800">
                      {shopName}
                    </h3>
                    <p className="text-xs text-brand-700 font-bold mb-3">
                      {language === 'ta' ? 'ஸ்கேன் செய்து ஆர்டர் & பணம் செலுத்துக' : 'Scan to Order & Pay'}
                    </p>
                    {qrDataUrl && (
                      <img
                        src={qrDataUrl}
                        alt="Shop QR Sticker"
                        className="w-44 h-44 mx-auto bg-white p-2 rounded-xl shadow-sm border border-slate-200"
                      />
                    )}
                    <p className="text-[11px] font-mono text-slate-500 mt-2">
                      UPI ID: {upiId}
                    </p>
                    <p className="text-[10px] font-mono text-amber-800 font-bold mt-1">
                      Shop Code: {shopCode}
                    </p>
                  </div>

                  <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-gold-gradient text-slate-950 font-black py-4 px-4 rounded-xl shadow-gold-sm hover:brightness-105 transition touch-target text-base active:scale-95"
                  >
                    {language === 'ta' ? 'வர்த்தகம் கடையை திறக்க (Open Stall)' : 'Open Varthagam Dashboard'}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* LOGIN WITH KEY SCREEN */
          <div className="p-6">
            <div className="flex items-center gap-2 text-brand-800 mb-2">
              <Key className="w-6 h-6 text-amber-500" />
              <h2 className="font-tamil-varthagam font-black text-xl text-slate-900">
                {language === 'ta' ? 'கடை சாவி உள்நுழைவு' : 'Stall Key Login'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mb-5">
              {language === 'ta'
                ? 'உங்கள் கடை குறியீடு மற்றும் சாவியை உள்ளிட்டு உடனடியாக கணக்கை மீட்டெடுக்கவும்.'
                : 'Enter your Shop Code & Owner Unique Key to access your stall.'}
            </p>

            {loginError && (
              <div className="p-3 mb-4 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLoginExistingShop} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {language === 'ta' ? 'கடை குறியீடு (Shop Code) *' : 'Shop Code *'}
                </label>
                <input
                  type="text"
                  placeholder="VT-1048"
                  value={loginCode}
                  onChange={e => setLoginCode(e.target.value.toUpperCase())}
                  required
                  className="w-full p-3.5 rounded-xl border border-slate-300 font-mono font-bold text-sm focus:border-brand-500 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {language === 'ta' ? 'உரிமையாளர் பிரத்யேக சாவி (Unique Key) *' : 'Owner Unique Key *'}
                </label>
                <input
                  type="text"
                  placeholder="VTK-XXXX-YYYY"
                  value={loginKey}
                  onChange={e => setLoginKey(e.target.value.toUpperCase())}
                  required
                  className="w-full p-3.5 rounded-xl border border-slate-300 font-mono font-black text-sm focus:border-brand-500 focus:outline-none uppercase tracking-wider"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {language === 'ta' ? '4 இலக்க PIN (விருப்பமானது):' : '4-Digit PIN (Optional):'}
                </label>
                <input
                  type="password"
                  maxLength={4}
                  placeholder="••••"
                  value={loginPin}
                  onChange={e => setLoginPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full p-3 rounded-xl border border-slate-300 text-center tracking-[0.5em] text-lg font-bold focus:border-brand-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gold-gradient text-slate-950 font-black py-4 px-4 rounded-xl shadow-gold-sm hover:brightness-105 transition touch-target text-sm active:scale-95 disabled:opacity-50 mt-2"
              >
                {isSubmitting ? 'உள்நுழைகிறது...' : (language === 'ta' ? 'உள்நுழைக (Login)' : 'Sign In')}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Direct APK Download Banner */}
      <div className="w-full max-w-md mt-4 p-3.5 bg-slate-900/90 backdrop-blur rounded-2xl border border-amber-500/30 shadow-md flex items-center justify-between gap-3 text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gold-gradient text-slate-950 flex items-center justify-center font-black text-xs shadow-gold-sm">
            APK
          </div>
          <div>
            <p className="text-xs font-bold text-amber-200">
              {language === 'ta' ? 'ஆண்ட்ராய்டு செயலி (VARTHAGAM APK)' : 'Android App APK'}
            </p>
            <p className="text-[10px] text-slate-400">4.1 MB • 100% Offline</p>
          </div>
        </div>
        <a
          href="/varthagam.apk"
          download="varthagam.apk"
          className="bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-sm transition active:scale-95"
        >
          {language === 'ta' ? 'பதிவிறக்கு' : 'Download'}
        </a>
      </div>
    </div>
  );
};
