/**
 * src/services/recentSearches.ts
 *
 * The signed-in user's last few searches, stored only on this device
 * (AsyncStorage, per account). Never sent to Firestore.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const MAX = 8;
const keyFor = (uid: string) => `cse-research-hub:recent-searches:${uid}`;

export async function loadRecentSearches(uid: string): Promise<string[]> {
  if (!uid) return [];
  try {
    const raw = await AsyncStorage.getItem(keyFor(uid));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((s) => typeof s === 'string').slice(0, MAX) : [];
  } catch {
    return [];
  }
}

async function save(uid: string, list: string[]) {
  try {
    await AsyncStorage.setItem(keyFor(uid), JSON.stringify(list.slice(0, MAX)));
  } catch {
    // storage full / unavailable — recent searches are a convenience only
  }
}

/** Adds a search to the top (case-insensitive de-duplication). Returns the new list. */
export async function addRecentSearch(uid: string, query: string, current: string[]): Promise<string[]> {
  const q = query.trim().slice(0, 80);
  if (!uid || q.length < 2) return current;
  const next = [q, ...current.filter((s) => s.toLowerCase() !== q.toLowerCase())].slice(0, MAX);
  await save(uid, next);
  return next;
}

export async function removeRecentSearch(uid: string, query: string, current: string[]): Promise<string[]> {
  const next = current.filter((s) => s !== query);
  await save(uid, next);
  return next;
}

export async function clearRecentSearches(uid: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(keyFor(uid));
  } catch {
    // ignore
  }
}
