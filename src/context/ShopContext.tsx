/**
 * Global Shop State & Context for VARTHAGAM (வர்த்தகம்).
 * Synchronizes IndexedDB local data with React components.
 * Secure owner PIN management & full menu/price modifications.
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  db,
  ShopSettings,
  MenuItem,
  OrderBill,
  RawMaterial,
  ExpenseRecord,
  requestStoragePersistence,
} from '../db/db';
import { translations, Language } from '../i18n/translations';
import { computeSubscriptionState, SubscriptionState } from '../lib/license';
import { SHOP_TEMPLATES } from '../lib/templates';
import { relay } from '../lib/relay';
import { verifyOwnerAuth, verifyOwnerUniqueKey, generateOwnerUniqueKey } from '../lib/security';

interface ShopContextType {
  settings: ShopSettings | null;
  items: MenuItem[];
  rawMaterials: RawMaterial[];
  orders: OrderBill[];
  expenses: ExpenseRecord[];
  subscription: SubscriptionState | null;
  language: Language;
  t: typeof translations['ta'];
  isLoading: boolean;
  isKioskMode: boolean;
  isOwnerUnlocked: boolean;
  setLanguage: (lang: Language) => void;
  setIsKioskMode: (val: boolean) => void;
  refreshShopData: () => Promise<void>;
  createInitialShop: (
    shopType: 'tea' | 'tiffin' | 'snack' | 'mixed',
    name: string,
    upiId: string,
    pin: string,
    uniqueKey: string,
    assignedShopCode?: string
  ) => Promise<void>;
  loginWithUniqueKey: (shopCode: string, uniqueKey: string, pin?: string) => Promise<boolean>;
  verifyPin: (pin: string) => Promise<boolean>;
  unlockOwner: (pin: string) => Promise<boolean>;
  lockOwner: () => void;
  getNextTokenNumber: () => Promise<string>;
  // Item & Price Management
  updateItemPrice: (itemId: string, newPricePaise: number, reason?: string) => Promise<void>;
  addItem: (item: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  bulkAddItems: (items: Array<Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  updateItem: (itemId: string, data: Partial<MenuItem>) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  toggleItemAvailable: (itemId: string) => Promise<void>;
  bulkUpdateCategoryPrices: (category: string, increasePaise: number) => Promise<void>;
}

const ShopContext = createContext<ShopContextType | undefined>(undefined);

// SHA-256 hash for PIN stored locally on device
async function hashPin(pin: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const ShopProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [orders, setOrders] = useState<OrderBill[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionState | null>(null);
  const [language, setLanguageState] = useState<Language>('ta');
  const [isKioskMode, setIsKioskMode] = useState<boolean>(false);
  const [isOwnerUnlocked, setIsOwnerUnlocked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const t = translations[language];

  const refreshShopData = async () => {
    try {
      const currentShop = await db.settings.get('current_shop');
      if (currentShop) {
        setSettings(currentShop);
        setLanguageState(currentShop.language || 'ta');

        const [allItems, allMaterials, allOrders, allExpenses] = await Promise.all([
          db.items.orderBy('sortOrder').toArray(),
          db.rawMaterials.toArray(),
          db.orders.orderBy('createdAt').reverse().limit(100).toArray(),
          db.expenses.orderBy('createdAt').reverse().limit(100).toArray(),
        ]);

        setItems(allItems);
        setRawMaterials(allMaterials);
        setOrders(allOrders);
        setExpenses(allExpenses);

        const subState = await computeSubscriptionState(currentShop.shopCode);
        setSubscription(subState);
      } else {
        setSettings(null);
      }
    } catch (e) {
      console.error('Failed to load shop data from local DB', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshShopData();
    requestStoragePersistence();
  }, []);

  const setLanguage = async (newLang: Language) => {
    setLanguageState(newLang);
    if (settings) {
      await db.settings.update('current_shop', { language: newLang });
      setSettings(prev => (prev ? { ...prev, language: newLang } : null));
    }
  };

  const createInitialShop = async (
    shopType: 'tea' | 'tiffin' | 'snack' | 'mixed',
    name: string,
    upiId: string,
    pin: string,
    uniqueKey: string,
    assignedShopCode?: string
  ) => {
    const cleanKey = (uniqueKey || '').trim().toUpperCase();
    const finalShopCode = assignedShopCode && assignedShopCode.trim()
      ? assignedShopCode.trim().toUpperCase()
      : `VT-${Math.floor(1000 + Math.random() * 9000)}`;

    if (!cleanKey || !verifyOwnerUniqueKey(finalShopCode, cleanKey)) {
      throw new Error(
        `தவறான உரிமையாளர் சாவி! ${finalShopCode} கடைக்கான சரியான சாவியை சூப்பர் அட்மினிடம் பெறவும். (Invalid Owner Key for ${finalShopCode})`
      );
    }

    const pinHash = await hashPin(pin);

    const newShop: ShopSettings = {
      id: 'current_shop',
      shopCode: finalShopCode,
      name,
      upiId,
      ownerPinHash: pinHash,
      shopType,
      language: 'ta',
      isSelfBillOpen: true,
      ownerUniqueKey: cleanKey,
      isActivated: true,
      activeUntil: Date.now() + (30 * 86400000), // Activated 30 days
      createdAt: Date.now(),
    };

    const template = SHOP_TEMPLATES[shopType] || SHOP_TEMPLATES.tea;

    const initialItems: MenuItem[] = template.items.map((item, idx) => ({
      id: `item_${Date.now()}_${idx}`,
      nameTa: item.nameTa,
      nameEn: item.nameEn,
      category: item.category,
      pricePaise: item.pricePaise,
      emoji: item.emoji,
      available: true,
      morningOnly: item.morningOnly || false,
      sortOrder: idx + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    const initialMaterials: RawMaterial[] = template.rawMaterials.map((mat, idx) => ({
      id: `mat_${Date.now()}_${idx}`,
      nameTa: mat.nameTa,
      nameEn: mat.nameEn,
      unit: mat.unit,
      currentStock: mat.openingStock,
      reorderLevel: mat.reorderLevel,
      costPerUnitPaise: 0,
      supplierName: mat.supplierName,
      supplierPhone: mat.supplierPhone,
      updatedAt: Date.now(),
    }));

    await db.transaction('rw', [db.settings, db.items, db.rawMaterials], async () => {
      await db.settings.put(newShop);
      await db.items.bulkPut(initialItems);
      await db.rawMaterials.bulkPut(initialMaterials);
    });

    setIsOwnerUnlocked(true); // Automatically unlock owner on initial setup

    // Tier 1 optional relay publishing
    if (relay.isAvailable()) {
      relay.publishShopPublic(finalShopCode, {
        code: finalShopCode,
        name,
        upiId,
        selfBillOpen: true,
        activeUntil: newShop.activeUntil || Date.now() + 30 * 86400000,
        menuVersion: Date.now(),
      });
      relay.publishMenu(
        finalShopCode,
        initialItems.map(i => ({
          id: i.id,
          nameTa: i.nameTa,
          nameEn: i.nameEn,
          pricePaise: i.pricePaise,
          category: i.category,
          emoji: i.emoji,
          available: i.available,
          morningOnly: i.morningOnly,
        }))
      );
    }

    await refreshShopData();
  };

  const loginWithUniqueKey = async (
    shopCode: string,
    uniqueKey: string,
    pin?: string
  ): Promise<boolean> => {
    const cleanCode = (shopCode || '').trim().toUpperCase();
    const cleanKey = (uniqueKey || '').trim().toUpperCase();

    if (!cleanCode || !cleanKey) return false;
    if (!verifyOwnerUniqueKey(cleanCode, cleanKey)) return false;

    // Check if existing shop in DB
    const existing = await db.settings.get('current_shop');
    if (existing && existing.shopCode.toUpperCase() === cleanCode) {
      await db.settings.update('current_shop', {
        ownerUniqueKey: cleanKey,
        isActivated: true,
        activeUntil: Math.max(existing.activeUntil || 0, Date.now() + (30 * 86400000)),
      });
      setIsOwnerUnlocked(true);
      await refreshShopData();
      return true;
    }

    // New stall setup on device using this key
    const pinHash = await hashPin(pin || '1234');
    const newShop: ShopSettings = {
      id: 'current_shop',
      shopCode: cleanCode,
      name: 'வர்த்தகம் கடை',
      upiId: 'shop@upi',
      ownerPinHash: pinHash,
      shopType: 'tea',
      language: 'ta',
      isSelfBillOpen: true,
      ownerUniqueKey: cleanKey,
      isActivated: true,
      activeUntil: Date.now() + (30 * 86400000),
      createdAt: Date.now(),
    };

    const template = SHOP_TEMPLATES.tea;
    const initialItems: MenuItem[] = template.items.map((item, idx) => ({
      id: `item_${Date.now()}_${idx}`,
      nameTa: item.nameTa,
      nameEn: item.nameEn,
      category: item.category,
      pricePaise: item.pricePaise,
      emoji: item.emoji,
      available: true,
      morningOnly: item.morningOnly || false,
      sortOrder: idx + 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }));

    await db.transaction('rw', [db.settings, db.items], async () => {
      await db.settings.put(newShop);
      await db.items.bulkPut(initialItems);
    });

    setIsOwnerUnlocked(true);
    await refreshShopData();
    return true;
  };

  const verifyPin = async (inputPin: string): Promise<boolean> => {
    if (!settings) {
      return inputPin.length === 4;
    }
    const authRes = verifyOwnerAuth(inputPin, settings.ownerPinHash, settings.shopCode);
    return authRes.success;
  };

  const unlockOwner = async (inputPin: string): Promise<boolean> => {
    const isValid = await verifyPin(inputPin);
    if (isValid) {
      setIsOwnerUnlocked(true);
      return true;
    }
    return false;
  };

  const lockOwner = () => {
    setIsOwnerUnlocked(false);
  };

  const getNextTokenNumber = async (): Promise<string> => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysBills = await db.orders.where('dateKey').equals(todayStr).count();
    const tokenInt = (todaysBills + 1) % 1000;
    return `T-${tokenInt.toString().padStart(3, '0')}`;
  };

  // Item & Price Management Functions
  const updateItemPrice = async (itemId: string, newPricePaise: number, reason: string = 'Owner PIN adjustment') => {
    const existing = await db.items.get(itemId);
    if (!existing) return;

    if (existing.pricePaise !== newPricePaise) {
      await db.priceHistory.put({
        itemId,
        oldPricePaise: existing.pricePaise,
        newPricePaise,
        changedAt: Date.now(),
        reason,
      });
    }

    await db.items.update(itemId, {
      pricePaise: newPricePaise,
      updatedAt: Date.now(),
    });

    await refreshShopData();
  };

  const addItem = async (itemData: Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newItem: MenuItem = {
      ...itemData,
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await db.items.put(newItem);
    await refreshShopData();
  };

  const bulkAddItems = async (itemsData: Array<Omit<MenuItem, 'id' | 'createdAt' | 'updatedAt'>>) => {
    const timestamp = Date.now();
    const newItems: MenuItem[] = itemsData.map((item, idx) => ({
      ...item,
      id: `item_${timestamp}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));
    await db.items.bulkPut(newItems);
    await refreshShopData();
  };

  const updateItem = async (itemId: string, data: Partial<MenuItem>) => {
    await db.items.update(itemId, {
      ...data,
      updatedAt: Date.now(),
    });
    await refreshShopData();
  };

  const deleteItem = async (itemId: string) => {
    await db.items.delete(itemId);
    await refreshShopData();
  };

  const toggleItemAvailable = async (itemId: string) => {
    const existing = await db.items.get(itemId);
    if (!existing) return;
    await db.items.update(itemId, {
      available: !existing.available,
      updatedAt: Date.now(),
    });
    await refreshShopData();
  };

  const bulkUpdateCategoryPrices = async (category: string, increasePaise: number) => {
    const catItems = await db.items.filter(i => category === 'all' || i.category === category).toArray();
    for (const item of catItems) {
      const newPrice = Math.max(0, item.pricePaise + increasePaise);
      await db.priceHistory.put({
        itemId: item.id,
        oldPricePaise: item.pricePaise,
        newPricePaise: newPrice,
        changedAt: Date.now(),
        reason: `Bulk category update (${category})`,
      });
      await db.items.update(item.id, {
        pricePaise: newPrice,
        updatedAt: Date.now(),
      });
    }
    await refreshShopData();
  };

  return (
    <ShopContext.Provider
      value={{
        settings,
        items,
        rawMaterials,
        orders,
        expenses,
        subscription,
        language,
        t,
        isLoading,
        isKioskMode,
        isOwnerUnlocked,
        setLanguage,
        setIsKioskMode,
        refreshShopData,
        createInitialShop,
        loginWithUniqueKey,
        verifyPin,
        unlockOwner,
        lockOwner,
        getNextTokenNumber,
        updateItemPrice,
        addItem,
        bulkAddItems,
        updateItem,
        deleteItem,
        toggleItemAvailable,
        bulkUpdateCategoryPrices,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};
