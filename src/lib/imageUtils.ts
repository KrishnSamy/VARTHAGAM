/**
 * Image processing utilities for bulk product upload in Varthagam.
 * Resizes and compresses product photos on-device to ultra-lightweight thumbnails.
 */

export async function compressImageToDataUrl(
  file: File,
  maxDimension = 200,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Try webp first, fallback to jpeg
        try {
          const webpUrl = canvas.toDataURL('image/webp', quality);
          if (webpUrl.startsWith('data:image/webp')) {
            resolve(webpUrl);
            return;
          }
        } catch (e) {}

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Intelligent Tamil & English name predictor based on file name.
 */
export function guessItemNamesFromFilename(filename: string): { nameTa: string; nameEn: string; category: string; emoji: string } {
  const clean = filename
    .replace(/\.[^/.]+$/, '') // remove extension
    .replace(/[_-]/g, ' ')
    .toLowerCase()
    .trim();

  const dict: Record<string, { ta: string; en: string; cat: string; emoji: string }> = {
    tea: { ta: 'டீ', en: 'Tea', cat: 'Hot Drinks', emoji: '☕' },
    chai: { ta: 'டீ', en: 'Tea', cat: 'Hot Drinks', emoji: '☕' },
    coffee: { ta: 'காபி', en: 'Coffee', cat: 'Hot Drinks', emoji: '☕' },
    kaapi: { ta: 'காபி', en: 'Filter Coffee', cat: 'Hot Drinks', emoji: '☕' },
    milk: { ta: 'பால்', en: 'Milk', cat: 'Hot Drinks', emoji: '🥛' },
    vadai: { ta: 'மெது வடை', en: 'Medu Vadai', cat: 'Snacks', emoji: '🍩' },
    vada: { ta: 'மெது வடை', en: 'Medu Vadai', cat: 'Snacks', emoji: '🍩' },
    masal: { ta: 'மசால் வடை', en: 'Masal Vadai', cat: 'Snacks', emoji: '🍘' },
    samosa: { ta: 'சமோசா', en: 'Samosa', cat: 'Snacks', emoji: '🥟' },
    bajji: { ta: 'பஜ்ஜி', en: 'Bajji', cat: 'Snacks', emoji: '🥞' },
    bonda: { ta: 'போண்டா', en: 'Bonda', cat: 'Snacks', emoji: '⚪' },
    idly: { ta: 'இட்லி', en: 'Idly', cat: 'Tiffin', emoji: '⚪' },
    idli: { ta: 'இட்லி', en: 'Idly', cat: 'Tiffin', emoji: '⚪' },
    dosa: { ta: 'தோசை', en: 'Dosa', cat: 'Tiffin', emoji: '🥞' },
    dosai: { ta: 'தோசை', en: 'Dosa', cat: 'Tiffin', emoji: '🥞' },
    roast: { ta: 'நெய் ரோஸ்ட்', en: 'Ghee Roast', cat: 'Tiffin', emoji: '🥞' },
    poori: { ta: 'பூரி', en: 'Poori', cat: 'Tiffin', emoji: '🫓' },
    puri: { ta: 'பூரி', en: 'Poori', cat: 'Tiffin', emoji: '🫓' },
    pongal: { ta: 'வெண் பொங்கல்', en: 'Ven Pongal', cat: 'Tiffin', emoji: '🥣' },
    parotta: { ta: 'பரோட்டா', en: 'Parotta', cat: 'Dinner', emoji: '🫓' },
    chapathi: { ta: 'சப்பாத்தி', en: 'Chapathi', cat: 'Dinner', emoji: '🫓' },
    water: { ta: 'தண்ணீர் பாட்டில்', en: 'Water Bottle', cat: 'Cold Drinks', emoji: '🥤' },
    juice: { ta: 'பழச்சாறு', en: 'Fresh Juice', cat: 'Cold Drinks', emoji: '🍹' },
  };

  for (const [key, val] of Object.entries(dict)) {
    if (clean.includes(key)) {
      return { nameTa: val.ta, nameEn: val.en, category: val.cat, emoji: val.emoji };
    }
  }

  // Capitalize clean name
  const formattedEn = clean.charAt(0).toUpperCase() + clean.slice(1);
  return {
    nameTa: formattedEn,
    nameEn: formattedEn,
    category: 'General',
    emoji: '🍽️',
  };
}
