import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  RotateCcw,
  Send,
  Keyboard,
  Check,
  Settings,
  Key,
  ExternalLink,
  Loader2,
  Radio,
  Zap,
} from 'lucide-react';
import { MenuItem } from '../db/db';
import {
  RecognizedVoiceItem,
  parseTamilSpeechToItems,
  speakTamilConfirmation,
  stopTamilSpeech,
  isSpeechRecognitionSupported,
  isMediaRecorderSupported,
  startAudioRecording,
  AudioRecordingSession,
  transcribeAndParseWithGemini,
  transcribeWithGroqWhisper,
  getSavedGeminiKey,
  saveGeminiKey,
  getSavedGroqKey,
  saveGroqKey,
  verifyGeminiKey,
  getPreferredVoiceEngine,
  setPreferredVoiceEngine,
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
  // Voice engine & keys
  const [engine, setEngine] = useState<'gemini' | 'groq' | 'webspeech'>('gemini');
  const [geminiKey, setGeminiKey] = useState('');
  const [groqKey, setGroqKey] = useState('');
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [keyTesting, setKeyTesting] = useState(false);
  const [keyStatusMsg, setKeyStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Recording & Processing state
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessingAi, setIsProcessingAi] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Results
  const [manualSpeechText, setManualSpeechText] = useState('');
  const [detectedItems, setDetectedItems] = useState<RecognizedVoiceItem[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // References for cleanup
  const activeSessionRef = useRef<AudioRecordingSession | null>(null);
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const watchdogRef = useRef<any>(null);

  // Initialize on open
  useEffect(() => {
    if (!isOpen) {
      cleanupAll();
      return;
    }

    const savedGKey = getSavedGeminiKey();
    const savedGrKey = getSavedGroqKey();
    const savedEngine = getPreferredVoiceEngine();

    setGeminiKey(savedGKey);
    setGroqKey(savedGrKey);
    setEngine(savedEngine);
    setManualSpeechText('');
    setDetectedItems([]);
    setKeyStatusMsg(null);
    setIsRecording(false);
    setIsProcessingAi(false);

    // If no key is set yet, show friendly guidance
    if (!savedGKey && savedEngine === 'gemini') {
      setStatusMessage(
        language === 'ta'
          ? 'இலவச Google Gemini Key உள்ளிடவும் அல்லது கீழே உள்ள விரைவு உணவுப் பட்டன்களைத் தட்டவும்.'
          : 'Add your free Gemini API key or tap quick food items below.'
      );
    } else {
      setStatusMessage(
        language === 'ta'
          ? 'மைக்கை அழுத்தித் தமிழில் பேசவும் (எ.கா: "2 டீ, ஒரு மசால் வடை")'
          : 'Tap mic & speak items in Tamil (e.g. "2 Tea, 1 Vada")'
      );
    }

    return () => {
      cleanupAll();
    };
  }, [isOpen]);

  const cleanupAll = () => {
    stopTamilSpeech();
    if (activeSessionRef.current) {
      activeSessionRef.current.abort();
      activeSessionRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
    setIsRecording(false);
    setIsProcessingAi(false);
    setAudioLevel(0);
  };

  // Toggle voice engine
  const handleEngineChange = (newEngine: 'gemini' | 'groq' | 'webspeech') => {
    setEngine(newEngine);
    setPreferredVoiceEngine(newEngine);
    feedback.vibrate(25);
  };

  // Test & Save Gemini Key
  const handleSaveGeminiKey = async () => {
    if (!geminiKey.trim()) {
      saveGeminiKey('');
      setKeyStatusMsg({
        text: language === 'ta' ? 'சாவி அகற்றப்பட்டது' : 'Key removed',
        ok: false,
      });
      return;
    }

    setKeyTesting(true);
    setKeyStatusMsg(null);
    const res = await verifyGeminiKey(geminiKey);
    setKeyTesting(false);

    if (res.success) {
      saveGeminiKey(geminiKey);
      setKeyStatusMsg({
        text: language === 'ta' ? '✅ Gemini API சாவி வெற்றிகரமாக இணைக்கப்பட்டது!' : '✅ Gemini API Key verified!',
        ok: true,
      });
      feedback.playPaymentSuccessTone();
      setTimeout(() => setShowKeyConfig(false), 1200);
    } else {
      setKeyStatusMsg({
        text: `❌ ${res.message}`,
        ok: false,
      });
      feedback.vibrate(100);
    }
  };

  // Save Groq Key
  const handleSaveGroqKey = () => {
    saveGroqKey(groqKey);
    feedback.playPaymentSuccessTone();
    setShowKeyConfig(false);
  };

  // Start Voice Capture
  const handleStartCapture = async () => {
    stopTamilSpeech();
    cleanupAll();

    // Check if Gemini engine chosen
    if (engine === 'gemini') {
      if (!geminiKey.trim()) {
        setShowKeyConfig(true);
        setStatusMessage(
          language === 'ta'
            ? 'Gemini இலவச API சாவி தேவை. கீழே உள்ளிடவும் (100% இலவசம்).'
            : 'Gemini free API key required. Enter below.'
        );
        feedback.vibrate(50);
        return;
      }

      try {
        setIsRecording(true);
        setRecordSeconds(0);
        setStatusMessage(language === 'ta' ? 'பேசுங்கள்... கேட்கிறது (Listening...)' : 'Speak now in Tamil...');
        feedback.vibrate(30);

        const session = await startAudioRecording((level) => {
          setAudioLevel(level);
        });
        activeSessionRef.current = session;

        // Record timer with 6-second auto-stop to prevent hanging
        let secs = 0;
        timerRef.current = setInterval(() => {
          secs += 1;
          setRecordSeconds(secs);
          if (secs >= 6) {
            handleStopCapture();
          }
        }, 1000);
      } catch (err: any) {
        console.error('Mic start error:', err);
        setIsRecording(false);
        setStatusMessage(
          language === 'ta'
            ? 'மைக் அனுமதி தேவை. அமைப்புகளில் மைக்ரோஃபோனை அனுமதிக்கவும்.'
            : 'Microphone permission needed. Please grant in settings.'
        );
        feedback.vibrate(100);
      }
      return;
    }

    // Fallback: Local Web Speech API
    if (engine === 'webspeech') {
      if (!isSpeechRecognitionSupported()) {
        setStatusMessage(
          language === 'ta'
            ? 'உங்கள் உலாவியில் Web Speech இல்லை. Gemini AI முறையைத் தேர்ந்தெடுக்கவும்.'
            : 'Web Speech not supported. Select Gemini AI mode.'
        );
        return;
      }

      try {
        const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechClass();
        recognition.lang = 'ta-IN';
        recognition.continuous = false; // single utterance prevents Android lockup
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsRecording(true);
          setStatusMessage(language === 'ta' ? 'பேசுங்கள் (Web Speech)...' : 'Speak now...');
          feedback.vibrate(30);
        };

        recognition.onresult = (event: any) => {
          let text = '';
          for (let i = 0; i < event.results.length; i++) {
            text += event.results[i][0].transcript + ' ';
          }
          const clean = text.trim();
          setManualSpeechText(clean);
          handleParseText(clean);
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech err:', e);
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        // Watchdog: auto-stop after 6 seconds to prevent freeze
        watchdogRef.current = setTimeout(() => {
          try {
            recognition.stop();
          } catch (e) {}
          setIsRecording(false);
        }, 6000);

        recognitionRef.current = recognition;
        recognition.start();
      } catch (e) {
        setIsRecording(false);
      }
    }
  };

  // Stop Capture & Process Audio with AI
  const handleStopCapture = async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }

    setIsRecording(false);
    setAudioLevel(0);
    feedback.vibrate(30);

    const session = activeSessionRef.current;
    activeSessionRef.current = null;

    if (!session) return;

    try {
      setIsProcessingAi(true);
      setStatusMessage(
        language === 'ta'
          ? '🤖 AI ஆராய்கிறது... (Gemini AI Analyzing Tamil Voice...)'
          : '🤖 AI Analyzing Tamil voice...'
      );

      const audioBlob = await session.stop();

      if (engine === 'gemini') {
        const res = await transcribeAndParseWithGemini(audioBlob, menuItems, geminiKey);
        setIsProcessingAi(false);

        if (res.error) {
          setStatusMessage(`⚠️ ${res.error}`);
          feedback.vibrate(80);
          return;
        }

        if (res.rawTranscript) {
          setManualSpeechText((prev) => (prev ? `${prev}, ${res.rawTranscript}` : res.rawTranscript));
        }

        if (res.items.length > 0) {
          mergeNewItems(res.items);
          setStatusMessage(
            language === 'ta'
              ? `✅ ${res.items.length} பொருட்கள் அடையாளம் காணப்பட்டன!`
              : `✅ ${res.items.length} items recognized!`
          );
          feedback.playPaymentSuccessTone();
        } else {
          setStatusMessage(
            language === 'ta'
              ? 'பொருட்கள் புரியவில்லை. மீண்டும் தெளிவாகப் பேசவும் அல்லது கீழேயுள்ள பட்டன்களைத் தட்டவும்.'
              : 'Could not match items. Speak clearly or tap food buttons below.'
          );
        }
      } else if (engine === 'groq') {
        const groqRes = await transcribeWithGroqWhisper(audioBlob, groqKey);
        setIsProcessingAi(false);

        if (groqRes.error) {
          setStatusMessage(`⚠️ ${groqRes.error}`);
          return;
        }

        if (groqRes.transcript) {
          setManualSpeechText(groqRes.transcript);
          handleParseText(groqRes.transcript);
          feedback.playPaymentSuccessTone();
        }
      }
    } catch (err: any) {
      setIsProcessingAi(false);
      setStatusMessage('⚠️ Audio processing error: ' + (err?.message || 'Try again'));
      console.error(err);
    }
  };

  // Helper to merge detected items safely
  const mergeNewItems = (newItems: RecognizedVoiceItem[]) => {
    setDetectedItems((prev) => {
      const map = new Map<string, RecognizedVoiceItem>();
      prev.forEach((p) => map.set(p.item.id, p));
      newItems.forEach((n) => {
        const existing = map.get(n.item.id);
        if (existing) {
          map.set(n.item.id, { item: n.item, qty: existing.qty + n.qty });
        } else {
          map.set(n.item.id, n);
        }
      });
      return Array.from(map.values());
    });
  };

  // Parses any Tamil spoken text into recognized items
  const handleParseText = (text: string) => {
    if (!text.trim()) return;
    const parsed = parseTamilSpeechToItems(text, menuItems);
    if (parsed.length > 0) {
      mergeNewItems(parsed);
      feedback.vibrate(25);
    }
  };

  // 1-Tap Quick Spoken Chip Trigger
  const handleTapQuickPhrase = (phraseText: string) => {
    setManualSpeechText((prev) => (prev ? `${prev}, ${phraseText}` : phraseText));
    handleParseText(phraseText);
    feedback.vibrate(30);
  };

  // Adjust item quantity
  const handleAdjustQty = (itemId: string, delta: number) => {
    setDetectedItems((prev) =>
      prev
        .map((p) => {
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
    setDetectedItems((prev) => prev.filter((p) => p.item.id !== itemId));
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
  const handleConfirmAndAdd = () => {
    if (detectedItems.length === 0) return;

    const itemsToAdd = detectedItems.map((d) => ({
      id: d.item.id,
      qty: d.qty,
    }));

    onAddItemsToCart(itemsToAdd);
    feedback.playPaymentSuccessTone();
    handleSpeakConfirmation();
    cleanupAll();
    onClose();
  };

  if (!isOpen) return null;

  // Popular quick Tamil food chips
  const popularPhrases = [
    { text: '2 டீ', ta: '2 டீ', qty: 2 },
    { text: '1 காபி', ta: '1 காபி', qty: 1 },
    { text: '1 வடை', ta: '1 வடை', qty: 1 },
    { text: '4 இட்லி', ta: '4 இட்லி', qty: 4 },
    { text: '1 தோசை', ta: '1 தோசை', qty: 1 },
    { text: '2 பரோட்டா', ta: '2 பரோட்டா', qty: 2 },
    { text: '1 சாப்பாடு', ta: '1 சாப்பாடு', qty: 1 },
    { text: '2 சமோசா', ta: '2 சமோசா', qty: 2 },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-500/50 rounded-3xl shadow-2xl text-white flex flex-col max-h-[94vh] overflow-hidden">
        {/* Header */}
        <div className="p-3.5 sm:p-4 bg-gradient-to-r from-red-950 via-brand-900 to-slate-900 border-b border-amber-500/30 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black transition-all ${
                isRecording
                  ? 'bg-red-600 text-white animate-pulse shadow-[0_0_20px_#dc2626]'
                  : isProcessingAi
                  ? 'bg-amber-400 text-slate-950 animate-spin shadow-gold-sm'
                  : 'bg-gold-gradient text-slate-950 shadow-gold-sm'
              }`}
            >
              {isProcessingAi ? <Sparkles className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-tamil-varthagam font-black text-base text-amber-200">
                  {language === 'ta' ? 'AI தமிழ் குரல் பில்லிங்' : 'AI Tamil Voice Billing'}
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/40">
                  {engine === 'gemini' ? 'Gemini AI' : engine === 'groq' ? 'Groq Whisper' : 'Local Mic'}
                </span>
              </div>
              <p className="text-[11px] text-stone-300">
                {language === 'ta'
                  ? 'தமிழில் பேசினால் நொடியில் பில் உருவகமாகும்'
                  : 'Speak items in Tamil for lightning-fast billing'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowKeyConfig((prev) => !prev)}
              className={`p-2 rounded-xl transition ${
                showKeyConfig ? 'bg-amber-400 text-slate-950' : 'text-stone-300 hover:text-white hover:bg-white/10'
              }`}
              title="API Key Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                cleanupAll();
                onClose();
              }}
              className="p-2 text-stone-400 hover:text-white rounded-xl hover:bg-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* API Key Configuration Drawer */}
        {showKeyConfig && (
          <div className="p-3.5 bg-slate-950 border-b border-amber-500/30 text-xs space-y-3 animate-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" />
                <span>{language === 'ta' ? 'குரல் API அமைப்புகள் (100% இலவசம்)' : 'Voice API Settings (100% Free)'}</span>
              </span>
              <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-lg">
                <button
                  onClick={() => handleEngineChange('gemini')}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                    engine === 'gemini' ? 'bg-amber-400 text-slate-950' : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Gemini Flash
                </button>
                <button
                  onClick={() => handleEngineChange('webspeech')}
                  className={`px-2 py-1 rounded text-[10px] font-bold transition ${
                    engine === 'webspeech' ? 'bg-amber-400 text-slate-950' : 'text-stone-300 hover:text-white'
                  }`}
                >
                  Local Mic
                </button>
              </div>
            </div>

            {engine === 'gemini' && (
              <div className="space-y-2">
                <p className="text-[11px] text-stone-300">
                  {language === 'ta'
                    ? 'Google AI Studio-வில் கட்டணம் இன்றி வாழ்நாள் இலவச API சாவி பெறலாம் (15 RPM / 1500 req/day).'
                    : 'Get 100% Free Gemini API key from Google AI Studio (zero credit card, 15 RPM free).'}
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="AIzaSy..."
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    className="flex-1 bg-slate-900 border border-amber-500/40 rounded-xl px-3 py-2 text-white font-mono text-xs placeholder:text-stone-500 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={handleSaveGeminiKey}
                    disabled={keyTesting}
                    className="bg-gold-gradient text-slate-950 font-bold px-3 py-2 rounded-xl text-xs hover:brightness-105 transition flex items-center gap-1 disabled:opacity-50"
                  >
                    {keyTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>{language === 'ta' ? 'சரிபார்' : 'Verify'}</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] pt-1">
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-400 hover:underline flex items-center gap-1 font-bold"
                  >
                    <span>{language === 'ta' ? '🔗 இலவச Google Key பெற (இங்கே தட்டவும்)' : '🔗 Get Free Gemini API Key'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  {geminiKey && (
                    <button
                      onClick={() => {
                        setGeminiKey('');
                        saveGeminiKey('');
                      }}
                      className="text-rose-400 hover:underline"
                    >
                      {language === 'ta' ? 'அகற்று' : 'Clear Key'}
                    </button>
                  )}
                </div>

                {keyStatusMsg && (
                  <p className={`text-[11px] font-semibold ${keyStatusMsg.ok ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {keyStatusMsg.text}
                  </p>
                )}
              </div>
            )}

            {engine === 'webspeech' && (
              <p className="text-[11px] text-stone-300 bg-white/5 p-2 rounded-xl">
                {language === 'ta'
                  ? 'லோக்கல் மைக் முறை சாதனத்தின் இயல்பு பேச்சு அங்கீகாரத்தைப் பயன்படுத்துகிறது (API Key தேவையில்லை).'
                  : 'Uses on-device native speech recognition without requiring any API keys.'}
              </p>
            )}
          </div>
        )}

        {/* Scrollable Modal Content */}
        <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3.5">
          {/* Main Push/Tap to Speak Card */}
          <div className="p-4 rounded-3xl bg-slate-950 border border-amber-500/40 text-center relative overflow-hidden shadow-inner">
            {/* Visualizer sound waves */}
            {isRecording && (
              <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-20 pointer-events-none">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-amber-400 rounded-full transition-all duration-75"
                    style={{
                      height: `${Math.max(10, Math.min(100, audioLevel * (0.5 + Math.sin(i) * 0.5)))}%`,
                    }}
                  />
                ))}
              </div>
            )}

            <div className="relative z-10 flex flex-col items-center">
              <button
                onClick={() => {
                  if (isRecording) {
                    handleStopCapture();
                  } else {
                    handleStartCapture();
                  }
                }}
                disabled={isProcessingAi}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all transform active:scale-95 touch-target ${
                  isRecording
                    ? 'bg-rose-600 text-white animate-pulse shadow-[0_0_30px_#e11d48] scale-105'
                    : isProcessingAi
                    ? 'bg-amber-500/30 text-amber-300 border-2 border-amber-400 animate-pulse'
                    : 'bg-gold-gradient text-slate-950 shadow-gold-md hover:brightness-110'
                }`}
                title={isRecording ? 'Stop' : 'Start'}
              >
                {isProcessingAi ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="w-8 h-8 animate-bounce" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </button>

              <div className="mt-3">
                <p className="text-sm font-bold text-amber-200">
                  {isProcessingAi
                    ? (language === 'ta' ? 'AI ஆராய்கிறது...' : 'Processing with AI...')
                    : isRecording
                    ? (language === 'ta' ? `பேசுங்கள் (${recordSeconds} வி / 6 வி) - நிறுத்த தட்டவும்` : `Listening (${recordSeconds}s / 6s) - Tap to Stop`)
                    : (language === 'ta' ? 'பேச மைக்கை அழுத்தவும்' : 'Tap Mic to Speak')}
                </p>
                <p className="text-xs text-stone-300 mt-0.5">
                  {statusMessage || (language === 'ta' ? 'உதாரணம்: "2 டீ, ஒரு மசால் வடை"' : 'e.g. "2 Tea, 1 Vada"')}
                </p>
              </div>
            </div>
          </div>

          {/* Transcript / Manual Input (supports Gboard mic) */}
          <div>
            <label className="text-xs font-bold text-amber-200 flex items-center justify-between mb-1">
              <span className="flex items-center gap-1">
                <Keyboard className="w-3.5 h-3.5" />
                <span>{language === 'ta' ? 'பேசிய உரை / விசைப்பலகை மைக் (🎤):' : 'Speech Transcript / Keyboard Mic:'}</span>
              </span>
              <span className="text-[10px] text-stone-400">Gboard mic ready</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={manualSpeechText}
                onChange={(e) => {
                  setManualSpeechText(e.target.value);
                  handleParseText(e.target.value);
                }}
                placeholder={
                  language === 'ta'
                    ? 'இங்கே பேசலாம் அல்லது தட்டச்சு செய்யலாம்...'
                    : 'Type or speak via keyboard mic...'
                }
                className="w-full bg-slate-950 border border-amber-500/40 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder:text-stone-500 focus:outline-none focus:border-amber-400 font-tamil-varthagam"
              />
              {manualSpeechText && (
                <button
                  onClick={() => setManualSpeechText('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Tap Tamil Food Chips */}
          <div>
            <span className="text-[11px] font-bold text-stone-300 block mb-1.5">
              {language === 'ta' ? '⚡ விரைவு பட்டன்கள் (Quick Tap):' : '⚡ Quick Tap Items:'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {popularPhrases.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTapQuickPhrase(chip.text)}
                  className="bg-white/10 hover:bg-amber-400 hover:text-slate-950 text-stone-200 text-xs font-bold px-3 py-1.5 rounded-xl border border-white/10 active:scale-95 transition"
                >
                  {chip.text}
                </button>
              ))}
            </div>
          </div>

          {/* Detected Items Cart Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold text-amber-200">
                {language === 'ta' ? 'அடையாளம் காணப்பட்ட பொருட்கள்:' : 'Recognized Order Items:'} ({detectedItems.length})
              </span>
              {detectedItems.length > 0 && (
                <button
                  onClick={() => setDetectedItems([])}
                  className="text-[11px] text-rose-400 hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>{language === 'ta' ? 'அழி' : 'Clear'}</span>
                </button>
              )}
            </div>

            {detectedItems.length === 0 ? (
              <div className="p-4 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center text-xs text-stone-400">
                {language === 'ta'
                  ? 'பொருட்கள் இன்னும் சேர்க்கப்படவில்லை. மைக்கை அழுத்திப் பேசவும்.'
                  : 'No items recognized yet. Tap mic to speak.'}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {detectedItems.map((entry) => (
                  <div
                    key={entry.item.id}
                    className="p-2.5 rounded-2xl bg-slate-950 border border-amber-500/30 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{entry.item.emoji || '🍽️'}</span>
                      <div>
                        <p className="text-xs font-bold text-white">
                          {entry.item.nameTa}
                          {entry.item.nameEn && entry.item.nameEn !== entry.item.nameTa && (
                            <span className="text-[10px] text-stone-400 font-normal ml-1">
                              ({entry.item.nameEn})
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] font-mono text-amber-300">
                          {formatPaise(entry.item.pricePaise)} × {entry.qty} ={' '}
                          <span className="font-bold">{formatPaise(entry.item.pricePaise * entry.qty)}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleAdjustQty(entry.item.id, -1)}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-stone-200 active:scale-95"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-bold text-xs text-amber-300">
                        {entry.qty}
                      </span>
                      <button
                        onClick={() => handleAdjustQty(entry.item.id, 1)}
                        className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-stone-200 active:scale-95"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemoveItem(entry.item.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-400 ml-1"
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

        {/* Modal Footer with Total & Confirm Button */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-amber-500/30 flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase font-bold text-stone-400 block">
              {language === 'ta' ? 'மொத்தம்' : 'TOTAL'}
            </span>
            <span className="text-xl font-black text-amber-400 font-display">
              {formatPaise(totalPaise)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {detectedItems.length > 0 && (
              <button
                onClick={handleSpeakConfirmation}
                disabled={isSpeaking}
                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 transition"
                title={language === 'ta' ? 'குரல் உறுதிப்படுத்தல்' : 'Voice Confirmation'}
              >
                <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-amber-400 animate-pulse' : ''}`} />
              </button>
            )}

            <button
              onClick={handleConfirmAndAdd}
              disabled={detectedItems.length === 0}
              className="bg-gold-gradient text-slate-950 font-black px-4 py-2.5 rounded-xl shadow-gold-sm hover:brightness-105 active:scale-95 transition flex items-center gap-1.5 text-xs disabled:opacity-50 touch-target"
            >
              <Check className="w-4 h-4" />
              <span>{language === 'ta' ? 'பில்லில் சேர்க்க' : 'Add to Bill'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
