import React from 'react';

interface VarthagamLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  showSubtitle?: boolean;
  theme?: 'dark' | 'light';
  animated?: boolean;
  className?: string;
}

export const VarthagamLogo: React.FC<VarthagamLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  theme = 'dark',
  animated = false,
  className = '',
}) => {
  const sizeClasses = {
    xs: {
      emblem: 'w-6 h-6',
      tamil: 'text-base',
      english: 'text-[8px] tracking-widest',
      dot: 'w-1 h-1',
    },
    sm: {
      emblem: 'w-7 h-7',
      tamil: 'text-xl',
      english: 'text-[9px] tracking-widest',
      dot: 'w-1 h-1',
    },
    md: {
      emblem: 'w-10 h-10',
      tamil: 'text-2xl sm:text-3xl',
      english: 'text-[11px] tracking-[0.2em]',
      dot: 'w-1.5 h-1.5',
    },
    lg: {
      emblem: 'w-14 h-14',
      tamil: 'text-3xl sm:text-4xl',
      english: 'text-xs tracking-[0.25em]',
      dot: 'w-2 h-2',
    },
    xl: {
      emblem: 'w-20 h-20',
      tamil: 'text-5xl sm:text-6xl',
      english: 'text-sm sm:text-base tracking-[0.3em]',
      dot: 'w-2.5 h-2.5',
    },
    '2xl': {
      emblem: 'w-28 h-28',
      tamil: 'text-6xl sm:text-7xl',
      english: 'text-lg sm:text-xl tracking-[0.35em]',
      dot: 'w-3 h-3',
    },
  };

  const current = sizeClasses[size];

  return (
    <div className={`flex items-center gap-2.5 sm:gap-3.5 select-none ${className}`}>
      {/* Royal Crest / Trade Seal Emblem */}
      <div
        className={`relative ${current.emblem} rounded-2xl bg-gradient-to-br from-red-600 via-brand-800 to-amber-950 p-0.5 shadow-gold-md border border-amber-400/60 flex items-center justify-center flex-shrink-0 ${
          animated ? 'animate-aura-pulse' : ''
        }`}
      >
        <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-brand-900 to-red-950 flex items-center justify-center overflow-hidden relative shadow-inner">
          {/* Subtle gold ray behind emblem */}
          <div
            className={`absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.4)_0%,transparent_75%)] ${
              animated ? 'animate-spin-slow' : ''
            }`}
          />

          {/* Golden Royal Trade Kasu / Scaled Emblem */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-3/4 h-3/4 relative z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
          >
            {/* Outer Serrated Kasu Ring */}
            <circle cx="12" cy="12" r="9.5" stroke="url(#goldGrad)" strokeWidth="1.2" />
            <circle cx="12" cy="12" r="7.5" stroke="url(#goldGrad)" strokeWidth="0.8" strokeDasharray="2 1.5" />
            {/* Stylized Prosperity / Trade Balance Knot */}
            <path
              d="M12 4.5V19.5M7.5 9H16.5M7.5 15H16.5M8.5 6L15.5 18"
              stroke="url(#goldGrad)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Center Ruby Accent */}
            <circle cx="12" cy="12" r="1.8" fill="#DC2626" stroke="#FEF08A" strokeWidth="0.8" />
            <defs>
              <linearGradient id="goldGrad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFBEB" />
                <stop offset="30%" stopColor="#FDE68A" />
                <stop offset="60%" stopColor="#F59E0B" />
                <stop offset="85%" stopColor="#D97706" />
                <stop offset="100%" stopColor="#B45309" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Typography: Authentic Bamini 28 Stylish Tamil + English VARTHAGAM */}
      <div className="flex flex-col justify-center leading-none">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Authentic Bamini 28 Font Typography */}
          <span
            className={`font-bamini-varthagam font-bold ${current.tamil} leading-none tracking-wider select-none ${
              animated
                ? 'animate-gold-shimmer'
                : 'bg-gradient-to-r from-amber-100 via-amber-300 to-amber-500 bg-clip-text text-transparent'
            } drop-shadow-[0_2px_8px_rgba(185,28,28,0.7)]`}
            aria-label="வர்த்தகம்"
            title="வர்த்தகம் (VARTHAGAM)"
          >
            tu;j;jfk;
          </span>
          <span
            className={`inline-block ${current.dot} rounded-full bg-amber-400 shadow-[0_0_10px_#f59e0b] animate-pulse`}
          />
        </div>

        {showSubtitle && (
          <div className="flex items-center gap-1.5 mt-1 sm:mt-1.5">
            <span
              className={`font-display font-black ${current.english} uppercase bg-gradient-to-r from-rose-200 via-amber-200 to-amber-400 bg-clip-text text-transparent drop-shadow-sm`}
            >
              VARTHAGAM
            </span>
            <span className="text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-red-500/20 text-amber-300 border border-amber-400/40 uppercase tracking-wider">
              வணிகம்
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
