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
  Send,
  Keyboard,
  Check,
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
  const [speechSupported, setSpeechSupported] = useState(false);
  const [manualSpeechText, setManualSpeechText] = useState('');
  const [detectedItems, setDetectedItems] = useState<RecognizedVoiceItem[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [micStatusMsg, setMicStatusMsg] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition on Open
  useEffect(() => {
    if (!isOpen) {
      stopListening();
      stopTamilSpeech();
      return;
    }

    setManualSpeechText('');
    setDetectedItems([]);
    setMicStatusMsg(null);

    const supported = isSpeechRecognitionSupported();
    setSpeechSupported(supported);

    if (supported) {
      startListening();
    } else {
      setMicStatusMsg(
        language === 'ta'
          ? 'குறிப்பு: உங்கள் போனில் தமிழ் விசைப்பலகை (Gboard Mic 🎤) அல்லது கீழே உள்ள விரைவு பட்டன்களைப் பயன்படுத்தலாம்.'
          : 'Note: You can use your mobile keyboard Tamil Mic 🎤 or tap the quick speech buttons below.'
      );
    }

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

      if (!SpeechRecognitionClass) {
        setSpeechSupported(false);
        return;
      }

      // Stop previous instance if running
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {}
      }

      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'ta-IN'; // Tamil (India)
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setMicStatusMsg(
          language === 'ta'
            ? 'மைக் தயார்! பேசுங்கள் (எ.கா: 2 டீ, ஒரு வடை)...'
            : 'Listening! Speak items (e.g. 2 Tea, 1 Vada)...'
        );
        feedback.vibrate(25);
      };

      recognition.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        const clean = fullTranscript.trim();
        setManualSpeechText(clean);
        handleParseText(clean);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition warning:', event.error);
        if (event.error === 'not-allowed') {
          setMicStatusMsg(
            language === 'ta'
              ? 'மைக்ரோஃபோன் அனுமதி மறுக்கப்பட்டது. செட்டிங்ஸில் அனுமதிக்கவும் அல்லது கீழே உள்ள விரைவு பட்டன்களை அழுத்தவும்.'
              : 'Microphone permission blocked. Enable in settings or use quick buttons below.'
          );
          setIsListening(false);
        } else if (event.error === 'no-speech') {
          // Expected in noisy room, keep active
        } else {
          setMicStatusMsg(
            language === 'ta'
              ? 'குரல் உள்ளீடு: கீழே உள்ள பெட்டியில் பேசலாம் அல்லது விரைவு பட்டன்களை அழுத்தவும்.'
              : 'Voice Input: Speak via keyboard mic or tap quick buttons below.'
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e: any) {
      console.warn('Speech start error:', e);
      setIsListening(false);
      setSpeechSupported(false);
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

  // Parses any Tamil spoken text into recognized items
  const handleParseText = (text: string) => {
    if (!text.trim()) return;
    const parsed = parseTamilSpeechToItems(text, menuItems);
    if (parsed.length > 0) {
      setDetectedItems(prev => {
        // Merge or replace
        const map = new Map<string, RecognizedVoiceItem>();
        // Add existing items
        prev.forEach(p => map.set(p.item.id, p));
        // Add or update new items
        parsed.forEach(p => map.set(p.item.id, p));
        return Array.from(map.values());
      });
      feedback.vibrate(25);
    }
  };

  // 1-Tap Quick Spoken Chip Trigger
  const handleTapQuickPhrase = (phraseText: string) => {
    setManualSpeechText(prev => (prev ? `${prev}, ${phraseText}` : phraseText));
    handleParseText(phraseText);
    feedback.vibrate(30);
  };

  // Add individual item directly
  const handleAddDirectItem = (item: MenuItem, qty: number = 1) => {
    setDetectedItems(prev => {
      const existing = prev.find(p => p.item.id === item.id);
      if (existing) {
        return prev.map(p =>
          p.item.id === item.id ? { ...p, qty: p.qty + qty } : p
        );
      }
      return [...prev, { item, qty }];
    });
    feedback.vibrate(30);
  };

  // Adjust item quantity
  const handleAdjustQty = (itemId: string, delta: number) => {
    setDetectedItems(prev =>
      prev
        .map(p => {
          if (p.item.id === itemId) {
            const nextQty = p.qty + delta;
            return nextQty > 0 ? { ...p, qty: nextQty } : null;
          }
          return p;
        })
        .filter((p): p is RecognizedVoiceItem => p !== null)
    );
    feedback.vibrate(20);
  };

  // Remove item
  const handleRemoveItem = (itemId: string) => {
    setDetectedItems(prev => prev.filter(p => p.item.id !== itemId));
    feedback.vibrate(20);
  };

  // Calculate Total in Paise
  const totalPaise = detectedItems.reduce(
    (sum, d) => sum + d.item.pricePaise * d.qty,
    0
  );

  // Play Tamil TTS voice confirmation
  const handleSpeakConfirmation = async () => {
    if (detectedItems.length === 0) return;
    setIsSpeaking(true);
    feedback.vibrate(30);
    try {
      await speakTamilConfirmation(detectedItems, paiseToRupees(totalPaise));
    } finally {
      setIsSpeaking(false);
    }
  };

  // Add all detected items to the main cart and close
  const handleConfirmAndAdd = async () => {
    if (detectedItems.length === 0) return;

    // Convert to cart line items
    const itemsToAdd = detectedItems.map(d => ({
      id: d.item.id,
      qty: d.qty,
    }));

    onAddItemsToCart(itemsToAdd);
    feedback.playPaymentSuccessTone();

    // Optional audio confirmation
    handleSpeakConfirmation();

    stopListening();
    onClose();
  };

  if (!isOpen) return null;

  // Prepare popular quick speech phrases
  const popularPhrases = [
    { text: '2 டீ', ta: '2 டீ', qty: 2, keyword: 'டீ' },
    { text: '1 காபி', ta: '1 காபி', qty: 1, keyword: 'காபி' },
    { text: '1 வடை', ta: '1 வடை', qty: 1, keyword: 'வடை' },
    { text: '4 இட்லி', ta: '4 இட்லி', qty: 4, keyword: 'இட்லி' },
    { text: '1 தோசை', ta: '1 தோசை', qty: 1, keyword: 'தோசை' },
    { text: '1 பூரி', ta: '1 பூரி', qty: 1, keyword: 'பூரி' },
    { text: '1 பார்சல் சாப்பாடு', ta: '1 சாப்பாடு', qty: 1, keyword: 'சாப்பாடு' },
    { text: '2 சமோசா', ta: '2 சமோசா', qty: 2, keyword: 'சமோசா' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/85 backdrop-blur-sm p-2 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl text-white flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-red-950 via-brand-900 to-slate-900 border-b border-amber-500/30 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black transition-all ${
                isListening
                  ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_#dc2626]'
                  : 'bg-gold-gradient text-slate-950 shadow-gold-sm'
              }`}
            >
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-tamil-varthagam font-black text-base text-amber-200">
                  {language === 'ta' ? 'AI குரல் பில்லிங் (Voice Billing)' : 'AI Voice Billing'}
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/40">
                  தமிழ்
                </span>
              </div>
              <p className="text-[11px] text-stone-300">
                {language === 'ta'
                  ? 'தமிழில் பேசினால் நொடியில் பில் உருவகமாகும்'
                  : 'Speak food items in Tamil for instant bill'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopListening();
              stopTamilSpeech();
              onClose();
            }}
            className="p-1.5 text-stone-400 hover:text-white rounded-full hover:bg-white/10 touch-target transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5">
          {/* Active Listening Mic Banner */}
          <div className="p-3 rounded-2xl bg-slate-950 border border-amber-500/30 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => {
                  if (isListening) {
                    stopListening();
                  } else {
                    startListening();
                  }
                }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all touch-target ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse shadow-[0_0_20px_#e11d48]'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                }`}
                title={isListening ? 'Stop Mic' : 'Start Mic'}
              >
                {isListening ? <Mic className="w-6 h-6 animate-bounce" /> : <MicOff className="w-5 h-5" />}
              </button>
              <div>
                <p className="text-xs font-bold text-amber-200">
                  {isListening
                    ? (language === 'ta' ? 'மைக் இயங்குகிறது... பேசவும்' : 'Listening... Speak now')
                    : (language === 'ta' ? 'மைக் தயாராக உள்ளது (தட்டவும்)' : 'Tap mic to start speaking')}
                </p>
                <p className="text-[10px] text-stone-400">
                  {micStatusMsg || (language === 'ta' ? 'உதாரணம்: "2 டீ, ஒரு மசால் வடை"' : 'e.g. "2 Tea, 1 Vada"')}
                </p>
              </div>
            </div>

            {isListening && (
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
            )}
          </div>

          {/* Real-time Voice / Gboard Mic Input Field (100% Android Compatible) */}
          <div>
            <label className="text-xs font-bold text-amber-200 flex items-center justify-between mb-1">
              <span className="flex items-center gap-1">
                <Keyboard className="w-3.5 h-3.5" />
                <span>{language === 'ta' ? 'பேசிய உரை / விசைப்பலகை மைக் (🎤):' : 'Speech Transcript / Keyboard Mic:'}</span>
              </span>
              <span className="text-[10px] text-stone-400 font-normal">Gboard mic supported</span>
            </label>

            <div className="relative">
              <input
                type="text"
                value={manualSpeechText}
                onChange={e => {
                  setManualSpeechText(e.target.value);
                  handleParseText(e.target.value);
                }}
                placeholder={
                  language === 'ta'
                    ? 'இங்கு தமிழில் பேசவும் அல்லது தட்டச்சு செய்யவும்...'
                    : 'Speak or type items here (e.g. 2 tea, 1 vada)...'
                }
                style={{
                  color: '#000000',
                  WebkitTextFillColor: '#000000',
                  backgroundColor: '#ffffff',
                  caretColor: '#000000',
                }}
                className="w-full p-3 pr-10 rounded-xl border-2 border-amber-400/80 bg-white text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 shadow-sm"
              />
              {manualSpeechText && (
                <button
                  onClick={() => {
                    setManualSpeechText('');
                    setDetectedItems([]);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800 p-1 rounded-full touch-target"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Spoken-Items Chips Deck (விரைவு குரல் பட்டன்கள்) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-stone-300">
                {language === 'ta' ? 'விரைவு குரல் ஆர்டர்கள் (1-Tap Speak):' : 'Quick Voice Phrases:'}
              </span>
              <span className="text-[10px] text-amber-400">நொடியில் சேர்க்க</span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {popularPhrases.map((phrase, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTapQuickPhrase(phrase.text)}
                  className="bg-white/10 hover:bg-amber-500/20 active:scale-95 text-stone-200 hover:text-amber-200 border border-white/15 hover:border-amber-400/40 px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 touch-target"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{phrase.ta}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Detected Items In Voice Bill */}
          <div className="bg-slate-950/80 border border-amber-500/30 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-amber-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>
                  {language === 'ta' ? 'அடையாளம் காணப்பட்ட பொருட்கள்' : 'Detected Food Items'} ({detectedItems.length})
                </span>
              </div>
              {detectedItems.length > 0 && (
                <button
                  onClick={() => setDetectedItems([])}
                  className="text-[10px] text-rose-400 hover:text-rose-300 underline"
                >
                  {language === 'ta' ? 'அனைத்தையும் அழி' : 'Clear All'}
                </button>
              )}
            </div>

            {detectedItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-400">
                <p>{language === 'ta' ? 'பொருட்கள் இன்னும் கண்டறியப்படவில்லை.' : 'No items detected yet.'}</p>
                <p className="text-[11px] text-amber-300/80 mt-1">
                  {language === 'ta'
                    ? 'மைக்கில் பேசவும் அல்லது மேலே உள்ள விரைவு பட்டன்களை அழுத்தவும்.'
                    : 'Speak into mic or tap quick speech chips above.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {detectedItems.map(d => (
                  <div
                    key={d.item.id}
                    className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl p-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{d.item.emoji || '🍽️'}</span>
                      <div>
                        <h4 className="font-tamil-varthagam font-bold text-xs text-stone-100">
                          {language === 'ta' ? d.item.nameTa : d.item.nameEn}
                        </h4>
                        <span className="text-[11px] text-amber-300 font-mono">
                          {formatPaise(d.item.pricePaise)} × {d.qty} ={' '}
                          <strong className="text-white">
                            {formatPaise(d.item.pricePaise * d.qty)}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAdjustQty(d.item.id, -1)}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center active:scale-95 touch-target"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-black text-xs text-amber-300 w-5 text-center">
                        {d.qty}
                      </span>
                      <button
                        onClick={() => handleAdjustQty(d.item.id, 1)}
                        className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-bold flex items-center justify-center active:scale-95 touch-target shadow-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveItem(d.item.id)}
                        className="text-stone-400 hover:text-rose-400 p-1 ml-1 touch-target"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Total Summary */}
                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs text-stone-300 font-bold">
                    {language === 'ta' ? 'குரல் பில் மொத்தம்:' : 'Total Voice Bill:'}
                  </span>
                  <span className="text-lg font-black text-amber-300 font-mono">
                    {formatPaise(totalPaise)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-amber-500/30 flex gap-2">
          {/* Tamil TTS Audio Button */}
          <button
            onClick={handleSpeakConfirmation}
            disabled={detectedItems.length === 0 || isSpeaking}
            className="w-1/3 bg-white/10 hover:bg-white/20 text-amber-200 border border-amber-500/40 font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 touch-target active:scale-95 disabled:opacity-40 transition"
            title="Tamil Voice Confirmation"
          >
            {isSpeaking ? <Volume2 className="w-4 h-4 animate-bounce" /> : <Volume2 className="w-4 h-4" />}
            <span>{language === 'ta' ? 'குரல் உறுதி' : 'Voice Confirm'}</span>
          </button>

          {/* Confirm & Add to Cart Button */}
          <button
            onClick={handleConfirmAndAdd}
            disabled={detectedItems.length === 0}
            className="w-2/3 bg-gold-gradient text-slate-950 font-black text-xs sm:text-sm py-3 px-3 rounded-2xl shadow-gold-sm hover:brightness-105 active:scale-95 transition flex items-center justify-center gap-2 touch-target disabled:opacity-40"
          >
            <CheckCircle2 className="w-4 h-4 text-slate-950" />
            <span>
              {language === 'ta'
                ? `பில்லில் சேர்க்க (${formatPaise(totalPaise)})`
                : `Add to Bill (${formatPaise(totalPaise)})`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
