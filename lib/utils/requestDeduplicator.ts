interface PendingRequest {
  promise: Promise<any>;
  timestamp: number;
}

class RequestDeduplicator {
  private pending: Map<string, PendingRequest> = new Map();
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 30000; // 30 seconds
  private readonly REQUEST_TTL = 10000; // 10 seconds

  private generateKey(fn: Function, args: any[]): string {
    return `${fn.name}_${JSON.stringify(args)}`;
  }

  async dedupe<T>(fn: Function, args: any[] = [], cacheMs: number = 0): Promise<T> {
    const key = this.generateKey(fn, args);
    
    // Check cache first if caching is enabled
    if (cacheMs > 0) {
      const cached = this.cache.get(key);
      if (cached && Date.now() - cached.timestamp < cacheMs) {
        return cached.data;
      }
    }

    // Check if request is already pending
    const pending = this.pending.get(key);
    if (pending && Date.now() - pending.timestamp < this.REQUEST_TTL) {
      return pending.promise;
    }

    // Create new request
    const promise = fn(...args);
    this.pending.set(key, { promise, timestamp: Date.now() });

    try {
      const result = await promise;
      
      // Cache result if caching is enabled
      if (cacheMs > 0) {
        this.cache.set(key, { data: result, timestamp: Date.now() });
      }
      
      this.pending.delete(key);
      return result;
    } catch (error) {
      this.pending.delete(key);
      throw error;
    }
  }

  // Clear expired cache entries
  cleanupCache() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  // Clear expired pending requests
  cleanupPending() {
    const now = Date.now();
    for (const [key, request] of this.pending.entries()) {
      if (now - request.timestamp > this.REQUEST_TTL) {
        this.pending.delete(key);
      }
    }
  }

  // Force clear cache for specific pattern
  invalidateCache(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Get stats for debugging
  getStats() {
    return {
      pendingRequests: this.pending.size,
      cachedEntries: this.cache.size,
      cacheHitRate: this.getCacheHitRate()
    };
  }

  private hitCount = 0;
  private requestCount = 0;

  private getCacheHitRate() {
    return this.requestCount > 0 ? (this.hitCount / this.requestCount * 100).toFixed(1) + '%' : '0%';
  }
}

export const requestDeduplicator = new RequestDeduplicator();

// Cleanup expired entries every 5 minutes
setInterval(() => {
  requestDeduplicator.cleanupCache();
  requestDeduplicator.cleanupPending();
}, 5 * 60 * 1000);