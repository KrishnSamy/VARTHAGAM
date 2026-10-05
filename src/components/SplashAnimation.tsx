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
  durationMs = 2500,
}) => {
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Zero-CPU overhead: Single timer triggers smooth fadeout
    const timer = setTimeout(() => {
      setIsFadingOut(true);
      setTimeout(onComplete, 350);
    }, durationMs);

    return () => clearTimeout(timer);
  }, [durationMs, onComplete]);

  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(onComplete, 150);
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-6 bg-gradient-to-b from-[#180507] via-[#2A080D] to-[#0D0406] text-white select-none transition-opacity duration-300 ease-out cursor-pointer ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Battery-Friendly Lightweight Atmosphere (No heavy blur filters to prevent heating) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle Static Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[radial-gradient(circle,rgba(245,158,11,0.15)_0%,transparent_70%)]" />
      </div>

      {/* Top Header Row with Skip Button */}
      <div className="w-full flex items-center justify-between relative z-10">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400/20">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-bold text-amber-300 tracking-wider">
            வர்த்தகம் (VARTHAGAM)
          </span>
        </div>

        <button
          onClick={e => {
            e.stopPropagation();
            handleSkip();
          }}
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 transition-colors border border-white/10 touch-target"
        >
          தவிர் (Skip) ✕
        </button>
      </div>

      {/* Centerpiece: Ultra Luxury Animated Logo in Bamini 28 Font */}
      <div className="flex flex-col items-center justify-center my-auto relative z-10 text-center px-4">
        {/* Emblem */}
        <div className="relative mb-5">
          <div className="relative p-1 rounded-2xl bg-gradient-to-b from-amber-300 via-amber-600 to-red-900 shadow-lg">
            <div className="px-5 py-3 rounded-xl bg-gradient-to-b from-[#2B080D] to-[#120305] border border-amber-400/30">
              <span className="font-bamini-varthagam text-4xl sm:text-5xl font-black bg-gradient-to-r from-amber-200 via-amber-400 to-yellow-100 bg-clip-text text-transparent">
                tu;j;jfk;
              </span>
            </div>
          </div>
        </div>

        {/* English Brand Subtitle */}
        <div className="flex items-center gap-2 mb-2">
          <div className="h-[1px] w-6 bg-amber-500/50" />
          <h1 className="font-serif font-black tracking-[0.25em] text-lg sm:text-xl text-amber-300 uppercase">
            VARTHAGAM
          </h1>
          <div className="h-[1px] w-6 bg-amber-500/50" />
        </div>

        <p className="text-xs text-amber-100/70 font-tamil-varthagam max-w-xs leading-relaxed mb-4">
          {shopName
            ? `${shopName} • பில்லிங் & கணக்கு மேலாண்மை`
            : 'தமிழ்நாடு சிறு வணிகர்களுக்கான அல்ட்ரா-மாடர்ன் செயலி'}
        </p>

        {/* Pure CSS Smooth Loading Indicator (Zero CPU strain) */}
        <div className="w-56 h-1.5 bg-stone-900 rounded-full overflow-hidden border border-amber-500/30">
          <div
            className="h-full bg-gradient-to-r from-red-600 via-amber-400 to-amber-200 rounded-full transition-all duration-[2400ms] ease-out"
            style={{ width: isFadingOut ? '100%' : '90%' }}
          />
        </div>
      </div>

      {/* Footer Credentials */}
      <div className="relative z-10 flex items-center justify-center gap-4 text-[10px] text-stone-400 pb-2">
        <span className="flex items-center gap-1 text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          100% பாதுகாப்பானது (Safe & Offline)
        </span>
        <span>•</span>
        <span className="flex items-center gap-1 text-amber-300">
          <Zap className="w-3.5 h-3.5" />
          பேட்டரி சேவர் மோடு
        </span>
      </div>
    </div>
  );
};
