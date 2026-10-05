import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Image as ImageIcon,
  Plus,
  Trash2,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Save,
  HelpCircle,
} from 'lucide-react';
import { useShop } from '../context/ShopContext';
import { MenuItem } from '../db/db';
import { rupeesToPaise } from '../lib/money';
import { compressImageToDataUrl, guessItemNamesFromFilename } from '../lib/imageUtils';
import { feedback } from '../lib/feedback';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DraftItem {
  id: string;
  nameTa: string;
  nameEn: string;
  category: string;
  priceRupees: string;
  emoji: string;
  imageUrl?: string;
  imageFileName?: string;
}

export const BulkItemUploadModal: React.FC<BulkUploadModalProps> = ({ isOpen, onClose }) => {
  const { bulkAddItems, language, items } = useShop();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeCategory, setActiveCategory] = useState('Hot Drinks');

  if (!isOpen) return null;

  const existingCategories = Array.from(new Set(['Hot Drinks', 'Snacks', 'Tiffin', 'Cold Drinks', ...items.map(i => i.category)]));

  // Handle Multi-Image Selection (Up to 50 files)
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (drafts.length + files.length > 50) {
      setErrorMsg(
        language === 'ta'
          ? 'ஒரே நேரத்தில் அதிகபட்சம் 50 பொருட்கள் மட்டுமே சேர்க்க முடியும்!'
          : 'Maximum 50 items can be uploaded at once!'
      );
      return;
    }

    setIsProcessing(true);
    setErrorMsg('');

    try {
      const newDrafts: DraftItem[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) continue;

        const dataUrl = await compressImageToDataUrl(file, 220, 0.82);
        const guessed = guessItemNamesFromFilename(file.name);

        newDrafts.push({
          id: `draft_${Date.now()}_${i}`,
          nameTa: guessed.nameTa,
          nameEn: guessed.nameEn,
          category: guessed.category || activeCategory,
          priceRupees: '15',
          emoji: guessed.emoji || '🍽️',
          imageUrl: dataUrl,
          imageFileName: file.name,
        });
      }

      setDrafts(prev => [...prev, ...newDrafts]);
      feedback.vibrate(30);
    } catch (err: any) {
      setErrorMsg('படம் ஏற்றுவதில் பிழை: ' + (err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Add Empty Blank Row
  const handleAddBlankRow = () => {
    if (drafts.length >= 50) {
      setErrorMsg(
        language === 'ta'
          ? 'அதிகபட்சம் 50 பொருட்கள் வரம்பை எட்டிவிட்டீர்கள்!'
          : 'Reached 50 items limit!'
      );
      return;
    }

    setDrafts(prev => [
      ...prev,
      {
        id: `draft_${Date.now()}_${prev.length}`,
        nameTa: '',
        nameEn: '',
        category: activeCategory,
        priceRupees: '12',
        emoji: '🍽️',
      },
    ]);
  };

  const handleUpdateDraft = (id: string, field: keyof DraftItem, val: string) => {
    setDrafts(prev =>
      prev.map(d => (d.id === id ? { ...d, [field]: val } : d))
    );
  };

  const handleRemoveDraft = (id: string) => {
    setDrafts(prev => prev.filter(d => d.id !== id));
  };

  // Excel / CSV Template Download
  const downloadTemplate = () => {
    const sampleData = [
      { 'Tamil Name (பொருள் பெயர்)': 'டீ', 'English Name': 'Tea', 'Category': 'Hot Drinks', 'Price (₹)': 12, 'Emoji': '☕' },
      { 'Tamil Name (பொருள் பெயர்)': 'மசால் வடை', 'English Name': 'Masal Vadai', 'Category': 'Snacks', 'Price (₹)': 10, 'Emoji': '🍘' },
      { 'Tamil Name (பொருள் பெயர்)': 'இட்லி (2)', 'English Name': 'Idly (2)', 'Category': 'Tiffin', 'Price (₹)': 25, 'Emoji': '⚪' },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Items_Template');
    XLSX.writeFile(wb, 'varthagam_bulk_items_template.xlsx');
  };

  // CSV Import
  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);

        const importedDrafts: DraftItem[] = rows.slice(0, 50).map((r, idx) => ({
          id: `draft_csv_${Date.now()}_${idx}`,
          nameTa: String(r['Tamil Name (பொருள் பெயர்)'] || r['Tamil Name'] || r['Name'] || '').trim(),
          nameEn: String(r['English Name'] || r['Name'] || '').trim(),
          category: String(r['Category'] || 'General').trim(),
          priceRupees: String(r['Price (₹)'] || r['Price'] || '10').replace(/[^0-9.]/g, ''),
          emoji: String(r['Emoji'] || '🍽️').trim() || '🍽️',
        }));

        setDrafts(prev => [...prev, ...importedDrafts].slice(0, 50));
        feedback.playPaymentSuccessTone();
      } catch (err) {
        setErrorMsg('Excel/CSV கோப்பை வாசிப்பதில் பிழை!');
      } finally {
        if (csvInputRef.current) csvInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  // Save All Drafts to Database
  const handleSaveAll = async () => {
    if (!drafts.length) return;

    // Validate that each draft has a name and valid price
    const validDrafts = drafts.filter(
      d => (d.nameTa.trim() || d.nameEn.trim()) && Number(d.priceRupees) > 0
    );

    if (!validDrafts.length) {
      setErrorMsg(
        language === 'ta'
          ? 'தயவுசெய்து பொருட்களின் பெயர் மற்றும் விலையை உள்ளிடவும்!'
          : 'Please enter valid name and price for items!'
      );
      return;
    }

    setIsProcessing(true);
    try {
      const itemsToPut: Array<Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>> = validDrafts.map(
        (d, idx) => ({
          nameTa: d.nameTa.trim() || d.nameEn.trim(),
          nameEn: d.nameEn.trim() || d.nameTa.trim(),
          category: d.category.trim() || 'General',
          pricePaise: rupeesToPaise(Number(d.priceRupees) || 10),
          emoji: d.emoji || '🍽️',
          imageUrl: d.imageUrl,
          available: true,
          morningOnly: false,
          sortOrder: items.length + idx + 1,
        })
      );

      await bulkAddItems(itemsToPut);
      feedback.playPaymentSuccessTone();
      try {
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch (e) {}

      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'சேமிப்பதில் தோல்வி');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-3xl max-h-[92vh] flex flex-col bg-slate-900 border border-amber-500/40 rounded-3xl shadow-2xl text-white overflow-hidden">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-950 via-brand-900 to-slate-900 border-b border-amber-500/30 flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gold-gradient text-slate-950 flex items-center justify-center shadow-gold-sm font-black">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-tamil-varthagam font-black text-lg text-amber-200">
                {language === 'ta' ? 'மொத்தமாக பொருட்கள் சேர்த்தல் (Bulk Add)' : 'Bulk Product & Image Upload'}
              </h3>
              <p className="text-[11px] text-stone-300">
                {language === 'ta'
                  ? 'ஒரே நேரத்தில் 50 பொருட்கள் வரை படம், பெயர், விலை சேர்த்து உடனடி பில்லிங் செய்யலாம்.'
                  : 'Upload up to 50 item photos with name & price in one go.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-white rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar: Multi-Image Picker + Excel Template */}
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Multi Image File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFilesSelected}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing || drafts.length >= 50}
              className="bg-gold-gradient text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl shadow-gold-sm hover:brightness-105 active:scale-95 transition flex items-center gap-1.5 touch-target disabled:opacity-50"
            >
              <ImageIcon className="w-4 h-4" />
              <span>{language === 'ta' ? 'படங்கள் பதிவேற்று (Up to 50)' : 'Upload Photos (Up to 50)'}</span>
            </button>

            {/* Add Blank Row */}
            <button
              onClick={handleAddBlankRow}
              disabled={drafts.length >= 50}
              className="bg-white/10 hover:bg-white/20 text-stone-200 border border-white/10 font-bold text-xs px-3 py-2.5 rounded-xl transition flex items-center gap-1 touch-target disabled:opacity-40"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>{language === 'ta' ? '+ வரி சேர்க்க' : '+ Add Row'}</span>
            </button>
          </div>

          {/* Excel / CSV Actions */}
          <div className="flex items-center gap-2">
            <input
              ref={csvInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleCsvImport}
              className="hidden"
            />
            <button
              onClick={() => csvInputRef.current?.click()}
              className="text-xs bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-900/80 px-3 py-2 rounded-xl font-bold flex items-center gap-1 transition"
              title="Import Excel file"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel Import</span>
            </button>
            <button
              onClick={downloadTemplate}
              className="text-[11px] text-stone-400 hover:text-stone-200 underline px-1 py-1"
            >
              மாதிரி கோப்பு (Template)
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mx-4 mt-3 p-3 bg-red-950/60 border border-red-500/50 rounded-xl text-rose-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Content: Draft Table / Cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {drafts.length === 0 ? (
            <div className="py-14 text-center border-2 border-dashed border-slate-700 rounded-3xl bg-slate-950/40">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-amber-400">
                <Upload className="w-8 h-8" />
              </div>
              <h4 className="font-tamil-varthagam font-bold text-base text-stone-200 mb-1">
                {language === 'ta' ? 'பொருட்கள் எதுவும் சேர்க்கப்படவில்லை' : 'No Items in Queue'}
              </h4>
              <p className="text-xs text-stone-400 max-w-sm mx-auto mb-5">
                {language === 'ta'
                  ? 'மேலே உள்ள "படங்கள் பதிவேற்று" பொத்தானை அழுத்தி கேலரியிலிருந்து உணவுகளின் படங்களை தேர்வு செய்யவும்.'
                  : 'Click "Upload Photos" above to select multiple item pictures from your device.'}
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-gradient-to-r from-red-700 to-amber-600 text-white font-bold text-xs px-5 py-3 rounded-2xl shadow-crimson-md hover:brightness-110 active:scale-95 transition"
              >
                {language === 'ta' ? 'கேலரியிலிருந்து தேர்வு செய்க' : 'Select from Gallery'}
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center px-1 text-xs text-stone-400 font-bold">
                <span>சேர்க்கப்படும் பொருட்கள்: {drafts.length} / 50</span>
                <span className="text-[11px] text-amber-400">கருப்பு எழுத்துக்களில் தெளிவாக தெரியும்</span>
              </div>

              {drafts.map((d, index) => (
                <div
                  key={d.id}
                  className="p-3 bg-slate-950/90 border border-amber-500/20 rounded-2xl flex flex-col sm:flex-row items-center gap-3 transition hover:border-amber-400/40"
                >
                  {/* Serial & Image Preview */}
                  <div className="flex items-center gap-2.5 w-full sm:w-auto">
                    <span className="text-xs font-mono font-bold text-stone-500 w-5">
                      #{index + 1}
                    </span>
                    <div className="w-14 h-14 rounded-xl bg-slate-800 border border-amber-400/40 overflow-hidden flex-shrink-0 flex items-center justify-center relative">
                      {d.imageUrl ? (
                        <img src={d.imageUrl} alt="Item" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-2xl">{d.emoji}</span>
                      )}
                    </div>
                  </div>

                  {/* Form Inputs Grid - Crisp High Contrast Black Text */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 flex-1 w-full">
                    {/* Tamil Name */}
                    <div>
                      <label className="text-[10px] font-bold text-stone-400 block mb-0.5">
                        தமிழ் பெயர் *
                      </label>
                      <input
                        type="text"
                        placeholder="எ.கா: மசால் வடை"
                        value={d.nameTa}
                        onChange={e => handleUpdateDraft(d.id, 'nameTa', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white text-slate-950 font-bold text-xs border border-stone-300 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* English Name */}
                    <div>
                      <label className="text-[10px] font-bold text-stone-400 block mb-0.5">
                        ஆங்கில பெயர்
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Masal Vadai"
                        value={d.nameEn}
                        onChange={e => handleUpdateDraft(d.id, 'nameEn', e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-white text-slate-950 font-bold text-xs border border-stone-300 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Price in Rupees */}
                    <div>
                      <label className="text-[10px] font-bold text-stone-400 block mb-0.5">
                        விலை (₹) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-xs font-black text-slate-600">₹</span>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={d.priceRupees}
                          onChange={e => handleUpdateDraft(d.id, 'priceRupees', e.target.value)}
                          className="w-full pl-6 pr-2 py-1.5 rounded-lg bg-white text-slate-950 font-black text-xs border border-stone-300 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Category Selector */}
                    <div>
                      <label className="text-[10px] font-bold text-stone-400 block mb-0.5">
                        பிரிவு (Category)
                      </label>
                      <select
                        value={d.category}
                        onChange={e => handleUpdateDraft(d.id, 'category', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg bg-white text-slate-950 font-bold text-xs border border-stone-300 focus:outline-none focus:border-amber-500"
                      >
                        {existingCategories.map(cat => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <button
                    onClick={() => handleRemoveDraft(d.id)}
                    className="p-2 text-stone-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition flex-shrink-0 self-end sm:self-center"
                    title="Remove Item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer: Save Button & Counter */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center">
          <div className="text-xs text-stone-400">
            {drafts.length > 0 && (
              <span>
                தயாராக உள்ளது: <b className="text-amber-300 font-bold">{drafts.length}</b> பொருட்கள்
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-stone-300 text-xs font-bold transition"
            >
              ரத்து (Cancel)
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isProcessing || drafts.length === 0}
              className="bg-gold-gradient text-slate-950 font-black text-xs px-6 py-2.5 rounded-xl shadow-gold-sm hover:brightness-105 active:scale-95 transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isProcessing ? 'சேமிக்கப்படுகிறது...' : `அனைத்தையும் சேமி (${drafts.length})`}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
