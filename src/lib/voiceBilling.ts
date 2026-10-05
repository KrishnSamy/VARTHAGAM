/**
 * AI Voice-Based Tamil Billing Engine for Varthagam.
 * Listens to colloquial Tamil speech from customers/owners,
 * parses quantities and food items within milliseconds,
 * and confirms back to the customer via Tamil Voice Synthesis (TTS).
 */

import { MenuItem } from '../db/db';

export interface RecognizedVoiceItem {
  item: MenuItem;
  qty: number;
}

// Colloquial Tamil & English number word mapping
const TAMIL_NUMBER_MAP: Record<string, number> = {
  // 1
  'ஒரு': 1,
  'ஒன்னு': 1,
  'ஒன்று': 1,
  'ஒர்': 1,
  'ஒண்ணு': 1,
  '1': 1,
  'one': 1,
  // 2
  'ரெண்டு': 2,
  'இரண்டு': 2,
  'ரெண்ட': 2,
  '2': 2,
  'two': 2,
  // 3
  'மூணு': 3,
  'மூன்று': 3,
  '3': 3,
  'three': 3,
  // 4
  'நாலு': 4,
  'நான்கு': 4,
  '4': 4,
  'four': 4,
  // 5
  'அஞ்சு': 5,
  'ஐந்து': 5,
  '5': 5,
  'five': 5,
  // 6
  'ஆறு': 6,
  '6': 6,
  'six': 6,
  // 7
  'ஏழு': 7,
  '7': 7,
  'seven': 7,
  // 8
  'எட்டு': 8,
  '8': 8,
  'eight': 8,
  // 9
  'ஒன்பது': 9,
  '9': 9,
  'nine': 9,
  // 10
  'பத்து': 10,
  '10': 10,
  'ten': 10,
  // 12
  'பன்னிரண்டு': 12,
  '12': 12,
  // 15
  'பதினைஞ்சு': 15,
  'பதினைந்து': 15,
  '15': 15,
  // 20
  'இருபது': 20,
  '20': 20,
};

// Common Tamil filler words to ignore
const TAMIL_FILLERS = new Set([
  'எனக்கு', 'கொடுங்க', 'குடுங்க', 'போடுங்க', 'வேணும்', 'வேண்டாம்',
  'அப்புறம்', 'அடுத்து', 'ப்ளீஸ்', 'அண்ணா', 'தம்பி', 'ஐயா', 'சார்',
  'பார்சல்', 'சாப்பிட', 'கொண்டுவாங்க', 'எடுங்க', 'சொல்லுங்க', 'போதும்'
]);

/**
 * Normalizes Tamil string for matching (strips punctuation, extra spaces).
 */
export function normalizeTamil(text: string): string {
  return text
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Checks if browser supports Speech Recognition
 */
export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
}

/**
 * Parses spoken Tamil text into recognized menu items and quantities.
 * Designed to execute in <5 milliseconds on mobile devices.
 */
export function parseTamilSpeechToItems(
  spokenText: string,
  menuItems: MenuItem[]
): RecognizedVoiceItem[] {
  if (!spokenText.trim() || !menuItems.length) return [];

  const normalized = normalizeTamil(spokenText);
  const words = normalized.split(' ').filter(w => !TAMIL_FILLERS.has(w));
  const results: RecognizedVoiceItem[] = [];
  const matchedItemIds = new Set<string>();

  // Helper to test if a phrase matches an item
  const findMatchingItem = (phrase: string): MenuItem | undefined => {
    const cleanPhrase = phrase.toLowerCase().trim();
    if (!cleanPhrase || cleanPhrase.length < 2) return undefined;

    // 1. Exact match on Tamil or English name
    const exact = menuItems.find(
      i =>
        i.nameTa.toLowerCase() === cleanPhrase ||
        i.nameEn.toLowerCase() === cleanPhrase
    );
    if (exact) return exact;

    // 2. Substring match
    const sub = menuItems.find(
      i =>
        i.nameTa.toLowerCase().includes(cleanPhrase) ||
        cleanPhrase.includes(i.nameTa.toLowerCase()) ||
        i.nameEn.toLowerCase().includes(cleanPhrase) ||
        cleanPhrase.includes(i.nameEn.toLowerCase())
    );
    if (sub) return sub;

    // 3. Known colloquial aliases
    if (cleanPhrase.includes('டீ') || cleanPhrase.includes('தேநீர்') || cleanPhrase === 'tea') {
      return menuItems.find(i => i.nameTa.includes('டீ') || i.nameEn.toLowerCase().includes('tea'));
    }
    if (cleanPhrase.includes('காபி') || cleanPhrase.includes('coffee')) {
      return menuItems.find(i => i.nameTa.includes('காபி') || i.nameEn.toLowerCase().includes('coffee'));
    }
    if (cleanPhrase.includes('வடை') || cleanPhrase.includes('வடா') || cleanPhrase.includes('vada')) {
      return menuItems.find(i => i.nameTa.includes('வடை') || i.nameEn.toLowerCase().includes('vada'));
    }
    if (cleanPhrase.includes('இட்லி') || cleanPhrase.includes('idli') || cleanPhrase.includes('idly')) {
      return menuItems.find(i => i.nameTa.includes('இட்லி') || i.nameEn.toLowerCase().includes('idli'));
    }
    if (cleanPhrase.includes('தோசை') || cleanPhrase.includes('தோச') || cleanPhrase.includes('ரோஸ்ட்') || cleanPhrase.includes('dosa')) {
      return menuItems.find(i => i.nameTa.includes('தோசை') || i.nameEn.toLowerCase().includes('dosa'));
    }
    if (cleanPhrase.includes('சமோசா') || cleanPhrase.includes('samosa')) {
      return menuItems.find(i => i.nameTa.includes('சமோசா') || i.nameEn.toLowerCase().includes('samosa'));
    }
    if (cleanPhrase.includes('பஜ்ஜி') || cleanPhrase.includes('bajji')) {
      return menuItems.find(i => i.nameTa.includes('பஜ்ஜி') || i.nameEn.toLowerCase().includes('bajji'));
    }
    if (cleanPhrase.includes('போண்டா') || cleanPhrase.includes('bonda')) {
      return menuItems.find(i => i.nameTa.includes('போண்டா') || i.nameEn.toLowerCase().includes('bonda'));
    }
    if (cleanPhrase.includes('பூரி') || cleanPhrase.includes('poori') || cleanPhrase.includes('puri')) {
      return menuItems.find(i => i.nameTa.includes('பூரி') || i.nameEn.toLowerCase().includes('poori'));
    }
    if (cleanPhrase.includes('பொங்கல்') || cleanPhrase.includes('pongal')) {
      return menuItems.find(i => i.nameTa.includes('பொங்கல்') || i.nameEn.toLowerCase().includes('pongal'));
    }
    if (cleanPhrase.includes('சாப்பாடு') || cleanPhrase.includes('சாப்பாடு') || cleanPhrase.includes('meals') || cleanPhrase.includes('lunch') || cleanPhrase.includes('சாதம்')) {
      return menuItems.find(i => i.nameTa.includes('சாப்பாடு') || i.nameTa.includes('சாதம்') || i.nameEn.toLowerCase().includes('meal') || i.nameEn.toLowerCase().includes('rice'));
    }
    if (cleanPhrase.includes('பரோட்டா') || cleanPhrase.includes('பரோட்ட') || cleanPhrase.includes('புரோட்டா') || cleanPhrase.includes('parotta')) {
      return menuItems.find(i => i.nameTa.includes('பரோட்டா') || i.nameEn.toLowerCase().includes('parotta'));
    }
    if (cleanPhrase.includes('சப்பாத்தி') || cleanPhrase.includes('chapati') || cleanPhrase.includes('roti')) {
      return menuItems.find(i => i.nameTa.includes('சப்பாத்தி') || i.nameEn.toLowerCase().includes('chapati'));
    }
    if (cleanPhrase.includes('பிரியாணி') || cleanPhrase.includes('biryani') || cleanPhrase.includes('briyani')) {
      return menuItems.find(i => i.nameTa.includes('பிரியாணி') || i.nameEn.toLowerCase().includes('biryani'));
    }
    if (cleanPhrase.includes('தயிர்') || cleanPhrase.includes('curd')) {
      return menuItems.find(i => i.nameTa.includes('தயிர்') || i.nameEn.toLowerCase().includes('curd'));
    }

    return undefined;
  };

  // Scanning loop with quantity tracking
  let pendingQty = 1;
  let currentPhraseWords: string[] = [];

  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Check if word is a quantity number
    if (TAMIL_NUMBER_MAP[word] !== undefined) {
      // If we have a pending phrase that matched something, resolve it
      if (currentPhraseWords.length > 0) {
        const item = findMatchingItem(currentPhraseWords.join(' '));
        if (item && !matchedItemIds.has(item.id)) {
          results.push({ item, qty: pendingQty });
          matchedItemIds.add(item.id);
        }
        currentPhraseWords = [];
      }
      pendingQty = TAMIL_NUMBER_MAP[word];
      continue;
    }

    currentPhraseWords.push(word);

    // Try matching single or compound phrase
    const candidateItem = findMatchingItem(currentPhraseWords.join(' '));
    if (candidateItem && !matchedItemIds.has(candidateItem.id)) {
      results.push({ item: candidateItem, qty: pendingQty });
      matchedItemIds.add(candidateItem.id);
      pendingQty = 1;
      currentPhraseWords = [];
    }
  }

  // Handle trailing words
  if (currentPhraseWords.length > 0) {
    const item = findMatchingItem(currentPhraseWords.join(' '));
    if (item && !matchedItemIds.has(item.id)) {
      results.push({ item, qty: pendingQty });
      matchedItemIds.add(item.id);
    }
  }

  return results;
}

/**
 * Converts numbers into colloquial Tamil spoken words.
 */
export function numberToTamilWords(num: number): string {
  const tamilNums: Record<number, string> = {
    1: 'ஒரு',
    2: 'இரண்டு',
    3: 'மூன்று',
    4: 'நான்கு',
    5: 'ஐந்து',
    6: 'ஆறு',
    7: 'ஏழு',
    8: 'எட்டு',
    9: 'ஒன்பது',
    10: 'பத்து',
    15: 'பதினைந்து',
    20: 'இருபது',
    25: 'இருபத்தைந்து',
    30: 'முப்பது',
    40: 'நாற்பது',
    50: 'ஐம்பது',
    60: 'அறுபது',
    70: 'எழுபது',
    80: 'எண்பது',
    90: 'தொண்ணூறு',
    100: 'நூறு',
  };

  if (tamilNums[num]) return tamilNums[num];
  return `${num}`;
}

/**
 * Text-to-Speech: Speaks Tamil confirmation to the customer/owner.
 * e.g. "இரண்டு டீ, ஒரு மசால் வடை. மொத்தம் முப்பத்து நான்கு ரூபாய். உறுதிப்படுத்தவா?"
 */
export function speakTamilConfirmation(
  items: RecognizedVoiceItem[],
  totalRupees: number
): Promise<void> {
  return new Promise(resolve => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any previous speech

      // Build natural Tamil sentence
      const itemSummaries = items.map(
        r => `${numberToTamilWords(r.qty)} ${r.item.nameTa}`
      );
      const itemsSentence = itemSummaries.join(', ');
      const speechText = `${itemsSentence}. மொத்தம் ${Math.round(totalRupees)} ரூபாய். உறுதிப்படுத்தவும்.`;

      const utterance = new SpeechSynthesisUtterance(speechText);
      utterance.rate = 0.95; // Slightly slower for clear Tamil diction
      utterance.pitch = 1.0;

      // Find Tamil voice if available
      const voices = window.speechSynthesis.getVoices();
      const tamilVoice = voices.find(
        v => v.lang === 'ta-IN' || v.lang === 'ta' || v.lang.startsWith('ta')
      );
      if (tamilVoice) {
        utterance.voice = tamilVoice;
        utterance.lang = tamilVoice.lang;
      } else {
        utterance.lang = 'ta-IN';
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);

      // Failsafe timeout after 5 seconds
      setTimeout(() => resolve(), 5000);
    } catch (e) {
      resolve();
    }
  });
}

/**
 * Stops any active speech synthesis immediately
 */
export function stopTamilSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {}
  }
}
