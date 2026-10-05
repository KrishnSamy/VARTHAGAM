/**
 * Cloud Relay Interface & Firebase Realtime Database Implementation (Tier 1 vs Tier 0).
 *
 * Tier 0 (Full Offline): When VITE_CLOUD_RELAY is false, all operations bypass cloud
 * and run strictly in-memory / local storage.
 *
 * Tier 1 (Self-Billing Relay): Ephemeral message queue for customers' own phones.
 * Customers use stateless HTTP REST calls to avoid exceeding the 100 concurrent connection limit.
 */

export interface RelayPublicShop {
  code: string;
  name: string;
  upiId: string;
  selfBillOpen: boolean;
  activeUntil: number;
  menuVersion: number;
}

export interface RelayMenuItem {
  id: string;
  nameTa: string;
  nameEn: string;
  pricePaise: number;
  category: string;
  emoji: string;
  available: boolean;
  morningOnly?: boolean;
}

export interface RelayOrder {
  id?: string;
  token: string;
  billNumber?: string;
  items: string; // JSON string of [{ itemId, qty }]
  payMode: 'cash' | 'upi';
  state: 'pending' | 'confirmed' | 'served' | 'cancelled';
  createdAt: number;
  customerUid?: string;
  totalPaise?: number;
}

export interface IRelay {
  isAvailable(): boolean;
  publishShopPublic(shopId: string, data: RelayPublicShop): Promise<boolean>;
  publishMenu(shopId: string, items: RelayMenuItem[]): Promise<boolean>;
  getShopPublic(shopId: string): Promise<RelayPublicShop | null>;
  getMenu(shopId: string): Promise<RelayMenuItem[] | null>;
  submitOrder(shopId: string, order: Omit<RelayOrder, 'id'>): Promise<string | null>;
  pollOrder(shopId: string, orderId: string): Promise<RelayOrder | null>;
  updateOrderState(shopId: string, orderId: string, state: RelayOrder['state'], token?: string): Promise<boolean>;
  deleteOrder(shopId: string, orderId: string): Promise<boolean>;
  listenToOrders(shopId: string, onOrderReceived: (orders: RelayOrder[]) => void): () => void;
}

export class MockOfflineRelay implements IRelay {
  isAvailable(): boolean {
    return false;
  }
  async publishShopPublic(): Promise<boolean> {
    return true;
  }
  async publishMenu(): Promise<boolean> {
    return true;
  }
  async getShopPublic(): Promise<RelayPublicShop | null> {
    return null;
  }
  async getMenu(): Promise<RelayMenuItem[] | null> {
    return null;
  }
  async submitOrder(): Promise<string | null> {
    return null;
  }
  async pollOrder(): Promise<RelayOrder | null> {
    return null;
  }
  async updateOrderState(): Promise<boolean> {
    return true;
  }
  async deleteOrder(): Promise<boolean> {
    return true;
  }
  listenToOrders(): () => void {
    return () => {};
  }
}

export class FirebaseRealtimeRelay implements IRelay {
  private databaseUrl: string;

  constructor(databaseUrl?: string) {
    this.databaseUrl = (databaseUrl || import.meta.env.VITE_FIREBASE_DATABASE_URL || '').replace(/\/$/, '');
  }

  isAvailable(): boolean {
    return Boolean(this.databaseUrl && import.meta.env.VITE_CLOUD_RELAY === 'true');
  }

  async publishShopPublic(shopId: string, data: RelayPublicShop): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      const res = await fetch(`${this.databaseUrl}/shops/${shopId}/public.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  async publishMenu(shopId: string, items: RelayMenuItem[]): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      const res = await fetch(`${this.databaseUrl}/menus/${shopId}.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ version: Date.now(), items }),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  async getShopPublic(shopId: string): Promise<RelayPublicShop | null> {
    if (!this.isAvailable()) return null;
    try {
      const res = await fetch(`${this.databaseUrl}/shops/${shopId}/public.json`);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async getMenu(shopId: string): Promise<RelayMenuItem[] | null> {
    if (!this.isAvailable()) return null;
    try {
      const res = await fetch(`${this.databaseUrl}/menus/${shopId}.json`);
      if (!res.ok) return null;
      const data = await res.json();
      return data?.items || [];
    } catch (e) {
      return null;
    }
  }

  /**
   * Customers push an order using stateless REST POST to avoid holding a WebSocket connection.
   */
  async submitOrder(shopId: string, order: Omit<RelayOrder, 'id'>): Promise<string | null> {
    if (!this.isAvailable()) return null;
    try {
      const res = await fetch(`${this.databaseUrl}/orders/${shopId}.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.name; // Firebase generated pushId
    } catch (e) {
      return null;
    }
  }

  /**
   * Customers poll their individual order state via REST
   */
  async pollOrder(shopId: string, orderId: string): Promise<RelayOrder | null> {
    if (!this.isAvailable()) return null;
    try {
      const res = await fetch(`${this.databaseUrl}/orders/${shopId}/${orderId}.json`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data) return null;
      return { id: orderId, ...data };
    } catch (e) {
      return null;
    }
  }

  async updateOrderState(shopId: string, orderId: string, state: RelayOrder['state'], token?: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      const patchBody: any = { state };
      if (token) patchBody.token = token;
      const res = await fetch(`${this.databaseUrl}/orders/${shopId}/${orderId}.json`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patchBody),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  async deleteOrder(shopId: string, orderId: string): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      const res = await fetch(`${this.databaseUrl}/orders/${shopId}/${orderId}.json`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  }

  /**
   * Owner poll listener (falls back smoothly between EventSource / SSE or 10-second REST poll)
   */
  listenToOrders(shopId: string, onOrderReceived: (orders: RelayOrder[]) => void): () => void {
    if (!this.isAvailable()) return () => {};

    let isCancelled = false;

    const fetchOrders = async () => {
      if (isCancelled) return;
      try {
        const res = await fetch(`${this.databaseUrl}/orders/${shopId}.json`);
        if (res.ok) {
          const data = await res.json();
          if (data) {
            const ordersList: RelayOrder[] = Object.entries(data).map(([id, val]: any) => ({
              id,
              ...val,
            }));
            onOrderReceived(ordersList);
          } else {
            onOrderReceived([]);
          }
        }
      } catch (e) {
        // Handle gracefully
      }
    };

    // Initial fetch
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // 10s poll budget

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }
}

export const relay: IRelay =
  import.meta.env.VITE_CLOUD_RELAY === 'true'
    ? new FirebaseRealtimeRelay()
    : new MockOfflineRelay();
