import React, { useState, useEffect } from 'react';
import { Sparkles, ShieldCheck, Zap } from 'lucide-react';
import { VarthagamLogo } from './VarthagamLogo';

interface SplashAnimationProps {
  onComplete: () => void;
  shopName?: string;
  durationMs?: number;
}

export const SplashAnimation: React.FC<SplashAnimationProps> = ({
  onComplete,
  shopName,
  durationMs = 3000,
}) => {
  const [progress, setProgress] = useState(0);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [statusText, setStatusText] = useState('வர்த்தகம் தொடக்கம்...');

  useEffect(() => {
    const startTime = Date.now();
    const intervalTime = 30; // 30ms updates for silky 60fps progress

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentProgress = Math.min(100, Math.floor((elapsed / durationMs) * 100));
      setProgress(currentProgress);

      if (elapsed < 1000) {
        setStatusText('வர்த்தகம் கணக்கு மேலாண்மை...');
      } else if (elapsed < 2000) {
        setStatusText(shopName ? `${shopName} கடை தகவல்கள்...` : 'கடை கணக்கு & பில்லிங் தயார்...');
      } else {
        setStatusText('வரவேற்கிறோம்! ஆப் திறக்கிறது...');
      }

      if (elapsed >= durationMs) {
        clearInterval(interval);
        setIsFadingOut(true);
        setTimeout(() => {
          onComplete();
        }, 400); // 400ms fadeout transition
      }
    }, intervalTime);

    return () => clearInterval(interval);
  }, [durationMs, onComplete, shopName]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 200);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-6 bg-gradient-to-b from-[#180507] via-[#2A080D] to-[#0D0406] text-white select-none transition-all duration-500 ease-out overflow-hidden ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Animated Atmosphere: Glowing Gold & Crimson Flares */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Central Radial Golden Sunburst */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(245,158,11,0.18)_0%,rgba(220,38,38,0.12)_40%,transparent_75%)] blur-2xl animate-pulse" />

        {/* Ambient Top Glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-red-600/20 rounded-full blur-3xl" />

        {/* Subtle grid pattern for ultra modern tech feel */}
        <div className="absolute inset-0 opacity-[0.04] bg-[radial-gradient(#F59E0B_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* Top Header Row with Skip Button */}
      <div className="w-full flex items-center justify-between relative z-10">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/20 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin-slow" />
          <span className="text-[11px] font-bold text-amber-300 tracking-wider">வணிக பில்லிங் தீர்வு</span>
        </div>

        <button
          onClick={handleSkip}
          className="text-xs font-semibold px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 transition-colors border border-white/10"
        >
          தவிர் (Skip) ✕
        </button>
      </div>

      {/* Centerpiece: Ultra Luxury Animated Logo in Bamini 28 Font */}
      <div className="flex flex-col items-center justify-center my-auto relative z-10 text-center">
        {/* Emblem with Golden Rings & Halo */}
        <div className="relative mb-6">
          {/* Pulsing Outer Aura Halo */}
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-amber-500/30 via-red-600/30 to-amber-500/30 blur-xl animate-aura-pulse" />

          {/* Golden Rotating Ring */}
          <div className="absolute -inset-2 rounded-2xl border border-amber-400/30 animate-spin-slow pointer-events-none" />

          {/* Main Logo Container */}
          <div className="relative p-1 rounded-2xl bg-gradient-to-b from-amber-300 via-amber-600 to-red-900 shadow-[0_10px_35px_rgba(245,158,11,0.35)]">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-[14px] bg-gradient-to-br from-brand-900 via-red-950 to-stone-950 flex items-center justify-center relative overflow-hidden">
              {/* Rotating ray */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.5)_0%,transparent_70%)] animate-spin-slow" />

              {/* Royal Seal SVG */}
              <svg viewBox="0 0 24 24" fill="none" className="w-16 h-16 relative z-10 drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)]">
                {/* Double Outer Rings */}
                <circle cx="12" cy="12" r="10" stroke="url(#splashGold)" strokeWidth="1.2" />
                <circle cx="12" cy="12" r="8" stroke="url(#splashGold)" strokeWidth="0.8" strokeDasharray="2 1.5" />
                {/* Traditional Kasu / Trade Symbol */}
                <path
                  d="M12 4V20M7 8.5H17M7 15.5H17M8 5.5L16 18.5"
                  stroke="url(#splashGold)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* Center Ruby Gem */}
                <circle cx="12" cy="12" r="2.2" fill="#DC2626" stroke="#FEF08A" strokeWidth="1" />
                <defs>
                  <linearGradient id="splashGold" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#FFFBEB" />
                    <stop offset="25%" stopColor="#FDE68A" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="80%" stopColor="#D97706" />
                    <stop offset="100%" stopColor="#92400E" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

        {/* Authentic Bamini 28 Stylish Tamil Typography */}
        <div className="flex flex-col items-center">
          <span
            className="font-bamini-varthagam font-bold text-6xl sm:text-7xl leading-none tracking-wider select-none animate-gold-shimmer drop-shadow-[0_4px_16px_rgba(245,158,11,0.6)]"
            aria-label="வர்த்தகம்"
            title="வர்த்தகம்"
          >
            tu;j;jfk;
          </span>

          {/* English Brand Name with Expanded Tracking */}
          <span className="font-display font-extrabold text-lg sm:text-xl tracking-[0.35em] mt-3 uppercase bg-gradient-to-r from-rose-200 via-amber-200 to-amber-400 bg-clip-text text-transparent drop-shadow-md">
            VARTHAGAM
          </span>

          {/* Subtitle / Value Proposition */}
          <p className="text-xs sm:text-sm text-stone-300 mt-2 font-medium tracking-wide">
            எளிய பில்லிங் • உடனடி கணக்கு • வியாபார ஆலோசகர்
          </p>

          {shopName && (
            <div className="mt-4 px-3.5 py-1 rounded-full bg-red-950/80 border border-amber-400/30 text-amber-200 text-xs font-semibold flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{shopName}</span>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: 3-Second Loading Bar and Status */}
      <div className="w-full max-w-sm flex flex-col items-center gap-3 relative z-10 pb-4">
        {/* Status Line */}
        <div className="flex items-center justify-between w-full text-[11px] text-stone-400 font-medium px-1">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-stone-300">{statusText}</span>
          </div>
          <span className="text-amber-400 font-bold font-mono">{progress}%</span>
        </div>

        {/* Smooth 3-Second Progress Bar */}
        <div className="w-full h-2 rounded-full bg-black/50 border border-amber-500/20 overflow-hidden p-0.5 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-600 via-amber-400 to-amber-300 transition-all duration-75 ease-out shadow-[0_0_12px_rgba(245,158,11,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Footer Guarantee */}
        <div className="flex items-center gap-1.5 text-[10px] text-stone-400 mt-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>100% பாதுகாப்பானது • ஆஃப்லைனில் இயங்கும்</span>
        </div>
      </div>
    </div>
  );
};
