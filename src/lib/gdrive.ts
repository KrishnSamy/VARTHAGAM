/**
 * Google Drive Backup & Local JSON Export / Restore Engine (Section 7.6).
 * Uses Google Drive REST API with the non-sensitive 'drive.appdata' scope.
 * Files are saved directly into the user's hidden appDataFolder.
 * Also provides a 100% offline JSON export / restore facility.
 */

import { db } from '../db/db';

export interface BackupData {
  version: number;
  exportedAt: number;
  shopCode: string;
  settings: any[];
  items: any[];
  priceHistory: any[];
  orders: any[];
  rawMaterials: any[];
  purchases: any[];
  expenses: any[];
  recipes: any[];
  dailyClosings: any[];
  gasTracker: any[];
}

/**
 * Creates a full data snapshot from local IndexedDB.
 */
export async function createFullBackupSnapshot(): Promise<BackupData> {
  const settings = await db.settings.toArray();
  const items = await db.items.toArray();
  const priceHistory = await db.priceHistory.toArray();
  const orders = await db.orders.toArray();
  const rawMaterials = await db.rawMaterials.toArray();
  const purchases = await db.purchases.toArray();
  const expenses = await db.expenses.toArray();
  const recipes = await db.recipes.toArray();
  const dailyClosings = await db.dailyClosings.toArray();
  const gasTracker = await db.gasTracker.toArray();

  const shopCode = settings[0]?.shopCode || 'UNKNOWN';

  return {
    version: 1,
    exportedAt: Date.now(),
    shopCode,
    settings,
    items,
    priceHistory,
    orders,
    rawMaterials,
    purchases,
    expenses,
    recipes,
    dailyClosings,
    gasTracker,
  };
}

/**
 * Restores a full data snapshot into local IndexedDB.
 */
export async function restoreFromBackupSnapshot(data: BackupData): Promise<boolean> {
  if (!data || !data.version) {
    throw new Error('தவறான கோப்பு வடிவம் (Invalid backup data format)');
  }

  await db.transaction(
    'rw',
    [
      db.settings,
      db.items,
      db.priceHistory,
      db.orders,
      db.rawMaterials,
      db.purchases,
      db.expenses,
      db.recipes,
      db.dailyClosings,
      db.gasTracker,
    ],
    async () => {
      if (data.settings?.length) {
        await db.settings.clear();
        await db.settings.bulkPut(data.settings);
      }
      if (data.items?.length) {
        await db.items.clear();
        await db.items.bulkPut(data.items);
      }
      if (data.priceHistory?.length) {
        await db.priceHistory.clear();
        await db.priceHistory.bulkPut(data.priceHistory);
      }
      if (data.orders?.length) {
        await db.orders.clear();
        await db.orders.bulkPut(data.orders);
      }
      if (data.rawMaterials?.length) {
        await db.rawMaterials.clear();
        await db.rawMaterials.bulkPut(data.rawMaterials);
      }
      if (data.purchases?.length) {
        await db.purchases.clear();
        await db.purchases.bulkPut(data.purchases);
      }
      if (data.expenses?.length) {
        await db.expenses.clear();
        await db.expenses.bulkPut(data.expenses);
      }
      if (data.recipes?.length) {
        await db.recipes.clear();
        await db.recipes.bulkPut(data.recipes);
      }
      if (data.dailyClosings?.length) {
        await db.dailyClosings.clear();
        await db.dailyClosings.bulkPut(data.dailyClosings);
      }
      if (data.gasTracker?.length) {
        await db.gasTracker.clear();
        await db.gasTracker.bulkPut(data.gasTracker);
      }
    }
  );

  return true;
}

/**
 * Downloads a local JSON backup file to device.
 */
export async function exportLocalBackupJson(): Promise<void> {
  const snapshot = await createFullBackupSnapshot();
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `kadai_kanakku_${snapshot.shopCode}_${dateStr}.json`;
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Uploads snapshot to Google Drive appDataFolder using OAuth access token.
 */
export async function uploadToGoogleDrive(accessToken: string): Promise<string> {
  const snapshot = await createFullBackupSnapshot();
  const dateStr = new Date().toISOString().split('T')[0];
  const filename = `backup_${snapshot.shopCode}_${dateStr}.json`;

  const metadata = {
    name: filename,
    parents: ['appDataFolder'],
    mimeType: 'application/json',
  };

  const form = new FormData();
  form.append(
    'metadata',
    new Blob([JSON.stringify(metadata)], { type: 'application/json' })
  );
  form.append(
    'file',
    new Blob([JSON.stringify(snapshot)], { type: 'application/json' })
  );

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Drive upload failed');
  }

  const result = await res.json();

  // Prune older backups, keeping only the last 14
  await pruneOldDriveBackups(accessToken);

  // Update last backup timestamp
  await db.settings.update('current_shop', { lastBackupTime: Date.now() });

  return result.id;
}

/**
 * Lists available backups in appDataFolder.
 */
export async function listDriveBackups(accessToken: string): Promise<Array<{ id: string; name: string; createdTime: string }>> {
  const res = await fetch(
    "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name,createdTime)&orderBy=createdTime desc",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error('Failed to list backups');
  }

  const data = await res.json();
  return data.files || [];
}

/**
 * Downloads and restores the latest snapshot from Google Drive appDataFolder.
 */
export async function restoreLatestDriveBackup(accessToken: string): Promise<boolean> {
  const files = await listDriveBackups(accessToken);
  if (!files.length) {
    throw new Error('Google Drive-ல் எந்த பேக்கப்பும் காணப்படவில்லை (No backups found in Drive)');
  }

  const fileId = files[0].id;
  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error('Failed to download backup file');
  }

  const data: BackupData = await res.json();
  return await restoreFromBackupSnapshot(data);
}

/**
 * Retains at most the last 14 backups in appDataFolder.
 */
async function pruneOldDriveBackups(accessToken: string) {
  try {
    const files = await listDriveBackups(accessToken);
    if (files.length > 14) {
      const filesToDelete = files.slice(14);
      for (const f of filesToDelete) {
        await fetch(`https://www.googleapis.com/drive/v3/files/${f.id}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });
      }
    }
  } catch (e) {
    // Non-fatal
  }
}
