import { LRUCache } from "lru-cache";

// Configuration
export const cache = new LRUCache({
    max: 1000,             // Cache stores up to 1000 items
    ttl: 1000 * 60 * 60 * 12  // Cache expires after 2 days
});

// Implementation
export const cacheService = {
    get: (key) => cache.get(key),
    set: (key, value, ttl) => cache.set(key, value, ttl ? { ttl } : undefined),
    has: (key) => cache.has(key),
    del: (key) => cache.delete(key),
    clear: () => cache.clear(),
    getRemainingTTL: (key) => cache.getRemainingTTL(key)
};