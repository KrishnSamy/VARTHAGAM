/**
 * Dexie.js Database Layer for Kadai Kanakku.
 * Heavy financial data stays on the owner's phone.
 * All financial fields are strictly integer paise.
 */

import Dexie, { Table } from 'dexie';

export interface ShopSettings {
  id: string; // 'current_shop'
  shopCode: string;
  name: string;
  ownerUid?: string;
  upiId: string;
  ownerPinHash: string; // Hashed on-device
  shopType: 'tea' | 'tiffin' | 'snack' | 'mixed';
  language: 'ta' | 'en';
  openTime?: string;
  closeTime?: string;
  lastBackupTime?: number;
  persistenceGranted?: boolean;
  gstEnabled?: boolean;
  gstRatePct?: number; // e.g., 5 for 5%
  isSelfBillOpen?: boolean;
  activeUntil?: number;
  ownerUniqueKey?: string;
  isActivated?: boolean;
  createdAt: number;
}

export interface MenuItem {
  id: string;
  nameTa: string;
  nameEn: string;
  category: string;
  pricePaise: number; // Integer paise
  emoji: string;
  available: boolean;
  morningOnly?: boolean;
  sortOrder: number;
  createdAt: number;
  updatedAt: number;
}

export interface PriceHistoryRecord {
  id?: number;
  itemId: string;
  oldPricePaise: number;
  newPricePaise: number;
  changedAt: number;
  reason?: string;
}

export interface OrderItemLine {
  itemId: string;
  nameTa: string;
  nameEn: string;
  pricePaise: number;
  qty: number;
  totalPaise: number;
}

export interface OrderBill {
  id: string; // UUID or timestamp based
  tokenNumber: string; // e.g. "T-014"
  items: OrderItemLine[];
  totalPaise: number; // Recomputed locally, never trusted from client
  payMode: 'cash' | 'upi';
  state: 'pending' | 'confirmed' | 'served' | 'cancelled';
  source: 'counter' | 'kiosk' | 'customer_phone';
  createdAt: number; // Unix ms
  confirmedAt?: number;
  servedAt?: number;
  dateKey: string; // "YYYY-MM-DD"
  customerUid?: string;
  utr?: string;
  flaggedTampered?: boolean;
}

export interface RawMaterial {
  id: string;
  nameTa: string;
  nameEn: string;
  unit: 'L' | 'kg' | 'g' | 'nos' | 'packet' | 'cylinder';
  currentStock: number;
  reorderLevel: number;
  costPerUnitPaise: number;
  supplierName: string;
  supplierPhone: string;
  updatedAt: number;
}

export interface PurchaseEntry {
  id: string;
  materialId: string;
  materialName: string;
  quantity: number;
  totalCostPaise: number;
  costPerUnitPaise: number;
  supplierName?: string;
  dateKey: string; // "YYYY-MM-DD"
  createdAt: number;
}

export type ExpenseCategory =
  | 'raw_materials'
  | 'gas'
  | 'electricity'
  | 'water_can'
  | 'rent'
  | 'salary'
  | 'transport'
  | 'packaging'
  | 'repairs'
  | 'license'
  | 'loan_emi'
  | 'owner_withdrawal'
  | 'other';

export interface ExpenseRecord {
  id: string;
  category: ExpenseCategory;
  amountPaise: number;
  isRecurring: boolean;
  isFixed: boolean;
  notes?: string;
  dateKey: string; // "YYYY-MM-DD"
  createdAt: number;
}

export interface RecipeIngredient {
  materialId: string;
  materialName: string;
  quantityUsed: number;
  unit: string;
  unitCostPaise: number;
}

export interface Recipe {
  id: string;
  itemId: string;
  ingredients: RecipeIngredient[];
  unitCostPaise: number;
  updatedAt: number;
}

export interface DailyClosingRecord {
  id: string; // dateKey e.g. "YYYY-MM-DD"
  dateKey: string;
  totalSalesPaise: number;
  cashSalesPaise: number;
  upiSalesPaise: number;
  totalBills: number;
  leftoversJson?: string;
  wastagePaise: number;
  cogsPaise: number;
  grossProfitPaise: number;
  operatingExpensesPaise: number;
  netProfitPaise: number;
  closedAt: number;
}

export interface GasCylinderLog {
  id: string;
  name: string;
  dateStarted: string; // "YYYY-MM-DD"
  dateEnded?: string; // "YYYY-MM-DD"
  pricePaidPaise: number;
  daysLasted?: number;
  costPerDayPaise?: number;
  createdAt: number;
}

export class KadaiKanakkuDB extends Dexie {
  settings!: Table<ShopSettings, string>;
  items!: Table<MenuItem, string>;
  priceHistory!: Table<PriceHistoryRecord, number>;
  orders!: Table<OrderBill, string>;
  rawMaterials!: Table<RawMaterial, string>;
  purchases!: Table<PurchaseEntry, string>;
  expenses!: Table<ExpenseRecord, string>;
  recipes!: Table<Recipe, string>;
  dailyClosings!: Table<DailyClosingRecord, string>;
  gasTracker!: Table<GasCylinderLog, string>;

  constructor() {
    super('KadaiKanakkuDB');
    this.version(1).stores({
      settings: 'id, shopCode',
      items: 'id, category, available, sortOrder',
      priceHistory: '++id, itemId, changedAt',
      orders: 'id, tokenNumber, payMode, state, source, dateKey, createdAt',
      rawMaterials: 'id, nameTa, nameEn',
      purchases: 'id, materialId, dateKey, createdAt',
      expenses: 'id, category, isFixed, dateKey, createdAt',
      recipes: 'id, itemId',
      dailyClosings: 'id, dateKey, closedAt',
      gasTracker: 'id, dateStarted, dateEnded',
    });
  }
}

export const db = new KadaiKanakkuDB();

/**
 * Requests persistent storage from browser to prevent accidental eviction.
 */
export async function requestStoragePersistence(): Promise<boolean> {
  if (navigator.storage && navigator.storage.persist) {
    const isPersisted = await navigator.storage.persist();
    return isPersisted;
  }
  return false;
}
