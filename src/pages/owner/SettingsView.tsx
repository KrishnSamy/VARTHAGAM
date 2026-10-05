import React, { useState } from 'react';
import {
  Settings,
  Globe,
  HardDrive,
  Download,
  Upload,
  QrCode,
  Lock,
  Unlock,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Printer,
  KeyRound,
  Edit3,
  Check,
  Key,
  Sparkles,
  Mic,
  ExternalLink,
} from 'lucide-react';
import { useShop } from '../../context/ShopContext';
import { db } from '../../db/db';
import { exportLocalBackupJson, restoreFromBackupSnapshot } from '../../lib/gdrive';
import { feedback } from '../../lib/feedback';
import { PinModal } from '../../components/PinModal';
import { hashPin } from '../../lib/security';
import { getSavedGeminiKey, saveGeminiKey, verifyGeminiKey } from '../../lib/voiceBilling';
import QRCode from 'qrcode';

interface Props {
  onEnterKiosk: () => void;
  onNavigateToMenu?: () => void;
}

export const SettingsView: React.FC<Props> = ({ onEnterKiosk, onNavigateToMenu }) => {
  const {
    settings,
    language,
    setLanguage,
    t,
    refreshShopData,
    isOwnerUnlocked,
    lockOwner,
  } = useShop();

  const [showStickerModal, setShowStickerModal] = useState(false);
  const [stickerQrUrl, setStickerQrUrl] = useState('');
  const [isSelfBillOpen, setIsSelfBillOpen] = useState(settings?.isSelfBillOpen !== false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'menu' | 'unlock' | null>(null);

  // Edit Shop Details States (Owner Unlocked only)
  const [editingDetails, setEditingDetails] = useState(false);
  const [shopNameInput, setShopNameInput] = useState(settings?.name || '');
  const [upiIdInput, setUpiIdInput] = useState(settings?.upiId || '');

  // Change PIN States
  const [showChangePin, setShowChangePin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [pinChangeMsg, setPinChangeMsg] = useState('');

  // AI Voice Billing Settings State
  const [geminiApiKeyInput, setGeminiApiKeyInput] = useState(getSavedGeminiKey());
  const [testingGeminiKey, setTestingGeminiKey] = useState(false);
  const [geminiKeyMsg, setGeminiKeyMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const handleVerifyAndSaveGeminiKey = async () => {
    if (!geminiApiKeyInput.trim()) {
      saveGeminiKey('');
      setGeminiKeyMsg({ text: language === 'ta' ? 'API சாவி அகற்றப்பட்டது' : 'API Key removed', ok: false });
      return;
    }
    setTestingGeminiKey(true);
    setGeminiKeyMsg(null);
    const res = await verifyGeminiKey(geminiApiKeyInput);
    setTestingGeminiKey(false);
    if (res.success) {
      saveGeminiKey(geminiApiKeyInput);
      setGeminiKeyMsg({ text: language === 'ta' ? '✅ சாவி வெற்றிகரமாக இணைக்கப்பட்டது!' : '✅ Key verified & saved!', ok: true });
      feedback.playPaymentSuccessTone();
    } else {
      setGeminiKeyMsg({ text: `❌ ${res.message}`, ok: false });
      feedback.vibrate(80);
    }
  };

  const handleToggleSelfBill = async () => {
    const nextVal = !isSelfBillOpen;
    setIsSelfBillOpen(nextVal);
    await db.settings.update('current_shop', { isSelfBillOpen: nextVal });
    feedback.vibrate(50);
    await refreshShopData();
  };

  const handleOpenSticker = async () => {
    const customerUrl = `${window.location.origin}/s/${settings?.shopCode}`;
    const qr = await QRCode.toDataURL(customerUrl, { width: 320, margin: 2 });
    setStickerQrUrl(qr);
    setShowStickerModal(true);
  };

  const handleSaveDetails = async () => {
    if (!shopNameInput.trim() || !upiIdInput.trim()) return;
    await db.settings.update('current_shop', {
      name: shopNameInput.trim(),
      upiId: upiIdInput.trim(),
    });
    setEditingDetails(false);
    feedback.playPaymentSuccessTone();
    await refreshShopData();
  };

  const handleChangePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
      setPinChangeMsg(language === 'ta' ? '4 இலக்க எண்களை மட்டும் உள்ளிடவும்' : 'Enter a 4-digit number');
      return;
    }
    const newHash = hashPin(newPin);
    await db.settings.update('current_shop', { ownerPinHash: newHash });
    setPinChangeMsg(language === 'ta' ? 'PIN வெற்றிகரமாக மாற்றப்பட்டது!' : 'PIN changed successfully!');
    feedback.playPaymentSuccessTone();
    setTimeout(() => {
      setShowChangePin(false);
      setNewPin('');
      setPinChangeMsg('');
    }, 1500);
  };

  const handleOpenMenuManagement = () => {
    if (isOwnerUnlocked) {
      if (onNavigateToMenu) onNavigateToMenu();
    } else {
      setPendingAction('menu');
      setShowPinModal(true);
    }
  };

  const handleRestoreLocalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async event => {
      try {
        const json = JSON.parse(event.target?.result as string);
        await restoreFromBackupSnapshot(json);
        feedback.playPaymentSuccessTone();
        alert(language === 'ta' ? 'காப்புநகல் வெற்றிகரமாக மீட்டெடுக்கப்பட்டது!' : 'Data restored successfully!');
        window.location.reload();
      } catch (err: any) {
        alert(err.message || 'Restore failed');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="pb-32 max-w-3xl mx-auto px-2 sm:px-4">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4 text-brand-900">
        <Settings className="w-6 h-6 text-brand-800" />
        <h2 className="text-xl font-black text-slate-800">
          {t.settingsTitle}
        </h2>
      </div>

      {/* 1. OWNER ADMIN SECURITY LOCK CARD (Primary Admin Section) */}
      <div
        className={`rounded-3xl p-5 mb-4 border transition shadow-sm ${
          isOwnerUnlocked
            ? 'bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-950 text-white border-emerald-500/40 shadow-emerald-950/20'
            : 'bg-gradient-to-r from-brand-950 via-slate-900 to-slate-950 text-white border-amber-500/40 shadow-gold-sm'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${
                isOwnerUnlocked
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}
            >
              {isOwnerUnlocked ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-tamil-varthagam font-black text-base text-amber-200">
                  {language === 'ta' ? 'உரிமையாளர் நிர்வாகி உள்நுழைவு' : 'Owner Admin Security'}
                </h3>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    isOwnerUnlocked
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}
                >
                  {isOwnerUnlocked ? 'திறக்கப்பட்டது (UNLOCKED)' : 'பூட்டப்பட்டுள்ளது (LOCKED)'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isOwnerUnlocked
                  ? language === 'ta'
                    ? 'விலை மாற்றம் மற்றும் ரகசிய அமைப்புகள் திறக்கப்பட்டுள்ளன'
                    : 'Owner mode active. You can modify prices, PIN and UPI details.'
                  : language === 'ta'
                  ? 'கடைக்காரரின் 4-இலக்க PIN அல்லது Super Admin பிரத்யேக சாவி தேவை'
                  : 'Enter 4-digit PIN or Super Admin Unique Key to unlock.'}
              </p>
            </div>
          </div>

          <div>
            {isOwnerUnlocked ? (
              <button
                onClick={() => {
                  lockOwner();
                  feedback.vibrate(30);
                }}
                className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs border border-slate-700 touch-target"
              >
                {language === 'ta' ? 'இப்போது பூட்டு' : 'Lock Now'}
              </button>
            ) : (
              <button
                onClick={() => {
                  setPendingAction('unlock');
                  setShowPinModal(true);
                }}
                className="w-full sm:w-auto bg-gold-gradient text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs shadow-gold-sm hover:brightness-105 active:scale-95 transition touch-target"
              >
                {language === 'ta' ? 'PIN / சாவி மூலம் திறக்க' : 'Unlock with PIN / Key'}
              </button>
            )}
          </div>
        </div>

        {/* Unlocked Controls: Change PIN */}
        {isOwnerUnlocked && (
          <div className="border-t border-slate-800 pt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setShowChangePin(!showChangePin)}
              className="bg-white/10 hover:bg-white/15 text-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs border border-white/10 flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-300" />
              <span>{language === 'ta' ? 'புதிய PIN மாற்றுக' : 'Change 4-Digit PIN'}</span>
            </button>
            <button
              onClick={() => setEditingDetails(!editingDetails)}
              className="bg-white/10 hover:bg-white/15 text-slate-200 font-bold px-3 py-1.5 rounded-xl text-xs border border-white/10 flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-300" />
              <span>{language === 'ta' ? 'கடை & UPI மாற்றுக' : 'Edit Shop & UPI'}</span>
            </button>
          </div>
        )}

        {/* Change PIN Form */}
        {isOwnerUnlocked && showChangePin && (
          <form onSubmit={handleChangePin} className="mt-3 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
            <label className="block text-slate-300 font-bold mb-1">
              {language === 'ta' ? 'புதிய 4 இலக்க ரகசிய PIN:' : 'New 4-digit PIN:'}
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                maxLength={4}
                value={newPin}
                onChange={e => setNewPin(e.target.value)}
                placeholder="4 digits"
                className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-center font-mono font-bold tracking-widest text-base w-32 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-xl text-xs"
              >
                {language === 'ta' ? 'சேமி' : 'Save PIN'}
              </button>
            </div>
            {pinChangeMsg && <p className="mt-1.5 text-amber-300 font-bold">{pinChangeMsg}</p>}
          </form>
        )}

        {/* Edit Shop Name & UPI Form */}
        {isOwnerUnlocked && editingDetails && (
          <div className="mt-3 p-3 bg-slate-950 rounded-2xl border border-slate-800 text-xs space-y-2">
            <div>
              <label className="text-slate-400 font-bold block mb-1">கடை பெயர் (Shop Name):</label>
              <input
                type="text"
                value={shopNameInput}
                onChange={e => setShopNameInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5"
              />
            </div>
            <div>
              <label className="text-slate-400 font-bold block mb-1">Google Pay / UPI ID:</label>
              <input
                type="text"
                value={upiIdInput}
                onChange={e => setUpiIdInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 font-mono"
              />
            </div>
            <button
              onClick={handleSaveDetails}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{language === 'ta' ? 'விபரங்களை சேமிக்க' : 'Save Details'}</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. MENU & PRICES MANAGEMENT (Only accessible from Settings via PIN/Key) */}
      <div className="bg-gradient-to-r from-brand-900 to-rose-950 text-white rounded-3xl p-5 border border-amber-500/40 shadow-crimson-md mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-tamil-varthagam font-black text-base text-amber-200">
              {language === 'ta' ? 'பொருட்கள் & விலை மேலாண்மை' : 'Menu & Prices Management'}
            </h4>
            <Lock className="w-4 h-4 text-amber-300" />
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-md">
            {language === 'ta'
              ? 'புதிய பொருட்கள் சேர்க்க, விற்பனை விலையை மாற்ற, பால்/கேஸ் விலை உயர்வுக்கு ஏற்ப மொத்தமாக விலை உயர்த்த (உரிமையாளர் PIN தேவை).'
              : 'Add new food items, update selling prices, and apply bulk price adjustments (Owner PIN protected).'}
          </p>
        </div>

        <button
          onClick={handleOpenMenuManagement}
          className="bg-gold-gradient text-slate-950 font-black px-6 py-3 rounded-2xl text-xs sm:text-sm shadow-gold-sm hover:brightness-105 active:scale-95 transition touch-target flex items-center justify-center gap-1.5 flex-shrink-0"
        >
          <span>{language === 'ta' ? 'பொருட்கள் & விலை நிர்வகி ➔' : 'Manage Items & Prices ➔'}</span>
        </button>
      </div>

      {/* 3. Customer Self-Billing Mode Launcher */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-black text-sm text-slate-800">
            {language === 'ta' ? 'வாடிக்கையாளர் சுய பில்லிங் முறை' : 'Customer Self-Billing Mode'}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ta'
              ? 'கல்லா டேப்லெட்/போனை வாடிக்கையாளர் சுய பில்லிங் செய்ய பூட்டவும் (இணையம் தேவையில்லை)'
              : 'Lock screen on counter tablet for customers to self-order (Tier 0 offline)'}
          </p>
        </div>

        <button
          onClick={onEnterKiosk}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-2xl text-xs shadow-sm touch-target"
        >
          {language === 'ta' ? 'சுய பில்லிங் தொடங்கு' : 'Start Self-Billing'}
        </button>
      </div>

      {/* 4. Customer Self-Billing Switch */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-4 flex justify-between items-center">
        <div>
          <h4 className="font-black text-sm text-slate-800">
            {language === 'ta' ? 'வாடிக்கையாளர் சுய பில்லிங் அனுமதி' : 'Allow Customer Self-Billing'}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ta' ? 'வாடிக்கையாளர் QR ஸ்கேன் செய்து ஆர்டர் போடுவதை நிறுத்தலாம்' : 'Turn off to accept orders only at counter'}
          </p>
        </div>

        <button
          onClick={handleToggleSelfBill}
          className={`w-14 h-8 rounded-full transition-colors p-1 flex items-center ${
            isSelfBillOpen ? 'bg-brand-700 justify-end' : 'bg-slate-300 justify-start'
          }`}
        >
          <div className="w-6 h-6 rounded-full bg-white shadow-md" />
        </button>
      </div>

      {/* 5. Printable QR Sticker Generator */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-black text-sm text-slate-800">
            {t.qrSticker}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {language === 'ta' ? 'கல்லா அல்லது மேஜையில் ஒட்டக்கூடிய கடை QR ஸ்டிக்கர்' : 'A5/A6 printable shop QR sticker'}
          </p>
        </div>

        <button
          onClick={handleOpenSticker}
          className="bg-brand-900 hover:bg-brand-800 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-sm touch-target flex items-center justify-center gap-1.5"
        >
          <QrCode className="w-4 h-4 text-amber-300" />
          <span>{language === 'ta' ? 'QR ஸ்டிக்கர் பார்க்க' : 'View Sticker'}</span>
        </button>
      </div>

      {/* 6. Language Switcher */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-brand-700" />
          <div>
            <h4 className="font-black text-sm text-slate-800">
              {language === 'ta' ? 'செயலி மொழி (App Language)' : 'App Language'}
            </h4>
            <p className="text-xs text-slate-400">
              {language === 'ta' ? 'தற்போது தமிழ் தேர்ந்தெடுக்கப்பட்டுள்ளது' : 'Currently in English'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setLanguage(language === 'ta' ? 'en' : 'ta')}
          className="bg-brand-50 hover:bg-brand-100 text-brand-900 font-bold px-4 py-2 rounded-2xl text-xs border border-brand-200 touch-target"
        >
          {language === 'ta' ? 'English-க்கு மாற' : 'தமிழுக்கு மாற'}
        </button>
      </div>

      {/* 7. AI Voice Billing Settings (Google Gemini AI Studio Free API) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-brand-900">
            <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm text-slate-800">
                {language === 'ta' ? 'AI தமிழ் குரல் பில்லிங் (Google Gemini AI)' : 'AI Tamil Voice Billing (Google Gemini AI)'}
              </h4>
              <p className="text-xs text-slate-500">
                {language === 'ta' ? '100% இலவச Google AI Studio API சாவி (15 RPM / 1500 req/day)' : '100% Free Gemini API key via Google AI Studio'}
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-3 leading-relaxed">
          {language === 'ta'
            ? 'வாடிக்கையாளர் அல்லது கடை உரிமையாளர் தமிழில் பேசும்போது, நொடியில் மெனுவில் உள்ள உணவுகளைத் துல்லியமாக அடையாளம் கண்டு பில் போடும் அதிநவீன AI தொழில்நுட்பம்.'
            : 'Allows speaking food items in local colloquial Tamil for instant structured billing in milliseconds.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="password"
            placeholder="AIzaSy... (Gemini API Key)"
            value={geminiApiKeyInput}
            onChange={(e) => setGeminiApiKeyInput(e.target.value)}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 text-xs text-slate-800 font-mono placeholder:text-slate-400 focus:outline-none focus:border-brand-600"
          />
          <button
            onClick={handleVerifyAndSaveGeminiKey}
            disabled={testingGeminiKey}
            className="bg-brand-900 hover:bg-brand-800 text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-sm touch-target flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {testingGeminiKey ? (
              <span>{language === 'ta' ? 'சரிபார்க்கிறது...' : 'Testing...'}</span>
            ) : (
              <>
                <Check className="w-4 h-4 text-amber-300" />
                <span>{language === 'ta' ? 'சரிபார்த்து சேமி' : 'Verify & Save'}</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between mt-2.5 pt-1 text-xs">
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noreferrer"
            className="text-brand-700 hover:text-brand-900 font-bold hover:underline flex items-center gap-1"
          >
            <span>{language === 'ta' ? '🔗 இலவச Google Gemini Key பெற (இங்கே தட்டவும்)' : '🔗 Get Free Gemini API Key (Google AI Studio)'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          {geminiApiKeyInput && (
            <button
              onClick={() => {
                setGeminiApiKeyInput('');
                saveGeminiKey('');
                setGeminiKeyMsg({ text: language === 'ta' ? 'சாவி நீக்கப்பட்டது' : 'Key removed', ok: false });
              }}
              className="text-rose-600 hover:underline text-[11px]"
            >
              {language === 'ta' ? 'சாவியை நீக்கு' : 'Remove Key'}
            </button>
          )}
        </div>

        {geminiKeyMsg && (
          <div className={`mt-2.5 p-2.5 rounded-xl text-xs font-semibold ${
            geminiKeyMsg.ok ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {geminiKeyMsg.text}
          </div>
        )}
      </div>

      {/* 8. Local & Drive Backup Section */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-4">
        <div className="flex items-center gap-2 text-brand-800 mb-2">
          <HardDrive className="w-5 h-5" />
          <h4 className="font-black text-base text-slate-800">
            {language === 'ta' ? 'தரவு காப்புநகல் & பாதுகாப்பு (Backup)' : 'Data Backup & Restore'}
          </h4>
        </div>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          {language === 'ta'
            ? 'உங்கள் கடை கணக்குகள் அனைத்தும் உங்கள் போனில் மட்டுமே சேமிக்கப்படுகின்றன. போன் தொலைந்தாலோ உடைந்தாலோ இழக்காமல் இருக்க பேக்கப் எடுக்கவும்.'
            : 'All data is stored locally on this phone. Export backup to protect your business records.'}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => exportLocalBackupJson()}
            className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 flex flex-col items-center justify-center gap-1.5 touch-target"
          >
            <Download className="w-5 h-5 text-brand-800" />
            <span>{language === 'ta' ? 'JSON பேக்கப் எடு' : 'Export JSON Backup'}</span>
          </button>

          <label className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold text-slate-800 flex flex-col items-center justify-center gap-1.5 touch-target cursor-pointer">
            <Upload className="w-5 h-5 text-indigo-700" />
            <span>{language === 'ta' ? 'பேக்கப் மீட்டெடு' : 'Restore from JSON'}</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreLocalFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* 8. Android App Download Section */}
      <div className="bg-gradient-to-r from-brand-950 to-slate-900 text-white rounded-3xl p-5 shadow-crimson-md border border-amber-500/30 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gold-gradient text-slate-950 flex items-center justify-center flex-shrink-0 shadow-gold-sm font-black text-sm">
              APK
            </div>
            <div>
              <h4 className="font-extrabold text-base text-amber-200 font-tamil-varthagam">
                {language === 'ta' ? 'வர்த்தகம் ஆண்ட்ராய்டு செயலி (APK)' : 'VARTHAGAM Android APK'}
              </h4>
              <p className="text-xs text-slate-300">
                {language === 'ta'
                  ? 'இணையமில்லாத நேரடி ஆண்ட்ராய்டு ஆப் (4.4 MB)'
                  : 'Install standalone offline Android App (4.4 MB)'}
              </p>
            </div>
          </div>
          <a
            href="/varthagam.apk"
            download="varthagam.apk"
            className="bg-gold-gradient text-slate-950 hover:brightness-105 font-black px-5 py-3 rounded-2xl text-xs shadow-gold-sm flex items-center justify-center gap-1.5 transition touch-target"
          >
            <Download className="w-4 h-4 text-slate-950" />
            <span>{language === 'ta' ? 'APK பதிவிறக்கம்' : 'Download APK'}</span>
          </a>
        </div>
      </div>

      {/* 9. Shop Info Footer */}
      <div className="p-4 bg-slate-900 rounded-3xl text-xs text-slate-400 text-center border border-slate-800">
        <p className="font-black text-amber-300 text-sm">{settings?.name} ({settings?.shopCode})</p>
        <p className="mt-1 font-mono text-slate-400">Google Pay / UPI: {settings?.upiId}</p>
        <p className="mt-2 font-mono text-[10px] text-amber-400/80">VARTHAGAM (வர்த்தகம்) v2.0 • Ultra-Modern Tamil POS</p>
      </div>

      {/* Security PIN Modal */}
      <PinModal
        isOpen={showPinModal}
        titleTa="உரிமையாளர் நிர்வாகி உள்நுழைவு"
        titleEn="Owner Admin Authentication"
        descriptionTa="பொருட்கள் மற்றும் விலை மாற்ற அமைப்புகளை திறக்க 4 இலக்க PIN அல்லது Super Admin பிரத்யேக சாவியை உள்ளிடவும்."
        descriptionEn="Enter 4-digit PIN or Super Admin Unique Key to unlock."
        onSuccess={() => {
          setShowPinModal(false);
          if (pendingAction === 'menu') {
            if (onNavigateToMenu) onNavigateToMenu();
          }
          setPendingAction(null);
        }}
        onCancel={() => {
          setShowPinModal(false);
          setPendingAction(null);
        }}
      />

      {/* Printable QR Sticker Modal */}
      {showStickerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl text-center">
            <div className="border-4 border-brand-900 rounded-3xl p-6 bg-brand-50/40">
              <h2 className="text-2xl font-black text-slate-900 mb-1">
                {settings?.name}
              </h2>
              <p className="text-sm font-black text-brand-900 mb-4">
                {language === 'ta' ? 'ஸ்கேன் செய்து ஆர்டர் & பணம் செலுத்துக' : 'Scan to Order & Pay with UPI'}
              </p>

              {stickerQrUrl && (
                <img
                  src={stickerQrUrl}
                  alt="Shop QR"
                  className="w-56 h-56 mx-auto bg-white p-3 rounded-2xl shadow-md border-2 border-slate-200"
                />
              )}

              <p className="text-xs font-black text-slate-800 mt-4">
                Google Pay • PhonePe • Paytm
              </p>
              <p className="text-xs font-mono text-slate-500 mt-1">
                {settings?.upiId}
              </p>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowStickerModal(false)}
                className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-2xl text-sm touch-target"
              >
                {t.cancel}
              </button>
              <button
                onClick={() => window.print()}
                className="w-1/2 bg-brand-900 hover:bg-brand-800 text-white font-bold py-3 rounded-2xl text-sm flex items-center justify-center gap-1.5 shadow touch-target"
              >
                <Printer className="w-4 h-4" />
                <span>{language === 'ta' ? 'அச்சிடு' : 'Print'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
