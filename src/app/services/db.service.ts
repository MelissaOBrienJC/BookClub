import { Injectable } from '@angular/core';

const DB_NAME = 'bookclub';
const DB_VERSION = 1;
const STORES = ['clubs', 'books', 'meetings'];

/**
 * Thin promise wrapper around the browser's native IndexedDB API.
 *
 * This app previously used @capacitor-community/sqlite with the jeep-sqlite
 * web backend (SQLite compiled to WebAssembly). That combination turned out
 * to be extremely fragile in this dev environment - wasm/JS version
 * mismatches between sql.js, jeep-sqlite, and the SQLite plugin itself
 * produced a `LinkError: ... function import requires a callable` that
 * persisted across several different, individually-verified-compatible
 * dependency combinations. Given that, IndexedDB directly is the more
 * robust choice: it's a standard browser API with no wasm, no version
 * matching between three separate packages, and no separate copy-the-wasm-
 * file build step. It also works unchanged inside a Capacitor native
 * WebView on iOS/Android, so nothing is lost by moving off SQLite here.
 *
 * Each "table" is an IndexedDB object store keyed by the record's own `id`.
 * There's no SQL and no JOIN support - callers that need to filter or
 * relate records (e.g. "books for club X") do it in JS after getAll(),
 * which is entirely fine at the size a local single-user app like this
 * runs at.
 */
@Injectable({ providedIn: 'root' })
export class DbService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private open(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = () => {
          const db = request.result;
          for (const store of STORES) {
            if (!db.objectStoreNames.contains(store)) {
              db.createObjectStore(store, { keyPath: 'id' });
            }
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return this.dbPromise;
  }

  async getAll<T = any>(store: string): Promise<T[]> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    });
  }

  async get<T = any>(store: string, id: string): Promise<T | undefined> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(id);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  async put(store: string, record: any): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async delete(store: string, id: string): Promise<void> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite');
      tx.objectStore(store).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async clearAll(): Promise<void> {
  const db = await this.open();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES, 'readwrite');

    try {
      for (const store of STORES) {
        tx.objectStore(store).clear();
      }
    } catch (error) {
      reject(error);
      return;
    }

    tx.oncomplete = () => resolve();

    tx.onerror = () => {
      reject(tx.error ?? new Error('Database clear failed.'));
    };

    tx.onabort = () => {
      reject(tx.error ?? new Error('Database clear was aborted.'));
    };
  });
}

  async replaceAll(data: {
  clubs: any[];
  books: any[];
  meetings: any[];
}): Promise<void> {
  const db = await this.open();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORES, 'readwrite');

    try {
      // Remove the existing data.
      for (const store of STORES) {
        tx.objectStore(store).clear();
      }

      // Replace it with the backup data.
      for (const club of data.clubs) {
        tx.objectStore('clubs').put(club);
      }

      for (const book of data.books) {
        tx.objectStore('books').put(book);
      }

      for (const meeting of data.meetings) {
        tx.objectStore('meetings').put(meeting);
      }
    } catch (error) {
      reject(error);
      return;
    }

    tx.oncomplete = () => resolve();

    tx.onerror = () => {
      reject(tx.error ?? new Error('Database restore failed.'));
    };

    tx.onabort = () => {
      reject(tx.error ?? new Error('Database restore was aborted.'));
    };
  });
}
}
