import {
  STORAGE_KEYS,
  DEFAULT_SETTINGS,
  MOCK_TEMPLATES,
  type IApiSettings,
  type IPromptHistoryItem,
  type IPromptFavoriteItem,
  type IPromptTemplate,
  type IOptimizeSession,
  type ICompareSession,
} from '@/data/types';

// 纯客户端本地存储（浏览器原生 localStorage），数据不上传任何服务器
const scopedStorage: Storage = window.localStorage;

function safeGet<T>(key: string, fallback: T): T {
  try {
    const raw = scopedStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeSet(key: string, value: unknown): void {
  try {
    scopedStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

// Settings
export function getSettings(): IApiSettings {
  const stored = safeGet<Partial<IApiSettings>>(STORAGE_KEYS.SETTINGS, {});
  return { ...DEFAULT_SETTINGS, ...stored };
}

export function saveSettings(settings: IApiSettings): void {
  safeSet(STORAGE_KEYS.SETTINGS, settings);
}

export function hasApiKey(): boolean {
  const s = getSettings();
  return !!s.apiKey && s.apiKey.trim().length > 0;
}

// History
export function getHistory(): IPromptHistoryItem[] {
  return safeGet<IPromptHistoryItem[]>(STORAGE_KEYS.HISTORY, []);
}

export function addHistory(item: IPromptHistoryItem): void {
  const list = getHistory();
  list.unshift(item);
  // 最多保留 100 条
  safeSet(STORAGE_KEYS.HISTORY, list.slice(0, 100));
}

export function deleteHistory(id: string): void {
  const list = getHistory().filter((i) => i.id !== id);
  safeSet(STORAGE_KEYS.HISTORY, list);
}

export function clearHistory(): void {
  safeSet(STORAGE_KEYS.HISTORY, []);
}

// Favorites
export function getFavorites(): IPromptFavoriteItem[] {
  return safeGet<IPromptFavoriteItem[]>(STORAGE_KEYS.FAVORITES, []);
}

export function addFavorite(item: IPromptFavoriteItem): void {
  const list = getFavorites();
  list.unshift(item);
  safeSet(STORAGE_KEYS.FAVORITES, list);
}

export function deleteFavorite(id: string): void {
  const list = getFavorites().filter((i) => i.id !== id);
  safeSet(STORAGE_KEYS.FAVORITES, list);
}

export function isFavorited(content: string): boolean {
  const list = getFavorites();
  return list.some((f) => f.content === content);
}

// Templates
export function getTemplates(): IPromptTemplate[] {
  const stored = safeGet<IPromptTemplate[]>(STORAGE_KEYS.TEMPLATES, []);
  if (stored.length === 0) {
    // 首次使用，写入内置模板
    safeSet(STORAGE_KEYS.TEMPLATES, MOCK_TEMPLATES);
    return MOCK_TEMPLATES as IPromptTemplate[];
  }
  return stored;
}

export function addCustomTemplate(tpl: IPromptTemplate): void {
  const list = getTemplates();
  list.unshift(tpl);
  safeSet(STORAGE_KEYS.TEMPLATES, list);
}

export function deleteTemplate(id: string): void {
  const list = getTemplates().filter((t) => t.id !== id);
  safeSet(STORAGE_KEYS.TEMPLATES, list);
}

// Current optimize session
export function getCurrentOptimize(): IOptimizeSession | null {
  return safeGet<IOptimizeSession | null>(STORAGE_KEYS.CURRENT_OPTIMIZE, null);
}

export function setCurrentOptimize(session: IOptimizeSession | null): void {
  if (session) {
    safeSet(STORAGE_KEYS.CURRENT_OPTIMIZE, session);
  } else {
    scopedStorage.removeItem(STORAGE_KEYS.CURRENT_OPTIMIZE);
  }
}

// Current compare session
export function getCurrentCompare(): ICompareSession | null {
  return safeGet<ICompareSession | null>(STORAGE_KEYS.CURRENT_COMPARE, null);
}

export function setCurrentCompare(session: ICompareSession | null): void {
  if (session) {
    safeSet(STORAGE_KEYS.CURRENT_COMPARE, session);
  } else {
    scopedStorage.removeItem(STORAGE_KEYS.CURRENT_COMPARE);
  }
}
