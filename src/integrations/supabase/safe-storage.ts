/**
 * Safe storage adapter for Supabase that works in private/incognito modes
 * Falls back to sessionStorage or in-memory storage when localStorage is unavailable
 */

interface SafeStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

class MemoryStorage implements SafeStorage {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) || null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }
}

function isStorageAvailable(storage: Storage): boolean {
  try {
    const test = "__storage_test__";
    storage.setItem(test, test);
    storage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

export function getSafeStorage(): SafeStorage {
  // Try localStorage first
  if (typeof window !== "undefined" && isStorageAvailable(localStorage)) {
    return localStorage;
  }

  // Fall back to sessionStorage
  if (typeof window !== "undefined" && isStorageAvailable(sessionStorage)) {
    return sessionStorage;
  }

  // Fall back to in-memory storage (for private mode or other restrictions)
  return new MemoryStorage();
}
