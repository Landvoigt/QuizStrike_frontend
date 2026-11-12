import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {

  /** Saves value (objects as JSON). */
  set(key: string, value: string | number | object): void {
    try {
      if (typeof value === 'object') {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        localStorage.setItem(key, String(value));
      }
    } catch (err) {
      console.error(`LocalStorage set error for key "${key}"`, err);
    }
  }

  /** String value or fallback. */
  getString(key: string, fallback = ''): string {
    try {
      return localStorage.getItem(key) ?? fallback;
    } catch (err) {
      console.error(`LocalStorage getString error for key "${key}"`, err);
      return fallback;
    }
  }

  /** Number value or fallback (also if not numeric). */
  getNumber(key: string, fallback = 0): number {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;

      const parsed = Number(raw);
      return isNaN(parsed) ? fallback : parsed;
    } catch (err) {
      console.error(`LocalStorage getNumber error for key "${key}"`, err);
      return fallback;
    }
  }

  /** Parsed JSON value or fallback. */
  getJson<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;

      return JSON.parse(raw) as T;
    } catch (err) {
      console.error(`LocalStorage getJson error for key "${key}"`, err);
      return fallback;
    }
  }

  /** Removes key. */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (err) {
      console.error(`LocalStorage remove error for key "${key}"`, err);
    }
  }

  /** Clears all keys. */
  clear(): void {
    try {
      localStorage.clear();
    } catch (err) {
      console.error(`LocalStorage clear error`, err);
    }
  }
}
