/**
 * Shop starter templates for Tamil Nadu micro food businesses.
 * Used during onboarding to prefill menu items and raw materials.
 * Prices and materials are sensible defaults in paise that the owner can easily edit.
 */

export interface TemplateItem {
  id: string;
  nameTa: string;
  nameEn: string;
  category: string;
  pricePaise: number;
  emoji: string;
  morningOnly?: boolean;
}

export interface TemplateRawMaterial {
  nameTa: string;
  nameEn: string;
  unit: 'L' | 'kg' | 'g' | 'nos' | 'packet' | 'cylinder';
  openingStock: number;
  reorderLevel: number;
  supplierName: string;
  supplierPhone: string;
}

export interface ShopTemplate {
  id: 'tea' | 'tiffin' | 'snack' | 'mixed';
  titleTa: string;
  titleEn: string;
  emoji: string;
  descriptionTa: string;
  descriptionEn: string;
  items: TemplateItem[];
  rawMaterials: TemplateRawMaterial[];
}

export const SHOP_TEMPLATES: Record<string, ShopTemplate> = {
  tea: {
    id: 'tea',
    titleTa: 'டீ கடை',
    titleEn: 'Tea Stall',
    emoji: '☕',
    descriptionTa: 'டீ, காபி, பால், வடை, சமோசா, பிஸ்கட்',
    descriptionEn: 'Tea, Coffee, Milk, Vadai, Samosa, Biscuits',
    items: [
      { id: 'tea-01', nameTa: 'டீ', nameEn: 'Tea', category: 'Hot Drinks', pricePaise: 1200, emoji: '☕' },
      { id: 'tea-02', nameTa: 'காபி', nameEn: 'Filter Coffee', category: 'Hot Drinks', pricePaise: 1500, emoji: '☕' },
      { id: 'tea-03', nameTa: 'சூடான பால்', nameEn: 'Hot Milk', category: 'Hot Drinks', pricePaise: 1500, emoji: '🥛' },
      { id: 'tea-04', nameTa: 'சுக்கு காபி', nameEn: 'Sukku Coffee', category: 'Hot Drinks', pricePaise: 1500, emoji: '🍵' },
      { id: 'tea-05', nameTa: 'லெமன் டீ', nameEn: 'Lemon Tea', category: 'Hot Drinks', pricePaise: 1500, emoji: '🍋' },
      { id: 'tea-06', nameTa: 'மெது வடை', nameEn: 'Medu Vadai', category: 'Snacks', pricePaise: 800, emoji: '🍩' },
      { id: 'tea-07', nameTa: 'மசால் வடை', nameEn: 'Masala Vadai', category: 'Snacks', pricePaise: 800, emoji: '🍘' },
      { id: 'tea-08', nameTa: 'சமோசா', nameEn: 'Samosa', category: 'Snacks', pricePaise: 1000, emoji: '🥟' },
      { id: 'tea-09', nameTa: 'போண்டா', nameEn: 'Bonda', category: 'Snacks', pricePaise: 800, emoji: '🍘' },
      { id: 'tea-10', nameTa: 'பிஸ்கட் / ரஸ்க்', nameEn: 'Biscuit / Rusk', category: 'Packaged', pricePaise: 500, emoji: '🍪' },
    ],
    rawMaterials: [
      { nameTa: 'பால் (Milk)', nameEn: 'Milk', unit: 'L', openingStock: 20, reorderLevel: 5, supplierName: 'ஆவின் / டெய்ரி', supplierPhone: '9840012345' },
      { nameTa: 'டீத்தூள்', nameEn: 'Tea Powder', unit: 'kg', openingStock: 2, reorderLevel: 0.5, supplierName: 'டீ டெப்போ', supplierPhone: '9840012346' },
      { nameTa: 'காபித்தூள்', nameEn: 'Coffee Powder', unit: 'kg', openingStock: 1, reorderLevel: 0.25, supplierName: 'காபி ஸ்டோர்', supplierPhone: '9840012347' },
      { nameTa: 'சர்க்கரை', nameEn: 'Sugar', unit: 'kg', openingStock: 10, reorderLevel: 2, supplierName: 'மளிகை கடை', supplierPhone: '9840012348' },
      { nameTa: 'இஞ்சி / ஏலக்காய்', nameEn: 'Ginger & Cardamom', unit: 'g', openingStock: 250, reorderLevel: 50, supplierName: 'காய்கறி கடை', supplierPhone: '9840012349' },
      { nameTa: 'கமர்ஷியல் கேஸ் (19kg)', nameEn: 'Commercial LPG', unit: 'cylinder', openingStock: 1, reorderLevel: 1, supplierName: 'கேஸ் ஏஜென்சி', supplierPhone: '9840012350' },
      { nameTa: 'பேப்பர் கப்', nameEn: 'Paper Cups', unit: 'packet', openingStock: 5, reorderLevel: 2, supplierName: 'பேப்பர் மார்ட்', supplierPhone: '9840012351' },
    ]
  },
  tiffin: {
    id: 'tiffin',
    titleTa: 'இட்லி / டிபன் கடை',
    titleEn: 'Idly / Tiffin Cart',
    emoji: '⚪',
    descriptionTa: 'இட்லி, தோசை, பொங்கல், பூரி, பரோட்டா',
    descriptionEn: 'Idly, Dosa, Pongal, Poori, Parotta',
    items: [
      { id: 'tif-01', nameTa: 'இட்லி செட் (4)', nameEn: 'Idly Set (4 pcs)', category: 'Tiffin', pricePaise: 3000, emoji: '⚪' },
      { id: 'tif-02', nameTa: 'நெய் பொடி இட்லி', nameEn: 'Ghee Podi Idly', category: 'Tiffin', pricePaise: 4500, emoji: '🧈' },
      { id: 'tif-03', nameTa: 'மெது வடை', nameEn: 'Medu Vadai', category: 'Tiffin', pricePaise: 1000, emoji: '🍩' },
      { id: 'tif-04', nameTa: 'வெண் பொங்கல்', nameEn: 'Ven Pongal', category: 'Tiffin', pricePaise: 4000, emoji: '🥣', morningOnly: true },
      { id: 'tif-05', nameTa: 'பூரி மசால் (2)', nameEn: 'Poori Masala', category: 'Tiffin', pricePaise: 4000, emoji: '🥞' },
      { id: 'tif-06', nameTa: 'பிளேன் தோசை', nameEn: 'Plain Dosa', category: 'Dosa', pricePaise: 3000, emoji: '🥞' },
      { id: 'tif-07', nameTa: 'நெய் ரோஸ்ட்', nameEn: 'Ghee Roast Dosa', category: 'Dosa', pricePaise: 5000, emoji: '🥞' },
      { id: 'tif-08', nameTa: 'முட்டை தோசை', nameEn: 'Egg Dosa', category: 'Dosa', pricePaise: 5000, emoji: '🍳' },
      { id: 'tif-09', nameTa: 'பரோட்டா செட் (2)', nameEn: 'Parotta (2 pcs)', category: 'Dinner', pricePaise: 4000, emoji: '🫓' },
    ],
    rawMaterials: [
      { nameTa: 'இட்லி அரிசி', nameEn: 'Idly Rice', unit: 'kg', openingStock: 25, reorderLevel: 5, supplierName: 'அரிசி மண்டி', supplierPhone: '9840022345' },
      { nameTa: 'உளுத்தம் பருப்பு', nameEn: 'Urad Dal', unit: 'kg', openingStock: 5, reorderLevel: 1.5, supplierName: 'மளிகை மண்டி', supplierPhone: '9840022346' },
      { nameTa: 'பாசிப்பருப்பு', nameEn: 'Moong Dal', unit: 'kg', openingStock: 3, reorderLevel: 1, supplierName: 'மளிகை மண்டி', supplierPhone: '9840022346' },
      { nameTa: 'சமையல் எண்ணெய்', nameEn: 'Cooking Oil', unit: 'L', openingStock: 10, reorderLevel: 2, supplierName: 'ஆயில் மில்', supplierPhone: '9840022347' },
      { nameTa: 'தேங்காய்', nameEn: 'Coconut', unit: 'nos', openingStock: 10, reorderLevel: 3, supplierName: 'தேங்காய் கடை', supplierPhone: '9840022348' },
      { nameTa: 'தக்காளி & வெங்காயம்', nameEn: 'Tomato & Onion', unit: 'kg', openingStock: 10, reorderLevel: 2, supplierName: 'காய்கறி மண்டி', supplierPhone: '9840022349' },
      { nameTa: 'கமர்ஷியல் கேஸ் (19kg)', nameEn: 'Commercial LPG', unit: 'cylinder', openingStock: 1, reorderLevel: 1, supplierName: 'கேஸ் ஏஜென்சி', supplierPhone: '9840022350' },
      { nameTa: 'வாழை இலை / தட்டு', nameEn: 'Banana Leaves / Plates', unit: 'nos', openingStock: 100, reorderLevel: 25, supplierName: 'இலை கடை', supplierPhone: '9840022351' },
    ]
  },
  snack: {
    id: 'snack',
    titleTa: 'பஜ்ஜி / வடை கடை',
    titleEn: 'Evening Snack Stall',
    emoji: '🍌',
    descriptionTa: 'வாழைக்காய் பஜ்ஜி, மிளகாய் பஜ்ஜி, போண்டா, வடை',
    descriptionEn: 'Banana Bajji, Chilli Bajji, Bonda, Vadai',
    items: [
      { id: 'snk-01', nameTa: 'வாழைக்காய் பஜ்ஜி', nameEn: 'Plantain Bajji', category: 'Bajji', pricePaise: 1000, emoji: '🍌' },
      { id: 'snk-02', nameTa: 'வெங்காய பஜ்ஜி', nameEn: 'Onion Bajji', category: 'Bajji', pricePaise: 1000, emoji: '🧅' },
      { id: 'snk-03', nameTa: 'மிளகாய் பஜ்ஜி', nameEn: 'Chilli Bajji', category: 'Bajji', pricePaise: 1000, emoji: '🌶️' },
      { id: 'snk-04', nameTa: 'உருளைக்கிழங்கு போண்டா', nameEn: 'Aloo Bonda', category: 'Bonda', pricePaise: 1000, emoji: '🥔' },
      { id: 'snk-05', nameTa: 'மெது வடை', nameEn: 'Medu Vadai', category: 'Vadai', pricePaise: 1000, emoji: '🍩' },
      { id: 'snk-06', nameTa: 'மசால் வடை', nameEn: 'Masala Vadai', category: 'Vadai', pricePaise: 1000, emoji: '🍘' },
      { id: 'snk-07', nameTa: 'சுண்டல் கப்', nameEn: 'Sundal Cup', category: 'Snacks', pricePaise: 1500, emoji: '🍲' },
    ],
    rawMaterials: [
      { nameTa: 'கடலை மாவு', nameEn: 'Besan Flour', unit: 'kg', openingStock: 10, reorderLevel: 2, supplierName: 'மளிகை கடை', supplierPhone: '9840032345' },
      { nameTa: 'சமையல் எண்ணெய்', nameEn: 'Frying Oil', unit: 'L', openingStock: 15, reorderLevel: 3, supplierName: 'ஆயில் ஏஜென்சி', supplierPhone: '9840032346' },
      { nameTa: 'வாழைக்காய்', nameEn: 'Raw Banana', unit: 'nos', openingStock: 25, reorderLevel: 5, supplierName: 'காய்கறி சந்தை', supplierPhone: '9840032347' },
      { nameTa: 'பஜ்ஜி மிளகாய்', nameEn: 'Bajji Chilli', unit: 'kg', openingStock: 3, reorderLevel: 1, supplierName: 'காய்கறி சந்தை', supplierPhone: '9840032347' },
      { nameTa: 'பெரிய வெங்காயம்', nameEn: 'Big Onion', unit: 'kg', openingStock: 10, reorderLevel: 2, supplierName: 'காய்கறி சந்தை', supplierPhone: '9840032347' },
      { nameTa: 'கமர்ஷியல் கேஸ் (19kg)', nameEn: 'Commercial LPG', unit: 'cylinder', openingStock: 1, reorderLevel: 1, supplierName: 'கேஸ் ஏஜென்சி', supplierPhone: '9840032350' },
    ]
  },
  mixed: {
    id: 'mixed',
    titleTa: 'கலவை உணவகம் (டீ + டிபன் + பஜ்ஜி)',
    titleEn: 'Mixed Stall (Tea, Tiffin & Snacks)',
    emoji: '🏪',
    descriptionTa: 'டீ, காபி, இட்லி, தோசை, பஜ்ஜி, வடை எல்லாம் கலந்த கடை',
    descriptionEn: 'All-in-one tea, tiffin, and evening snacks stall',
    items: [
      { id: 'mix-01', nameTa: 'டீ', nameEn: 'Tea', category: 'Hot Drinks', pricePaise: 1200, emoji: '☕' },
      { id: 'mix-02', nameTa: 'காபி', nameEn: 'Coffee', category: 'Hot Drinks', pricePaise: 1500, emoji: '☕' },
      { id: 'mix-03', nameTa: 'இட்லி செட் (4)', nameEn: 'Idly Set (4)', category: 'Tiffin', pricePaise: 3000, emoji: '⚪' },
      { id: 'mix-04', nameTa: 'தோசை', nameEn: 'Plain Dosa', category: 'Tiffin', pricePaise: 3000, emoji: '🥞' },
      { id: 'mix-05', nameTa: 'மெது வடை', nameEn: 'Medu Vadai', category: 'Snacks', pricePaise: 1000, emoji: '🍩' },
      { id: 'mix-06', nameTa: 'வாழைக்காய் பஜ்ஜி', nameEn: 'Plantain Bajji', category: 'Snacks', pricePaise: 1000, emoji: '🍌' },
      { id: 'mix-07', nameTa: 'போண்டா', nameEn: 'Bonda', category: 'Snacks', pricePaise: 1000, emoji: '🍘' },
    ],
    rawMaterials: [
      { nameTa: 'பால்', nameEn: 'Milk', unit: 'L', openingStock: 25, reorderLevel: 5, supplierName: 'டெய்ரி', supplierPhone: '9840012345' },
      { nameTa: 'இட்லி அரிசி', nameEn: 'Idly Rice', unit: 'kg', openingStock: 25, reorderLevel: 5, supplierName: 'அரிசி மண்டி', supplierPhone: '9840022345' },
      { nameTa: 'உளுத்தம் பருப்பு', nameEn: 'Urad Dal', unit: 'kg', openingStock: 5, reorderLevel: 1.5, supplierName: 'மளிகை கடை', supplierPhone: '9840022346' },
      { nameTa: 'சமையல் எண்ணெய்', nameEn: 'Cooking Oil', unit: 'L', openingStock: 15, reorderLevel: 3, supplierName: 'ஆயில் ஏஜென்சி', supplierPhone: '9840032346' },
      { nameTa: 'கமர்ஷியல் கேஸ் (19kg)', nameEn: 'Commercial LPG', unit: 'cylinder', openingStock: 2, reorderLevel: 1, supplierName: 'கேஸ் ஏஜென்சி', supplierPhone: '9840032350' },
    ]
  }
};
