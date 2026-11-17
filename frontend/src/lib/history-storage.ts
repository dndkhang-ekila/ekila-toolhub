import { OperationHistoryItem } from '@/types/history';

const STORAGE_PREFIX = 'toolhub_operation_history_';

export const historyStorage = {
  get: (userId: string): OperationHistoryItem[] => {
    if (typeof window === 'undefined' || !userId) return [];
    const key = `${STORAGE_PREFIX}${userId}`;
    try {
      const data = localStorage.getItem(key);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  set: (userId: string, items: OperationHistoryItem[]): void => {
    if (typeof window === 'undefined' || !userId) return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify(items));
    } catch {
      // Storage quota or error
    }
  },

  add: (
    userId: string,
    item: Omit<OperationHistoryItem, 'id' | 'timestamp' | 'userId'>
  ): OperationHistoryItem => {
    const list = historyStorage.get(userId);
    const newItem: OperationHistoryItem = {
      ...item,
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      timestamp: Date.now(),
    };
    const updated = [newItem, ...list];
    historyStorage.set(userId, updated);
    return newItem;
  },

  remove: (userId: string, id: string): OperationHistoryItem[] => {
    const list = historyStorage.get(userId);
    const updated = list.filter((item) => item.id !== id);
    historyStorage.set(userId, updated);
    return updated;
  },

  clear: (userId: string): void => {
    if (typeof window === 'undefined' || !userId) return;
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${userId}`, JSON.stringify([]));
    } catch {
      // Storage error
    }
  },
};
