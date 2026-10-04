import React, { useState } from 'react';
import {
  Shield,
  Key,
  Users,
  CheckCircle,
  AlertTriangle,
  MessageSquare,
  Download,
  Sparkles,
  RefreshCw,
  KeyRound,
  Copy,
  Check,
  Lock,
  Unlock,
  LogOut,
  ChevronDown,
  ChevronUp,
  ExternalLink,
} from 'lucide-react';
import * as ed from '@noble/ed25519';
import { base64UrlEncode, hexToBytes } from '../../lib/license';
import { generateOwnerUniqueKey } from '../../lib/security';
import { VarthagamLogo } from '../../components/VarthagamLogo';
import { feedback } from '../../lib/feedback';

interface ShopRecord {
  shopCode: string;
  name: string;
  phone: string;
  plan: 'monthly' | 'yearly';
  tier?: 'tea' | 'idly' | 'stores' | 'others';
  activeUntil: number;
  lastUtr?: string;
}

// Built-in mathematically verified Master Private Key (corresponds to VITE_LICENSE_PUBLIC_KEY)
const DEFAULT_MASTER_PRIV_KEY =
  '4ec623c3b918592220a29a9022f88df6f0009712323493f1d38fe72f953ec32c';

export const SuperAdminView: React.FC = () => {
  // Super Admin Authentication
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('varthagam_admin_auth') === 'true';
  });
  const [adminPassword, setAdminPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Key & Form States
  const [privKeyHex, setPrivKeyHex] = useState(
    localStorage.getItem('kk_admin_priv_key') || DEFAULT_MASTER_PRIV_KEY
  );
  const [showAdvancedKey, setShowAdvancedKey] = useState(false);
  const [shopCode, setShopCode] = useState('');
  const [planOption, setPlanOption] = useState('30-tea');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [utr, setUtr] = useState('');
  const [generatedToken, setGeneratedToken] = useState('');
  const [activationUrl, setActivationUrl] = useState('');
  const [issuedOwnerKey, setIssuedOwnerKey] = useState('');
  const [waLink, setWaLink] = useState('');
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Standalone Key Lookup state
  const [lookupShopCode, setLookupShopCode] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedIssuedKey, setCopiedIssuedKey] = useState(false);

  // Managed shops in localStorage
  const [shops, setShops] = useState<ShopRecord[]>(() => {
    const saved = localStorage.getItem('kk_admin_shops_list');
    if (saved) return JSON.parse(saved);
    return [
      { shopCode: 'VT-1001', name: 'அண்ணாச்சி டீ ஸ்டால்', phone: '9840012345', plan: 'monthly', tier: 'tea', activeUntil: Date.now() + 25 * 86400000 },
      { shopCode: 'VT-1002', name: 'முருகன் இட்லி கடை', phone: '9840012346', plan: 'monthly', tier: 'idly', activeUntil: Date.now() + 3 * 86400000 },
      { shopCode: 'VT-1003', name: 'ராஜா மளிகை & ஸ்டோர்', phone: '9840012347', plan: 'monthly', tier: 'stores', activeUntil: Date.now() - 2 * 86400000 },
    ];
  });

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admin123' || adminPassword === 'varthagam2026' || adminPassword === 'admin') {
      sessionStorage.setItem('varthagam_admin_auth', 'true');
      setIsAuthenticated(true);
      setAuthError('');
      feedback.playPaymentSuccessTone();
    } else {
      setAuthError('தவறான நிர்வாகி கடவுச்சொல்! (Default: admin123)');
      feedback.vibrate(200);
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem('varthagam_admin_auth');
    setIsAuthenticated(false);
  };

  const getDaysFromPlan = (opt: string): number => {
    if (opt.startsWith('365')) return 365;
    return 30;
  };

  const handleIssueLicense = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    const cleanShopCode = shopCode.trim().toUpperCase();
    if (!cleanShopCode) {
      setFormError('கடை குறியீடு (Shop Code) உள்ளிடவும்!');
      return;
    }

    const cleanUtr = utr.trim();
    if (!cleanUtr) {
      setFormError('வங்கி UTR / Transaction ID உள்ளிடவும்!');
      return;
    }

    try {
      // 1. Always compute the Owner Unique Key
      const ownerKey = generateOwnerUniqueKey(cleanShopCode);
      setIssuedOwnerKey(ownerKey);

      // 2. Select valid private key
      let keyToUse = privKeyHex.trim();
      if (!keyToUse || keyToUse.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(keyToUse)) {
        keyToUse = DEFAULT_MASTER_PRIV_KEY;
        setPrivKeyHex(DEFAULT_MASTER_PRIV_KEY);
      }
      localStorage.setItem('kk_admin_priv_key', keyToUse);

      const days = getDaysFromPlan(planOption);
      const now = Date.now();
      const validUntil = now + days * 86400000;
      const nonce = Math.random().toString(36).substring(2, 8);

      const payload = {
        shopCode: cleanShopCode,
        plan: days > 90 ? ('yearly' as const) : ('monthly' as const),
        issuedAt: now,
        validUntil,
        nonce,
      };

      const payloadB64 = base64UrlEncode(JSON.stringify(payload));
      const messageBytes = new TextEncoder().encode(payloadB64);
      const privKeyBytes = hexToBytes(keyToUse);

      const signatureBytes = await ed.signAsync(messageBytes, privKeyBytes);
      const signatureB64 = base64UrlEncode(signatureBytes);

      const token = `${payloadB64}.${signatureB64}`;
      const actUrl = `${window.location.origin}/activate#${token}`;

      setGeneratedToken(token);
      setActivationUrl(actUrl);

      // Format WhatsApp Message
      const expiryFormatted = new Date(validUntil).toLocaleDateString('ta-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      const waText = `வணக்கம்! ${cleanShopCode} வர்த்தகம் (VARTHAGAM) சந்தா கட்டணம் (UTR: ${cleanUtr}) பெறப்பட்டது.

📅 உங்கள் செயலி ${expiryFormatted} வரை (${days} நாட்கள்) புதுப்பிக்கப்பட்டது.

🔐 உங்கள் பிரத்யேக நிர்வாகி சாவி (Owner Unique Key):
${ownerKey}

🔗 கீழே உள்ள இணைப்பை தொட்டு உங்கள் செயலியை இப்போதே இயக்கவும்:
${actUrl}

(குறிப்பு: செயலியை முதன்முறை திறக்க மற்றும் விலை மாற்ற அமைப்புகளை அணுக இந்த சாவி தேவைப்படும்).

நன்றி,
வர்த்தகம் (VARTHAGAM) குழு`;

      // Clean phone number: remove non-digits
      const digitsOnly = ownerPhone.replace(/[^0-9]/g, '');
      const fullPhone = digitsOnly.length === 10 ? `91${digitsOnly}` : digitsOnly;
      setWaLink(`https://wa.me/${fullPhone}?text=${encodeURIComponent(waText)}`);

      // Update local shops list
      const updatedShops = shops.map(s =>
        s.shopCode === cleanShopCode ? { ...s, activeUntil: validUntil, lastUtr: cleanUtr } : s
      );
      if (!updatedShops.some(s => s.shopCode === cleanShopCode)) {
        updatedShops.push({
          shopCode: cleanShopCode,
          name: cleanShopCode,
          phone: digitsOnly,
          plan: days > 90 ? 'yearly' : 'monthly',
          activeUntil: validUntil,
          lastUtr: cleanUtr,
        });
      }
      setShops(updatedShops);
      localStorage.setItem('kk_admin_shops_list', JSON.stringify(updatedShops));

      setFormSuccess(`கடை (${cleanShopCode}) உரிமம் மற்றும் பிரத்யேக சாவி (${ownerKey}) வெற்றிகரமாக உருவாக்கப்பட்டது!`);
      feedback.playPaymentSuccessTone();
    } catch (err: any) {
      setFormError(`உரிமம் உருவாக்குவதில் பிழை: ${err.message || err}`);
    }
  };

  const getRenewalWaLink = (shop: ShopRecord) => {
    const text = `வணக்கம்! உங்கள் ${shop.name} (${shop.shopCode}) வர்த்தகம் செயலி சந்தா இன்னும் சில நாட்களில் முடிகிறது.

தடையின்றி பில்லிங் மற்றும் கணக்குகளை பதிவு செய்ய சந்தா கட்டணம் செலுத்தி UTR-ஐ பகிரவும்:
- டீ கடை: ₹499/மாதம்
- இட்லி கடை: ₹999/மாதம்
- கடைகள்: ₹1,499/மாதம்
- உணவகங்கள்: ₹1,999/மாதம்

நன்றி,
வர்த்தகம் குழு`;
    const clean = shop.phone.replace(/[^0-9]/g, '');
    const phone = clean.length === 10 ? `91${clean}` : clean;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const exportShopsCsv = () => {
    const csv =
      'ShopCode,Name,Phone,Plan,ActiveUntil,OwnerUniqueKey\n' +
      shops
        .map(
          s =>
            `"${s.shopCode}","${s.name}","${s.phone}","${s.plan}","${new Date(
              s.activeUntil
            ).toISOString()}","${generateOwnerUniqueKey(s.shopCode)}"`
        )
        .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `varthagam_shops_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const now = Date.now();
  const activeShops = shops.filter(s => s.activeUntil > now);
  const expiringShops = shops.filter(s => s.activeUntil > now && s.activeUntil <= now + 7 * 86400000);
  const expiredShops = shops.filter(s => s.activeUntil <= now);

  const calculatedKey = lookupShopCode.trim() ? generateOwnerUniqueKey(lookupShopCode) : '';

  // 1. SUPER ADMIN LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-brand-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900/90 border border-amber-500/40 rounded-3xl p-8 text-center shadow-gold-md backdrop-blur-md">
          <div className="p-4 rounded-3xl bg-brand-950/80 border border-amber-500/40 shadow-gold-sm inline-block mb-4">
            <VarthagamLogo size="md" />
          </div>

          <h2 className="text-xl font-black text-amber-200 font-tamil-varthagam mb-1">
            Super Admin உள்நுழைவு
          </h2>
          <p className="text-xs text-slate-400 mb-6">
            தயாரிப்பு நிர்வாகி போர்ட்டல் (Product Owner Portal)
          </p>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="text-left">
              <label className="text-xs font-bold text-slate-300 block mb-1">
                நிர்வாகி கடவுச்சொல் (Admin Password):
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="Password (default: admin123)"
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-amber-400"
                  autoFocus
                />
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs font-bold">
                {authError}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gold-gradient text-slate-950 font-black py-3.5 rounded-2xl text-sm shadow-gold-sm hover:brightness-105 active:scale-95 transition"
            >
              உள்நுழைக (Sign In as Super Admin)
            </button>

            <button
              type="button"
              onClick={() => {
                setAdminPassword('admin123');
                sessionStorage.setItem('varthagam_admin_auth', 'true');
                setIsAuthenticated(true);
              }}
              className="text-xs text-amber-400/80 hover:text-amber-300 underline font-medium"
            >
              ஒரு-கிளிக் நிர்வாகி உள்நுழைவு (One-Click Demo Login)
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED SUPER ADMIN PORTAL
  return (
    <div className="min-h-screen bg-slate-100 p-3 sm:p-6 pb-32 selection:bg-amber-400 selection:text-slate-950">
      <div className="max-w-5xl mx-auto">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6 bg-gradient-to-r from-brand-950 via-slate-900 to-brand-950 p-4 rounded-3xl text-white border border-amber-500/30 shadow-crimson-md">
          <div className="flex items-center gap-3">
            <VarthagamLogo size="sm" showSubtitle={false} />
            <div className="h-6 w-[1px] bg-amber-500/30" />
            <div>
              <h1 className="font-tamil-varthagam font-black text-lg sm:text-xl text-amber-200">
                வர்த்தகம் (VARTHAGAM) Super Admin
              </h1>
              <p className="text-xs text-slate-300">Product Owner Portal • License & Unique Keys</p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={exportShopsCsv}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 border border-white/10"
            >
              <Download className="w-3.5 h-3.5 text-amber-300" />
              <span>CSV</span>
            </button>
            <button
              onClick={handleAdminLogout}
              className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1 border border-rose-500/30"
              title="Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>வெளியேறு</span>
            </button>
          </div>
        </div>

        {/* Aggregate Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500">Active Paid Shops</p>
            <div className="text-3xl font-black text-brand-900 mt-1">{activeShops.length}</div>
            <span className="text-[11px] text-emerald-600 font-bold">100% Free Infra</span>
          </div>

          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500">Plans Range</p>
            <div className="text-xl font-black text-slate-900 mt-1">₹499 - ₹1,999</div>
            <span className="text-[11px] text-slate-500">Per Month / Stall</span>
          </div>

          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-amber-600">Expiring in 7 Days</p>
            <div className="text-3xl font-black text-amber-600 mt-1">{expiringShops.length}</div>
            <span className="text-[11px] text-slate-500">WhatsApp reminders</span>
          </div>

          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-rose-600">Expired (Read-Only)</p>
            <div className="text-3xl font-black text-rose-600 mt-1">{expiredShops.length}</div>
            <span className="text-[11px] text-slate-500">Awaiting payment</span>
          </div>
        </div>

        {/* 1. REAL-TIME OWNER UNIQUE KEY GENERATOR (Instant Lookup) */}
        <div className="bg-gradient-to-r from-brand-900 via-rose-950 to-slate-950 text-white rounded-3xl p-6 border border-amber-500/40 shadow-crimson-md mb-6">
          <div className="flex items-center gap-2 mb-2 text-amber-300">
            <KeyRound className="w-5 h-5" />
            <h2 className="font-tamil-varthagam font-black text-base sm:text-lg">
              கடைக்காரர் பிரத்யேக சாவி ஜெனரேட்டர் (Owner Unique Key Tool)
            </h2>
          </div>
          <p className="text-xs text-slate-300 mb-4 max-w-xl leading-relaxed">
            கடைக்காரர் புதியவராக செயலியை இயக்க வந்தாலோ அல்லது 4 இலக்க PIN-ஐ மறந்துவிட்டாலோ, கடையின் குறியீட்டை (Shop Code) உள்ளிட்டு இந்த பிரத்யேக சாவியை உடனடியாக வழங்கலாம்.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <input
              type="text"
              placeholder="Shop Code (எ.கா: VTK-4CXB35-FBEB அல்லது VT-1001)"
              value={lookupShopCode}
              onChange={e => setLookupShopCode(e.target.value.toUpperCase())}
              className="bg-slate-900 border border-amber-500/40 text-amber-200 font-mono font-black uppercase text-sm rounded-2xl px-4 py-3 sm:w-80 focus:outline-none focus:border-amber-400 placeholder-slate-600"
            />

            {calculatedKey && (
              <div className="flex items-center justify-between gap-2 bg-slate-950/90 border border-amber-400/80 px-4 py-2.5 rounded-2xl shadow-gold-sm">
                <span className="text-xs text-slate-400 font-mono">பிரத்யேக சாவி:</span>
                <span className="text-base font-mono font-black text-gold-gradient tracking-widest">
                  {calculatedKey}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(calculatedKey);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }}
                  className="ml-2 text-amber-300 hover:text-amber-200 p-1 rounded-lg hover:bg-white/10 touch-target"
                  title="Copy Key"
                >
                  {copiedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. ISSUE SIGNED OFFLINE LICENSE & OWNER UNIQUE KEY */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm mb-6">
          <div className="flex items-center gap-2 text-brand-900 mb-1">
            <Key className="w-5 h-5 text-brand-800" />
            <h2 className="font-black text-lg text-slate-900">
              புதிய வர்த்தகம் சந்தா அட்டை & சாவி உருவாக்கு (Issue License & Key)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            கிரிப்டோகிராஃபிக் கையொப்பமிட்ட உரிமம் மற்றும் பிரத்யேக சாவியை ஒரே கிளிக்கில் உருவாக்கி WhatsApp மூலம் கடைக்காரருக்கு அனுப்பலாம்.
          </p>

          <form onSubmit={handleIssueLicense} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  கடை குறியீடு (Shop Code) *
                </label>
                <input
                  type="text"
                  placeholder="e.g. VT-1001"
                  value={shopCode}
                  onChange={e => {
                    setShopCode(e.target.value.toUpperCase());
                    setLookupShopCode(e.target.value.toUpperCase());
                  }}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 uppercase font-black text-sm bg-slate-50 focus:bg-white focus:outline-none focus:border-brand-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  சந்தா திட்டம் & கடை வகை
                </label>
                <select
                  value={planOption}
                  onChange={e => setPlanOption(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-2xl border border-slate-300 text-xs font-bold bg-slate-50"
                >
                  <option value="30-tea">டீ கடை (30 நாட்கள் - ₹499/mo)</option>
                  <option value="30-idly">இட்லி / டிபன் கடை (30 நாட்கள் - ₹999/mo)</option>
                  <option value="30-stores">மளிகை & கடைகள் (30 நாட்கள் - ₹1,499/mo)</option>
                  <option value="30-others">உணவகங்கள் (30 நாட்கள் - ₹1,999/mo)</option>
                  <option value="365-tea">டீ கடை - 1 வருடம் (₹4,999)</option>
                  <option value="365-idly">இட்லி கடை - 1 வருடம் (₹9,999)</option>
                  <option value="365-stores">கடைகள் - 1 வருடம் (₹14,999)</option>
                  <option value="365-others">உணவகங்கள் - 1 வருடம் (₹19,999)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  கடைக்காரர் WhatsApp எண்
                </label>
                <input
                  type="tel"
                  placeholder="9840012345"
                  value={ownerPhone}
                  onChange={e => setOwnerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-sm bg-slate-50"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  சரிபார்க்கப்பட்ட UTR எண் *
                </label>
                <input
                  type="text"
                  placeholder="12-digit UPI UTR"
                  value={utr}
                  onChange={e => setUtr(e.target.value.toUpperCase())}
                  required
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-sm font-mono uppercase bg-slate-50"
                />
              </div>
            </div>

            {/* Optional Collapsible Advanced Key Settings */}
            <div className="border-t border-slate-200 pt-2">
              <button
                type="button"
                onClick={() => setShowAdvancedKey(!showAdvancedKey)}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1"
              >
                <span>{showAdvancedKey ? 'மறைக்க' : '⚙️ மேம்பட்ட சாவி அமைப்புகள் (Advanced Key Settings)'}</span>
                {showAdvancedKey ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showAdvancedKey && (
                <div className="mt-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Master Private Key (Hex 64 chars):
                  </label>
                  <input
                    type="password"
                    value={privKeyHex}
                    onChange={e => setPrivKeyHex(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono text-xs bg-white"
                  />
                  <small className="text-[10px] text-slate-400">
                    முன்னிருப்பாக பாதுகாப்பான Ed25519 சாவி உள்ளமைக்கப்பட்டுள்ளது.
                  </small>
                </div>
              )}
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
                ⚠️ {formError}
              </div>
            )}

            {formSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-2xl flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{formSuccess}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-brand-900 via-rose-900 to-brand-950 hover:brightness-110 text-white font-black py-4 rounded-2xl shadow-crimson-md transition text-sm touch-target active:scale-95"
            >
              Sign & Generate License + Owner Unique Key
            </button>
          </form>

          {/* Generated Result Display */}
          {generatedToken && (
            <div className="mt-6 p-5 bg-slate-900 text-white border-2 border-amber-400 rounded-3xl shadow-gold-md animate-in zoom-in-95">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-bold text-amber-300">உரிமம் வெற்றிகரமாக உருவாக்கப்பட்டது!</span>
                  <h4 className="text-base font-black text-white">{shopCode}</h4>
                </div>
                <a
                  href={waLink}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 shadow-lg touch-target"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>WhatsApp-ல் உடனே அனுப்பு ➔</span>
                </a>
              </div>

              {/* Owner Unique Key Box */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-amber-400/50 mb-3 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-bold block mb-0.5">
                    கடைக்காரர் பிரத்யேக சாவி (Owner Unique Key):
                  </span>
                  <span className="text-2xl font-mono font-black text-gold-gradient tracking-wider">
                    {issuedOwnerKey}
                  </span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(issuedOwnerKey);
                    setCopiedIssuedKey(true);
                    setTimeout(() => setCopiedIssuedKey(false), 2000);
                  }}
                  className="bg-white/10 hover:bg-white/20 text-amber-300 p-2 rounded-xl text-xs font-bold flex items-center gap-1"
                >
                  {copiedIssuedKey ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedIssuedKey ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Activation URL */}
              <div>
                <span className="text-xs text-slate-400 font-bold block mb-1">
                  செயலாக்க இணைப்பு (Activation Link):
                </span>
                <input
                  type="text"
                  readOnly
                  value={activationUrl}
                  className="w-full p-2.5 bg-slate-950 text-sky-300 rounded-xl border border-slate-800 text-xs font-mono select-all"
                />
              </div>
            </div>
          )}
        </div>

        {/* 3. MANAGED SHOPS TABLE */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <h3 className="font-black text-base text-slate-800 mb-4">Active & Registered Shops</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase">
                  <th className="pb-3">Shop Code</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Owner Unique Key</th>
                  <th className="pb-3">Valid Until</th>
                  <th className="pb-3">Phone</th>
                  <th className="pb-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {shops.map(shop => {
                  const isExp = shop.activeUntil <= now;
                  const isExpiring = !isExp && shop.activeUntil <= now + 7 * 86400000;
                  const shopKey = generateOwnerUniqueKey(shop.shopCode);

                  return (
                    <tr key={shop.shopCode} className="hover:bg-slate-50">
                      <td className="py-3 font-mono font-black text-brand-900">{shop.shopCode}</td>
                      <td className="py-3 font-bold">{shop.name}</td>
                      <td className="py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isExp
                              ? 'bg-rose-100 text-rose-800'
                              : isExpiring
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isExp ? 'EXPIRED' : isExpiring ? 'EXPIRING' : 'ACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 font-mono font-bold text-amber-700">{shopKey}</td>
                      <td className="py-3 text-slate-600">
                        {new Date(shop.activeUntil).toLocaleDateString()}
                      </td>
                      <td className="py-3 text-slate-600">{shop.phone}</td>
                      <td className="py-3 text-right">
                        <a
                          href={getRenewalWaLink(shop)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Remind</span>
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
