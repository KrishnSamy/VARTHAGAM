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

  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<
    'billing' | 'orders' | 'menu' | 'stock' | 'expenses' | 'reports' | 'advisor' | 'settings' | 'subscription'
  >('billing');

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isHeaderPinModalOpen, setIsHeaderPinModalOpen] = useState(false);

  useEffect(() => {
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

  // 3-Second Logo Opening Animation on every new open
  if (showSplash) {
    return (
      <SplashAnimation
        onComplete={() => setShowSplash(false)}
        shopName={settings?.name}
        durationMs={3000}
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

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950">
      {/* Ultra Modern Top Header */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-brand-950 via-brand-900 to-slate-950 text-white px-3 sm:px-4 py-2.5 shadow-crimson-md border-b border-amber-500/30">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          {/* Logo & Stall Title */}
          <div className="flex items-center gap-2 sm:gap-3">
            <VarthagamLogo size="sm" showSubtitle={false} />
            <div className="h-6 w-[1px] bg-amber-500/30" />
            <div>
              <h1 className="font-tamil-varthagam font-extrabold text-sm sm:text-base leading-tight text-amber-100">
                {settings.name}
              </h1>
              <span className="text-[10px] text-amber-400/80 font-mono tracking-wider">
                {settings.shopCode}
              </span>
            </div>
          </div>

          {/* Right Header Status Badges */}
          <div className="flex items-center gap-2">
            {/* 1-Tap Customer Self-Billing Switcher */}
            <button
              onClick={() => {
                feedback.vibrate(40);
                setIsKioskMode(true);
              }}
              className="flex items-center gap-1.5 text-xs font-black bg-gradient-to-r from-amber-500 via-amber-400 to-amber-300 text-slate-950 px-3 py-1.5 rounded-xl shadow-gold-sm hover:brightness-105 active:scale-95 transition touch-target border border-amber-300"
              title={language === 'ta' ? 'வாடிக்கையாளர் சுய பில்லிங் முறைக்கு மாற்ற' : 'Switch to Customer Self-Billing'}
            >
              <Store className="w-3.5 h-3.5 text-slate-950" />
              <span>{language === 'ta' ? 'சுய பில்லிங்' : 'Self-Billing'}</span>
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
              className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-xl border transition touch-target ${
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
              className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-xl border ${
                isOnline
                  ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
              }`}
            >
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[10px]">Live</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3" />
                  <span className="text-[10px]">Offline</span>
                </>
              )}
            </div>

            {/* Subscription Button */}
            <button
              onClick={() => setActiveTab('subscription')}
              className="text-[11px] font-bold bg-gold-gradient text-slate-950 px-3 py-1 rounded-xl shadow-gold-sm hover:brightness-105 active:scale-95 transition"
            >
              {language === 'ta' ? 'சந்தா' : 'Plan'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab View */}
      <main className="flex-1 p-2 sm:p-4 max-w-6xl mx-auto w-full">
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

      {/* Persistent Ultra-Modern Bottom Navigation Bar (7 Owner Tabs) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] safe-area-bottom">
        <div className="max-w-2xl mx-auto grid grid-cols-7 py-1 px-1">
          {/* 1. Counter Billing */}
          <button
            onClick={() => setActiveTab('billing')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition touch-target ${
              activeTab === 'billing'
                ? 'text-brand-800 font-extrabold bg-brand-50 shadow-sm border border-brand-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[9px] sm:text-[10px] mt-0.5">{language === 'ta' ? 'பில்லிங்' : 'Billing'}</span>
          </button>

          {/* 2. Orders & Approvals */}
          <button
            onClick={() => setActiveTab('orders')}
            className={`relative flex flex-col items-center justify-center py-1.5 rounded-2xl transition touch-target ${
              activeTab === 'orders'
                ? 'text-brand-800 font-extrabold bg-brand-50 shadow-sm border border-brand-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {pendingOrdersCount > 0 && (
              <span className="absolute top-1 right-2 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                {pendingOrdersCount}
              </span>
            )}
            <span className="text-[9px] sm:text-[10px] mt-0.5">{language === 'ta' ? 'ஆர்டர்கள்' : 'Orders'}</span>
          </button>

          {/* 3. Stock */}
          <button
            onClick={() => setActiveTab('stock')}
            className={`relative flex flex-col items-center justify-center py-1.5 rounded-2xl transition touch-target ${
              activeTab === 'stock'
                ? 'text-brand-800 font-extrabold bg-brand-50 shadow-sm border border-brand-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4 sm:w-5 sm:h-5" />
            {lowStockCount > 0 && (
              <span className="absolute top-1 right-2 w-2 h-2 bg-amber-500 rounded-full" />
            )}
            <span className="text-[9px] sm:text-[10px] mt-0.5">{language === 'ta' ? 'சரக்கு' : 'Stock'}</span>
          </button>

          {/* 4. Expenses */}
          <button
            onClick={() => setActiveTab('expenses')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition touch-target ${
              activeTab === 'expenses'
                ? 'text-brand-800 font-extrabold bg-brand-50 shadow-sm border border-brand-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[9px] sm:text-[10px] mt-0.5">{language === 'ta' ? 'செலவு' : 'Expenses'}</span>
          </button>

          {/* 5. Reports (P&L) */}
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition touch-target ${
              activeTab === 'reports'
                ? 'text-brand-800 font-extrabold bg-brand-50 shadow-sm border border-brand-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[9px] sm:text-[10px] mt-0.5">{language === 'ta' ? 'கணக்கு' : 'Reports'}</span>
          </button>

          {/* 6. Business Advisor */}
          <button
            onClick={() => setActiveTab('advisor')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition touch-target ${
              activeTab === 'advisor'
                ? 'text-brand-800 font-extrabold bg-brand-50 shadow-sm border border-brand-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[9px] sm:text-[10px] mt-0.5">{language === 'ta' ? 'ஆலோசகர்' : 'Advisor'}</span>
          </button>

          {/* 7. Settings & Admin */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center py-1.5 rounded-2xl transition touch-target ${
              activeTab === 'settings'
                ? 'text-brand-800 font-extrabold bg-brand-50 shadow-sm border border-brand-200'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-[9px] sm:text-[10px] mt-0.5">{language === 'ta' ? 'அமைப்புகள்' : 'Settings'}</span>
          </button>
        </div>
      </nav>

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
