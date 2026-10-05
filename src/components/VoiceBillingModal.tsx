import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { MenuItem } from '../db/db';
import {
  RecognizedVoiceItem,
  parseTamilSpeechToItems,
  speakTamilConfirmation,
  stopTamilSpeech,
  isSpeechRecognitionSupported,
} from '../lib/voiceBilling';
import { formatPaise, paiseToRupees } from '../lib/money';
import { feedback } from '../lib/feedback';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  onAddItemsToCart: (items: { id: string; qty: number }[]) => void;
  language: 'ta' | 'en';
}

export const VoiceBillingModal: React.FC<Props> = ({
  isOpen,
  onClose,
  menuItems,
  onAddItemsToCart,
  language,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [detectedItems, setDetectedItems] = useState<RecognizedVoiceItem[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      stopTamilSpeech();
      return;
    }

    setTranscript('');
    setDetectedItems([]);
    setErrorMsg(null);

    if (!isSpeechRecognitionSupported()) {
      setErrorMsg(
        language === 'ta'
          ? 'உங்கள் உலாவியில் குரல் அறிதல் (Speech Recognition) ஆதரிக்கப்படவில்லை.'
          : 'Voice speech recognition is not supported in this browser.'
      );
      return;
    }

    startListening();

    return () => {
      stopListening();
      stopTamilSpeech();
    };
  }, [isOpen]);

  const startListening = () => {
    try {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognitionClass) return;

      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'ta-IN'; // Tamil (India)
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMsg(null);
        feedback.vibrate(30);
      };

      recognition.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        const clean = fullTranscript.trim();
        setTranscript(clean);

        // Millisecond parsing
        const parsed = parseTamilSpeechToItems(clean, menuItems);
        if (parsed.length > 0) {
          setDetectedItems(parsed);
          feedback.vibrate(20);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.warn('Speech recognition error:', event.error);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.error(e);
      setErrorMsg(
        language === 'ta'
          ? 'மைக்ரோஃபோன் அணுகல் அனுமதி தேவை.'
          : 'Microphone permission needed.'
      );
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Adjust item quantities
  const updateItemQty = (index: number, delta: number) => {
    setDetectedItems(prev => {
      const copy = [...prev];
      const newQty = copy[index].qty + delta;
      if (newQty <= 0) {
        return copy.filter((_, i) => i !== index);
      }
      copy[index] = { ...copy[index], qty: newQty };
      return copy;
    });
    feedback.vibrate(20);
  };

  const removeItem = (index: number) => {
    setDetectedItems(prev => prev.filter((_, i) => i !== index));
    feedback.vibrate(25);
  };

  const totalPaise = detectedItems.reduce(
    (sum, r) => sum + r.item.pricePaise * r.qty,
    0
  );

  const handleSpeakReadback = async () => {
    if (detectedItems.length === 0) return;
    setIsSpeaking(true);
    feedback.vibrate(40);
    await speakTamilConfirmation(detectedItems, paiseToRupees(totalPaise));
    setIsSpeaking(false);
  };

  const handleConfirmAndAdd = () => {
    if (detectedItems.length === 0) return;

    // Convert to cart items
    const payload = detectedItems.map(d => ({
      id: d.item.id,
      qty: d.qty,
    }));

    onAddItemsToCart(payload);
    feedback.playPaymentSuccessTone();
    feedback.vibrate(80);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-gradient-to-b from-slate-900 via-rose-950/90 to-slate-950 border border-amber-500/40 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-amber-500/20 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-tamil-varthagam font-black text-lg sm:text-xl text-white">
                {language === 'ta'
                  ? 'AI உள்ளூர் குரல் வழி பில்லிங்'
                  : 'AI Tamil Voice Billing'}
              </h3>
              <p className="text-[11px] text-amber-300 font-medium">
                {language === 'ta'
                  ? 'பொருட்களின் பெயரை தமிழில் பேசுங்கள் (எ.கா: "ரெண்டு டீ ஒரு மசால் வடை")'
                  : 'Speak items in Tamil (e.g., "ரெண்டு டீ ஒரு வடை")'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition touch-target"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Animated Mic & Waves */}
          <div className="flex flex-col items-center justify-center py-4">
            <button
              onClick={toggleListening}
              className={`relative w-24 h-24 sm:w-28 sm:h-28 rounded-full flex items-center justify-center transition-all duration-300 touch-target ${
                isListening
                  ? 'bg-gradient-to-tr from-rose-600 to-amber-500 shadow-crimson-lg scale-105 ring-4 ring-amber-400/50 animate-pulse'
                  : 'bg-slate-800 border-2 border-slate-600 text-slate-400 hover:border-amber-400'
              }`}
            >
              {isListening ? (
                <>
                  <span className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping" />
                  <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-white relative z-10" />
                </>
              ) : (
                <MicOff className="w-10 h-10 sm:w-12 sm:h-12" />
              )}
            </button>

            <span className="mt-3 text-xs font-bold text-amber-300">
              {isListening
                ? language === 'ta'
                  ? '🎙️ கேட்கிறது... பேசுங்கள்'
                  : '🎙️ Listening... Speak now'
                : language === 'ta'
                ? 'பேச மைக் பட்டனை அழுத்தவும்'
                : 'Tap mic to start speaking'}
            </span>
          </div>

          {/* Transcript Box */}
          {transcript && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                {language === 'ta' ? 'நீங்கள் பேசியது:' : 'Spoken Transcript:'}
              </span>
              <p className="font-tamil-varthagam text-sm sm:text-base text-amber-200 font-bold">
                "{transcript}"
              </p>
            </div>
          )}

          {/* Error Notice */}
          {errorMsg && (
            <div className="bg-rose-500/20 border border-rose-500/40 rounded-2xl p-3 flex items-center gap-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Recognized Items List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {language === 'ta' ? 'கண்டறியப்பட்ட பொருட்கள்' : 'Detected Items'} ({detectedItems.length})
              </span>
              {detectedItems.length > 0 && (
                <button
                  onClick={handleSpeakReadback}
                  disabled={isSpeaking}
                  className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-amber-200 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-500/30 transition touch-target"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>
                    {isSpeaking
                      ? language === 'ta'
                        ? 'பேசுகிறது...'
                        : 'Speaking...'
                      : language === 'ta'
                      ? '🔊 தமிழில் கேட்க'
                      : '🔊 Listen'}
                  </span>
                </button>
              )}
            </div>

            {detectedItems.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-white/10 rounded-2xl bg-white/5">
                <p className="text-xs text-slate-400 font-tamil-varthagam">
                  {language === 'ta'
                    ? 'எடுத்துக்காட்டு: "ரெண்டு டீ, ஒரு காபி, அஞ்சு இட்லி"'
                    : 'Example: "இரண்டு டீ, ஒரு காபி, அஞ்சு இட்லி"'}
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {detectedItems.map((r, idx) => (
                  <div
                    key={`${r.item.id}-${idx}`}
                    className="flex items-center justify-between bg-white/10 border border-white/10 rounded-2xl p-2.5 sm:p-3"
                  >
                    <div className="flex items-center gap-2.5">
                      {r.item.imageUrl ? (
                        <img
                          src={r.item.imageUrl}
                          alt={r.item.nameTa}
                          className="w-10 h-10 rounded-xl object-cover border border-amber-400/40"
                        />
                      ) : (
                        <span className="text-2xl p-1 bg-amber-500/20 rounded-xl">
                          {r.item.emoji}
                        </span>
                      )}
                      <div>
                        <h4 className="font-tamil-varthagam font-bold text-sm text-white leading-tight">
                          {r.item.nameTa}
                        </h4>
                        <span className="text-[11px] text-amber-300 font-mono">
                          {formatPaise(r.item.pricePaise)} × {r.qty} ={' '}
                          <span className="font-bold">
                            {formatPaise(r.item.pricePaise * r.qty)}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateItemQty(idx, -1)}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center touch-target"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-black text-amber-400 text-sm">
                        {r.qty}
                      </span>
                      <button
                        onClick={() => updateItemQty(idx, 1)}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center touch-target"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => removeItem(idx)}
                        className="w-7 h-7 rounded-lg text-rose-400 hover:bg-rose-500/20 flex items-center justify-center ml-1 touch-target"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-amber-500/20 bg-black/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-auto text-left">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">
              {language === 'ta' ? 'மொத்தத் தொகை' : 'Total Amount'}
            </span>
            <span className="text-xl sm:text-2xl font-black text-amber-400 font-display">
              {formatPaise(totalPaise)}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setTranscript('');
                setDetectedItems([]);
                startListening();
              }}
              className="py-3 px-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 touch-target"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{language === 'ta' ? 'மீண்டும்' : 'Retry'}</span>
            </button>

            <button
              onClick={handleConfirmAndAdd}
              disabled={detectedItems.length === 0}
              className={`flex-1 sm:flex-none py-3 px-6 rounded-2xl font-black text-xs shadow-gold-md flex items-center justify-center gap-2 transition touch-target ${
                detectedItems.length > 0
                  ? 'bg-gold-gradient text-slate-950 hover:brightness-105 active:scale-95'
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {language === 'ta'
                  ? `உறுதிப்படுத்து & பில்லில் சேர் (${detectedItems.length})`
                  : `Confirm & Add to Bill (${detectedItems.length})`}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
