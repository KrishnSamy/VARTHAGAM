import { describe, it, expect } from 'vitest';
import {
  parseTamilSpeechToItems,
  normalizeTamil,
  numberToTamilWords,
} from '../src/lib/voiceBilling';
import { MenuItem } from '../src/db/db';

const mockMenuItems: MenuItem[] = [
  {
    id: 'item_tea',
    nameTa: 'டீ',
    nameEn: 'Tea',
    category: 'Hot Drinks',
    pricePaise: 1200,
    emoji: '☕',
    available: true,
    sortOrder: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'item_coffee',
    nameTa: 'காபி',
    nameEn: 'Filter Coffee',
    category: 'Hot Drinks',
    pricePaise: 2000,
    emoji: '☕',
    available: true,
    sortOrder: 2,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'item_vadai',
    nameTa: 'மசால் வடை',
    nameEn: 'Masala Vadai',
    category: 'Snacks',
    pricePaise: 1000,
    emoji: '🍘',
    available: true,
    sortOrder: 3,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'item_idli',
    nameTa: 'இட்லி',
    nameEn: 'Idly',
    category: 'Tiffin',
    pricePaise: 3000,
    emoji: '⚪',
    available: true,
    sortOrder: 4,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: 'item_samosa',
    nameTa: 'சமோசா',
    nameEn: 'Samosa',
    category: 'Snacks',
    pricePaise: 1500,
    emoji: '🥟',
    available: true,
    sortOrder: 5,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

describe('AI Tamil Voice Billing Parser', () => {
  it('normalizes colloquial Tamil punctuation and whitespace', () => {
    const raw = 'ரெண்டு டீ,  ஒரு வடை!  ';
    expect(normalizeTamil(raw)).toBe('ரெண்டு டீ ஒரு வடை');
  });

  it('parses single item with colloquial number word "ரெண்டு டீ"', () => {
    const speech = 'ரெண்டு டீ';
    const result = parseTamilSpeechToItems(speech, mockMenuItems);
    expect(result).toHaveLength(1);
    expect(result[0].item.id).toBe('item_tea');
    expect(result[0].qty).toBe(2);
  });

  it('parses multiple items in one colloquial phrase "ரெண்டு டீ ஒரு மசால் வடை"', () => {
    const speech = 'ரெண்டு டீ ஒரு மசால் வடை';
    const result = parseTamilSpeechToItems(speech, mockMenuItems);
    expect(result).toHaveLength(2);
    expect(result[0].item.nameTa).toBe('டீ');
    expect(result[0].qty).toBe(2);
    expect(result[1].item.nameTa).toBe('மசால் வடை');
    expect(result[1].qty).toBe(1);
  });

  it('filters out colloquial Tamil pleasantries and filler words', () => {
    const speech = 'அண்ணா எனக்கு மூணு இட்லி ஒரு காபி கொடுங்க ப்ளீஸ்';
    const result = parseTamilSpeechToItems(speech, mockMenuItems);
    expect(result).toHaveLength(2);
    expect(result[0].item.nameTa).toBe('இட்லி');
    expect(result[0].qty).toBe(3);
    expect(result[1].item.nameTa).toBe('காபி');
    expect(result[1].qty).toBe(1);
  });

  it('converts numbers to proper Tamil words', () => {
    expect(numberToTamilWords(1)).toBe('ஒரு');
    expect(numberToTamilWords(2)).toBe('இரண்டு');
    expect(numberToTamilWords(5)).toBe('ஐந்து');
    expect(numberToTamilWords(10)).toBe('பத்து');
  });
});
