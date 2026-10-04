import React, { useState } from 'react';
import { Lock, X, Delete, ShieldAlert, KeyRound, Key, ArrowRight } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { feedback } from '../lib/feedback';

interface PinModalProps {
  isOpen: boolean;
  titleTa?: string;
  titleEn?: string;
  descriptionTa?: string;
  descriptionEn?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  titleTa = 'உரிமையாளர் PIN உள்ளிடவும்',
  titleEn = 'Enter Owner Secret PIN',
  descriptionTa = 'பொருட்கள் மற்றும் அமைப்புகளை அணுக உங்கள் 4 இலக்க PIN தேவை',
  descriptionEn = 'Enter your 4-digit PIN to access owner settings and menu',
  onSuccess,
  onCancel,
}) => {
  const { language, unlockOwner } = useShop();
  const [mode, setMode] = useState<'pin' | 'unique_key'>('pin');
  const [pin, setPin] = useState('');
  const [uniqueKey, setUniqueKey] = useState('');
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!isOpen) return null;

  const handleKeyPress = async (digit: string) => {
    if (isVerifying || pin.length >= 4) return;

    const nextPin = pin + digit;
    setPin(nextPin);
    setError(false);
    feedback.vibrate(25);

    if (nextPin.length === 4) {
      setIsVerifying(true);
      try {
        const isValid = await unlockOwner(nextPin);
        if (isValid) {
          feedback.playPaymentSuccessTone();
          setPin('');
          setIsVerifying(false);
          onSuccess();
        } else {
          feedback.vibrate(200);
          setError(true);
          setErrorMessage(language === 'ta' ? 'தவறான PIN எண்! மீண்டும் முயல்க.' : 'Incorrect PIN! Please try again.');
          setIsVerifying(false);
          setTimeout(() => {
            setPin('');
          }, 600);
        }
      } catch (e) {
        setIsVerifying(false);
        setError(true);
        setPin('');
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
    feedback.vibrate(20);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
    feedback.vibrate(20);
  };

  const handleUniqueKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniqueKey.trim()) return;

    setIsVerifying(true);
    setError(false);
    try {
      const isValid = await unlockOwner(uniqueKey.trim());
      if (isValid) {
        feedback.playPaymentSuccessTone();
        setUniqueKey('');
        setIsVerifying(false);
        onSuccess();
      } else {
        feedback.vibrate(200);
        setError(true);
        setErrorMessage(
          language === 'ta'
            ? 'தவறான பிரத்யேக சாவி! சூப்பர் அட்மினை தொடர்பு கொள்ளவும்.'
            : 'Invalid Unique Key! Please contact Super Admin.'
        );
        setIsVerifying(false);
      }
    } catch (e) {
      setIsVerifying(false);
      setError(true);
      setErrorMessage('Verification failed');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-gradient-to-b from-slate-900 via-slate-900 to-brand-950 border border-amber-500/40 p-6 shadow-2xl text-center text-white relative overflow-hidden">
        {/* Subtle gold decorative glow */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-gold-sm font-black">
              {mode === 'pin' ? <Lock className="w-4 h-4" /> : <Key className="w-4 h-4" />}
            </div>
            <h3 className="font-tamil-varthagam font-bold text-base text-amber-200 text-left">
              {mode === 'pin'
                ? language === 'ta'
                  ? titleTa
                  : titleEn
                : language === 'ta'
                ? 'சூப்பர் அட்மின் பிரத்யேக சாவி'
                : 'Super Admin Master Key'}
            </h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-white rounded-full hover:bg-white/10 touch-target transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-300 mb-4 text-left">
          {mode === 'pin'
            ? language === 'ta'
              ? descriptionTa
              : descriptionEn
            : language === 'ta'
            ? 'சூப்பர் அட்மினால் வழங்கப்பட்ட பிரத்யேக சாவியை உள்ளிட்டு உடனடியாக திறக்கலாம்.'
            : 'Enter the Super Admin issued unique key to unlock all privileges.'}
        </p>

        {/* Mode Switch Tabs */}
        <div className="grid grid-cols-2 gap-1 bg-slate-950/80 p-1 rounded-xl mb-4 border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('pin');
              setError(false);
            }}
            className={`py-1.5 rounded-lg font-bold transition ${
              mode === 'pin' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400'
            }`}
          >
            4-இலக்க PIN
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('unique_key');
              setError(false);
            }}
            className={`py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1 ${
              mode === 'unique_key' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'text-slate-400'
            }`}
          >
            <KeyRound className="w-3 h-3" />
            <span>பிரத்யேக சாவி</span>
          </button>
        </div>

        {error && (
          <div className="flex items-center justify-center gap-1.5 text-rose-400 text-xs font-bold mb-4 animate-shake">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* MODE 1: 4-digit PIN Keypad */}
        {mode === 'pin' && (
          <div>
            <div className="flex justify-center gap-4 mb-5">
              {[0, 1, 2, 3].map(idx => (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-200 ${
                    pin.length > idx
                      ? error
                        ? 'bg-rose-500 scale-125 shadow-[0_0_12px_#f43f5e]'
                        : 'bg-amber-400 scale-125 shadow-[0_0_12px_#f59e0b]'
                      : 'bg-slate-700/80 border border-slate-600'
                  }`}
                />
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto mb-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(digit => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => handleKeyPress(digit)}
                  disabled={isVerifying}
                  className="h-12 rounded-2xl bg-white/5 hover:bg-white/15 active:bg-amber-500/20 text-xl font-bold text-slate-100 border border-white/10 active:border-amber-400/50 shadow-sm transition flex items-center justify-center touch-target"
                >
                  {digit}
                </button>
              ))}

              <button
                type="button"
                onClick={handleClear}
                className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-400 border border-white/5 transition flex items-center justify-center touch-target"
              >
                {language === 'ta' ? 'அழி' : 'Clear'}
              </button>

              <button
                type="button"
                onClick={() => handleKeyPress('0')}
                disabled={isVerifying}
                className="h-12 rounded-2xl bg-white/5 hover:bg-white/15 active:bg-amber-500/20 text-xl font-bold text-slate-100 border border-white/10 active:border-amber-400/50 shadow-sm transition flex items-center justify-center touch-target"
              >
                0
              </button>

              <button
                type="button"
                onClick={handleBackspace}
                className="h-12 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition flex items-center justify-center touch-target"
              >
                <Delete className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: Super Admin Unique Key Input */}
        {mode === 'unique_key' && (
          <form onSubmit={handleUniqueKeySubmit} className="space-y-4">
            <div className="text-left">
              <label className="text-xs text-slate-300 font-bold block mb-1">
                பிரத்யேக சாவி (Unique Key):
              </label>
              <input
                type="text"
                value={uniqueKey}
                onChange={e => setUniqueKey(e.target.value.toUpperCase())}
                placeholder="e.g. VTK-8A3F-92B1"
                className="w-full bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-3 text-sm font-mono text-amber-200 placeholder-slate-600 focus:outline-none focus:border-amber-400 text-center tracking-widest font-black uppercase"
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isVerifying || !uniqueKey.trim()}
              className="w-full bg-gold-gradient text-slate-950 font-black py-3 rounded-xl text-sm shadow-gold-sm hover:brightness-105 active:scale-95 transition flex items-center justify-center gap-1.5 touch-target disabled:opacity-50"
            >
              <span>{language === 'ta' ? 'சரிபார்த்து திறக்க' : 'Verify & Unlock'}</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
