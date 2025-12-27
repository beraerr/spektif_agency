interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default

  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  has(key: string): boolean {
    const item = this.cache.get(key);
    if (!item) return false;

    const now = Date.now();
    if (now - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Invalidate cache entries that match a pattern
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const item of this.cache.values()) {
      if (now - item.timestamp > item.ttl) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
      hitRate: valid / (valid + expired) || 0
    };
  }
}

export const cache = new CacheManager();

// Cache key generators
export const cacheKeys = {
  board: (boardId: string) => `board_${boardId}`,
  boards: (userId: string) => `boards_${userId}`,
  clients: (orgId: string) => `clients_${orgId}`,
  employees: (orgId: string) => `employees_${orgId}`,
  calendar: (boardId: string) => `calendar_${boardId}`,
  attachments: (cardId: string) => `attachments_${cardId}`
};

// Cache TTL constants
export const cacheTTL = {
  short: 30 * 1000,    // 30 seconds
  medium: 5 * 60 * 1000,  // 5 minutes
  long: 30 * 60 * 1000,   // 30 minutes
  veryLong: 2 * 60 * 60 * 1000 // 2 hours
};


