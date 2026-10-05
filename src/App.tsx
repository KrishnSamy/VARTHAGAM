import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Bell,
  Package,
  Receipt,
  BarChart3,
  Lightbulb,
  Settings,
  Store,
  Wifi,
  WifiOff,
  UtensilsCrossed,
  Lock,
  Unlock,
  TrendingUp,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { useShop } from './context/ShopContext';
import { OnboardingView } from './pages/onboarding/OnboardingView';
import { BillingView } from './pages/owner/BillingView';
import { OrdersQueueView } from './pages/owner/OrdersQueueView';
import { MenuManagementView } from './pages/owner/MenuManagementView';
import { StockView } from './pages/owner/StockView';
import { ExpensesView } from './pages/owner/ExpensesView';
import { ReportsView } from './pages/owner/ReportsView';
import { AdvisorView } from './pages/owner/AdvisorView';
import { SettingsView } from './pages/owner/SettingsView';
import { SubscriptionView } from './pages/owner/SubscriptionView';
import { CustomerSelfBillView } from './pages/customer/CustomerSelfBillView';
import { CounterKioskView } from './pages/kiosk/CounterKioskView';
import { SuperAdminView } from './pages/admin/SuperAdminView';
import { verifyLicenseToken, saveLicenseToken } from './lib/license';
import { feedback } from './lib/feedback';
import { VarthagamLogo } from './components/VarthagamLogo';
import { SplashAnimation } from './components/SplashAnimation';
import { PinModal } from './components/PinModal';
import { initializeAppSecurity } from './lib/appSecurity';

export const App: React.FC = () => {
  const {
    settings,
    orders,
    rawMaterials,
    isLoading,
    t,
    language,
    isKioskMode,
    setIsKioskMode,
    isOwnerUnlocked,
    lockOwner,
  } = useShop();

  // Run Splash only once per session to eliminate phone heating on refreshes
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('varthagam_splash_shown');
  });

  const [activeTab, setActiveTab] = useState<
    'billing' | 'orders' | 'menu' | 'stock' | 'expenses' | 'reports' | 'advisor' | 'settings' | 'subscription'
  >('billing');

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isHeaderPinModalOpen, setIsHeaderPinModalOpen] = useState(false);
  const [isMoreDrawerOpen, setIsMoreDrawerOpen] = useState(false);

  // Initialize anti-tamper and anti-hacking protections
  useEffect(() => {
    initializeAppSecurity();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check URL routes (/admin, /s/:shopCode, /activate#<token>)
  const pathname = window.location.pathname;
  const hash = window.location.hash;

  // Handle tap-to-activate link: https://<domain>/activate#<token>
  useEffect(() => {
    if (pathname.includes('/activate') && hash) {
      const token = hash.replace(/^#/, '');
      if (token && settings) {
        verifyLicenseToken(token, settings.shopCode).then(res => {
          if (res.valid) {
            saveLicenseToken(token);
            feedback.playPaymentSuccessTone();
            alert('வர்த்தகம் சந்தா வெற்றிகரமாக புதுப்பிக்கப்பட்டது! (VARTHAGAM License Activated)');
            window.location.href = '/';
          } else {
            alert(`உரிமம் தோல்வி: ${res.error}`);
          }
        });
      }
    }
  }, [pathname, hash, settings]);

  // Opening Logo Animation (Zero-CPU & Battery Optimized)
  if (showSplash) {
    return (
      <SplashAnimation
        onComplete={() => {
          sessionStorage.setItem('varthagam_splash_shown', 'true');
          setShowSplash(false);
        }}
        shopName={settings?.name}
        durationMs={2200}
      />
    );
  }

  if (pathname.startsWith('/admin')) {
    return <SuperAdminView />;
  }

  if (pathname.startsWith('/s/')) {
    const code = pathname.split('/s/')[1] || 'SHOP';
    return <CustomerSelfBillView shopCode={code} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-brand-950 flex items-center justify-center p-4">
        <div className="text-center animate-in fade-in">
          <div className="p-4 rounded-3xl bg-brand-950/70 border border-amber-500/40 shadow-gold-md inline-block mb-4">
            <VarthagamLogo size="lg" />
          </div>
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <p className="text-xs text-amber-200/80 font-bold tracking-widest uppercase">
              {language === 'ta' ? 'தொடக்கப்படுகிறது...' : 'Loading Varthagam...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // First run -> Onboarding
  if (!settings) {
    return <OnboardingView />;
  }

  // Locked Counter Kiosk Mode (Mode B - Tier 0 offline)
  if (isKioskMode) {
    return <CounterKioskView onExitKiosk={() => setIsKioskMode(false)} />;
  }

  const pendingOrdersCount = orders.filter(o => o.state === 'pending').length;
  const lowStockCount = rawMaterials.filter(m => m.currentStock <= m.reorderLevel).length;

  const isMoreTabActive = ['menu', 'expenses', 'advisor', 'settings', 'subscription'].includes(activeTab);

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950 overflow-x-hidden">
      {/* Ultra Modern Top Header - Highly Responsive on Android Phones */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-brand-950 via-brand-900 to-slate-950 text-white px-3 sm:px-4 py-2 sm:py-2.5 shadow-crimson-md border-b border-amber-500/30">
        <div className="max-w-6xl mx-auto flex justify-between items-center gap-2">
          {/* Logo & Stall Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <VarthagamLogo size="sm" showSubtitle={false} />
            <div className="h-5 w-[1px] bg-amber-500/30" />
            <div className="min-w-0">
              <h1 className="font-tamil-varthagam font-black text-xs sm:text-base leading-tight text-amber-100 truncate">
                {settings.name}
              </h1>
              <span className="text-[10px] text-amber-400/90 font-mono tracking-wider">
                {settings.shopCode}
              </span>
            </div>
          </div>

          {/* Right Header Status Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* 1-Tap Customer Self-Billing Switcher */}
            <button
              onClick={() => {
                feedback.vibrate(40);
                setIsKioskMode(true);
              }}
              className="flex items-center gap-1 text-[11px] font-black bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 text-slate-950 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl shadow-gold-sm hover:brightness-105 active:scale-95 transition touch-target border border-amber-300"
              title={language === 'ta' ? 'வாடிக்கையாளர் சுய பில்லிங் முறைக்கு மாற்ற' : 'Switch to Customer Self-Billing'}
            >
              <Store className="w-3.5 h-3.5 text-slate-950" />
              <span className="hidden xs:inline">{language === 'ta' ? 'சுய பில்லிங்' : 'Self-Billing'}</span>
            </button>

            {/* PIN Unlock Status Button */}
            <button
              onClick={() => {
                if (isOwnerUnlocked) {
                  lockOwner();
                  feedback.vibrate(30);
                } else {
                  setIsHeaderPinModalOpen(true);
                }
              }}
              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-xl border transition touch-target ${
                isOwnerUnlocked
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
              }`}
              title={isOwnerUnlocked ? 'Owner Unlocked (Tap to Lock)' : 'Owner Locked (Tap to Enter PIN)'}
            >
              {isOwnerUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              <span className="hidden sm:inline">
                {isOwnerUnlocked ? 'PIN Unlocked' : 'PIN Lock'}
              </span>
            </button>

            {/* Offline / Online Live Status */}
            <div
              className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-xl border ${
                isOnline
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
              }`}
            >
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="hidden sm:inline">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span className="hidden sm:inline">Offline</span>
                </>
              )}
            </div>

            {/* Subscription Button */}
            <button
              onClick={() => setActiveTab('subscription')}
              className="text-[11px] font-bold bg-gold-gradient text-slate-950 px-2.5 py-1 rounded-xl shadow-gold-sm hover:brightness-105 active:scale-95 transition"
            >
              {language === 'ta' ? 'சந்தா' : 'Plan'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab View - With Extra Bottom Space to Never Cutoff on Mobile */}
      <main className="flex-1 p-2 sm:p-4 max-w-6xl mx-auto w-full pb-28 safe-nav-spacing">
        {activeTab === 'billing' && <BillingView />}
        {activeTab === 'orders' && <OrdersQueueView />}
        {activeTab === 'menu' && (
          <MenuManagementView onBack={() => setActiveTab('settings')} />
        )}
        {activeTab === 'stock' && <StockView />}
        {activeTab === 'expenses' && <ExpensesView />}
        {activeTab === 'reports' && <ReportsView />}
        {activeTab === 'advisor' && <AdvisorView />}
        {activeTab === 'settings' && (
          <SettingsView
            onEnterKiosk={() => setIsKioskMode(true)}
            onNavigateToMenu={() => setActiveTab('menu')}
          />
        )}
        {activeTab === 'subscription' && <SubscriptionView />}
      </main>

      {/* Persistent Ultra-Modern Bottom Navigation Bar */}
      {/* 1. Mobile Bottom Bar (5 Clean Tabs - Fits Every Screen Width) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] sm:hidden pb-safe">
        <div className="grid grid-cols-5 py-1 px-1">
          {/* Tab 1: Billing */}
          <button
            onClick={() => {
              setActiveTab('billing');
              feedback.vibrate(20);
            }}
            className={`flex flex-col items-center justify-center py-1 rounded-2xl transition touch-target ${
              activeTab === 'billing'
                ? 'text-brand-800 font-black bg-brand-50 shadow-sm border border-brand-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{language === 'ta' ? 'பில்லிங்' : 'Billing'}</span>
          </button>

          {/* Tab 2: Orders */}
          <button
            onClick={() => {
              setActiveTab('orders');
              feedback.vibrate(20);
            }}
            className={`relative flex flex-col items-center justify-center py-1 rounded-2xl transition touch-target ${
              activeTab === 'orders'
                ? 'text-brand-800 font-black bg-brand-50 shadow-sm border border-brand-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-5 h-5" />
            {pendingOrdersCount > 0 && (
              <span className="absolute top-1 right-2.5 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                {pendingOrdersCount}
              </span>
            )}
            <span className="text-[10px] mt-0.5">{language === 'ta' ? 'ஆர்டர்கள்' : 'Orders'}</span>
          </button>

          {/* Tab 3: Reports / P&L */}
          <button
            onClick={() => {
              setActiveTab('reports');
              feedback.vibrate(20);
            }}
            className={`flex flex-col items-center justify-center py-1 rounded-2xl transition touch-target ${
              activeTab === 'reports'
                ? 'text-brand-800 font-black bg-brand-50 shadow-sm border border-brand-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{language === 'ta' ? 'கணக்கு' : 'Reports'}</span>
          </button>

          {/* Tab 4: Stock */}
          <button
            onClick={() => {
              setActiveTab('stock');
              feedback.vibrate(20);
            }}
            className={`relative flex flex-col items-center justify-center py-1 rounded-2xl transition touch-target ${
              activeTab === 'stock'
                ? 'text-brand-800 font-black bg-brand-50 shadow-sm border border-brand-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-5 h-5" />
            {lowStockCount > 0 && (
              <span className="absolute top-1 right-2.5 w-2.5 h-2.5 bg-amber-500 rounded-full" />
            )}
            <span className="text-[10px] mt-0.5">{language === 'ta' ? 'சரக்கு' : 'Stock'}</span>
          </button>

          {/* Tab 5: More (மேற்கொண்டு) */}
          <button
            onClick={() => {
              setIsMoreDrawerOpen(true);
              feedback.vibrate(25);
            }}
            className={`flex flex-col items-center justify-center py-1 rounded-2xl transition touch-target ${
              isMoreTabActive
                ? 'text-brand-800 font-black bg-brand-50 shadow-sm border border-brand-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{language === 'ta' ? 'மேலும்' : 'More'}</span>
          </button>
        </div>
      </nav>

      {/* 2. Desktop/Tablet Bottom Bar (All 7 Tabs Visible) */}
      <nav className="hidden sm:block fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-safe">
        <div className="max-w-3xl mx-auto grid grid-cols-7 py-1 px-1">
          <button
            onClick={() => setActiveTab('billing')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition touch-target ${
              activeTab === 'billing'
                ? 'text-brand-800 font-extrabold bg-brand-50 shadow-sm border border-brand-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{language === 'ta' ? 'பில்லிங்' : 'Billing'}</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`relative flex flex-col items-center justify-center py-1.5 rounded-2xl transition touch-target ${
              activeTab === 'orders'
                ? 'text-brand-800 font-extrabold bg-brand-50 shadow-sm border border-brand-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-5 h-5" />
            {pendingOrdersCount > 0 && (
              <span className="absolute top-1 right-3 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                {pendingOrdersCount}
              </span>
            )}
            <span className="text-[10px] mt-0.5">{language === 'ta' ? 'ஆர்டர்கள்' : 'Orders'}</span>
          </button>

          <button
            onClick={() => setActiveTab('stock')}
            className={`relative flex flex-col items-center justify-center py-1.5 rounded-2xl transition touch-target ${
              activeTab === 'stock'
                ? 'text-brand-800 font-extrabold bg-brand-50 shadow-sm border border-brand-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-5 h-5" />
            {lowStockCount > 0 && (
              <span className="absolute top-1 right-3 w-2 h-2 bg-amber-500 rounded-full" />
            )}
            <span className="text-[10px] mt-0.5">{language === 'ta' ? 'சரக்கு' : 'Stock'}</span>
          </button>

          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition touch-target ${
              activeTab === 'expenses'
                ? 'text-brand-800 font-extrabold bg-brand-50 shadow-sm border border-brand-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{language === 'ta' ? 'செலவு' : 'Expenses'}</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition touch-target ${
              activeTab === 'reports'
                ? 'text-brand-800 font-extrabold bg-brand-50 shadow-sm border border-brand-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{language === 'ta' ? 'கணக்கு' : 'Reports'}</span>
          </button>

          <button
            onClick={() => setActiveTab('advisor')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition touch-target ${
              activeTab === 'advisor'
                ? 'text-brand-800 font-extrabold bg-brand-50 shadow-sm border border-brand-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lightbulb className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{language === 'ta' ? 'ஆலோசகர்' : 'Advisor'}</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition touch-target ${
              activeTab === 'settings'
                ? 'text-brand-800 font-extrabold bg-brand-50 shadow-sm border border-brand-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{language === 'ta' ? 'அமைப்புகள்' : 'Settings'}</span>
          </button>
        </div>
      </nav>

      {/* Ultra Modern Slide-Up "More" Bottom Sheet for Mobile */}
      {isMoreDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-t-3xl border-t border-amber-300 p-4 shadow-2xl animate-in slide-in-from-bottom pb-safe max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gold-gradient text-slate-950 flex items-center justify-center font-black">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="font-tamil-varthagam font-black text-base text-slate-900">
                  {language === 'ta' ? 'கூடுதல் வசதிகள் (More Features)' : 'More Features'}
                </h3>
              </div>
              <button
                onClick={() => setIsMoreDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 touch-target"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Options Grid */}
            <div className="grid grid-cols-2 gap-2.5 my-4">
              {/* 1. Menu Management */}
              <button
                onClick={() => {
                  setActiveTab('menu');
                  setIsMoreDrawerOpen(false);
                }}
                className="p-3 rounded-2xl border border-slate-200 hover:border-brand-500 bg-slate-50 text-left transition active:scale-95 touch-target"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <h4 className="font-tamil-varthagam font-bold text-xs text-slate-900">
                  {language === 'ta' ? 'பொருட்கள் & விலை' : 'Menu & Prices'}
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">50 வரை மொத்தமாக சேர்க்க</p>
              </button>

              {/* 2. Expenses */}
              <button
                onClick={() => {
                  setActiveTab('expenses');
                  setIsMoreDrawerOpen(false);
                }}
                className="p-3 rounded-2xl border border-slate-200 hover:border-brand-500 bg-slate-50 text-left transition active:scale-95 touch-target"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center mb-2">
                  <Receipt className="w-4 h-4" />
                </div>
                <h4 className="font-tamil-varthagam font-bold text-xs text-slate-900">
                  {language === 'ta' ? 'கடை செலவுகள்' : 'Daily Expenses'}
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">பால், காஸ், வாடகை</p>
              </button>

              {/* 3. Business Advisor */}
              <button
                onClick={() => {
                  setActiveTab('advisor');
                  setIsMoreDrawerOpen(false);
                }}
                className="p-3 rounded-2xl border border-slate-200 hover:border-brand-500 bg-slate-50 text-left transition active:scale-95 touch-target"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2">
                  <Lightbulb className="w-4 h-4" />
                </div>
                <h4 className="font-tamil-varthagam font-bold text-xs text-slate-900">
                  {language === 'ta' ? 'வியாபார ஆலோசகர்' : 'Business Advisor'}
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">அதிக லாபம் தரும் உணவு</p>
              </button>

              {/* 4. Subscription Plan */}
              <button
                onClick={() => {
                  setActiveTab('subscription');
                  setIsMoreDrawerOpen(false);
                }}
                className="p-3 rounded-2xl border border-slate-200 hover:border-brand-500 bg-slate-50 text-left transition active:scale-95 touch-target"
              >
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-2">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h4 className="font-tamil-varthagam font-bold text-xs text-slate-900">
                  {language === 'ta' ? 'சந்தா & உரிமம்' : 'Subscription Plan'}
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">₹499/மாதம் முதல்</p>
              </button>

              {/* 5. Settings */}
              <button
                onClick={() => {
                  setActiveTab('settings');
                  setIsMoreDrawerOpen(false);
                }}
                className="p-3 rounded-2xl border border-slate-200 hover:border-brand-500 bg-slate-50 text-left transition active:scale-95 touch-target"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-800 flex items-center justify-center mb-2">
                  <Settings className="w-4 h-4" />
                </div>
                <h4 className="font-tamil-varthagam font-bold text-xs text-slate-900">
                  {language === 'ta' ? 'கடை அமைப்புகள்' : 'Shop Settings'}
                </h4>
                <p className="text-[10px] text-slate-500 mt-0.5">UPI, PIN, ரசீது</p>
              </button>

              {/* 6. Switch to Self-Billing */}
              <button
                onClick={() => {
                  setIsMoreDrawerOpen(false);
                  setIsKioskMode(true);
                }}
                className="p-3 rounded-2xl border-2 border-amber-400 bg-amber-50 text-left transition active:scale-95 touch-target"
              >
                <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center mb-2">
                  <Store className="w-4 h-4" />
                </div>
                <h4 className="font-tamil-varthagam font-bold text-xs text-brand-900">
                  {language === 'ta' ? 'வாடிக்கையாளர் பில்லிங்' : 'Customer Kiosk'}
                </h4>
                <p className="text-[10px] text-brand-700 mt-0.5">சுய பில்லிங் முறைக்கு</p>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header PIN Unlock Modal */}
      <PinModal
        isOpen={isHeaderPinModalOpen}
        titleTa="உரிமையாளர் PIN உள்ளிடவும்"
        titleEn="Enter Owner PIN"
        descriptionTa="விலை மாற்றம் மற்றும் ரகசிய அமைப்புகளை அணுக உங்கள் 4 இலக்க PIN தேவை."
        descriptionEn="Unlock owner access to modify prices and settings."
        onSuccess={() => {
          setIsHeaderPinModalOpen(false);
          feedback.playPaymentSuccessTone();
        }}
        onCancel={() => setIsHeaderPinModalOpen(false)}
      />
    </div>
  );
};
