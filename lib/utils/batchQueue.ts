interface QueuedOperation {
  id: string;
  type: string;
  data: any;
  timestamp: number;
  resolve: (value: any) => void;
  reject: (error: any) => void;
}

interface BatchConfig {
  maxSize: number;
  maxWaitMs: number;
}

class BatchQueue {
  private queue: QueuedOperation[] = [];
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private configs: Map<string, BatchConfig> = new Map();
  private processors: Map<string, (operations: QueuedOperation[]) => Promise<any[]>> = new Map();

  constructor() {
    // Default configs for different operation types
    this.configs.set('reactions', { maxSize: 10, maxWaitMs: 500 });
    this.configs.set('notifications', { maxSize: 20, maxWaitMs: 300 });
    this.configs.set('goal_updates', { maxSize: 5, maxWaitMs: 1000 });
    this.configs.set('user_stats', { maxSize: 15, maxWaitMs: 800 });
  }

  registerProcessor(type: string, processor: (operations: QueuedOperation[]) => Promise<any[]>) {
    this.processors.set(type, processor);
  }

  add<T>(type: string, data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const operation: QueuedOperation = {
        id: Date.now() + Math.random().toString(36),
        type,
        data,
        timestamp: Date.now(),
        resolve,
        reject
      };

      this.queue.push(operation);
      this.scheduleFlush(type);
    });
  }

  private scheduleFlush(type: string) {
    const config = this.configs.get(type) || { maxSize: 10, maxWaitMs: 500 };
    const typeOperations = this.queue.filter(op => op.type === type);

    // Flush immediately if batch is full
    if (typeOperations.length >= config.maxSize) {
      this.flush(type);
      return;
    }

    // Schedule timer flush if not already scheduled
    if (!this.timers.has(type)) {
      const timer = setTimeout(() => {
        this.flush(type);
      }, config.maxWaitMs);
      
      this.timers.set(type, timer);
    }
  }

  private async flush(type: string) {
    // Clear timer
    const timer = this.timers.get(type);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(type);
    }

    // Get operations to process
    const operations = this.queue.filter(op => op.type === type);
    if (operations.length === 0) return;

    // Remove from queue
    this.queue = this.queue.filter(op => op.type !== type);

    // Get processor
    const processor = this.processors.get(type);
    if (!processor) {
      operations.forEach(op => op.reject(new Error(`No processor for type: ${type}`)));
      return;
    }

    try {
      const results = await processor(operations);
      operations.forEach((op, index) => {
        op.resolve(results[index] || null);
      });
    } catch (error) {
      operations.forEach(op => op.reject(error));
    }
  }

  // Force flush all pending operations
  async flushAll() {
    const types = new Set(this.queue.map(op => op.type));
    await Promise.all([...types].map(type => this.flush(type)));
  }

  // Get queue status for debugging
  getStatus() {
    const stats: Record<string, number> = {};
    this.queue.forEach(op => {
      stats[op.type] = (stats[op.type] || 0) + 1;
    });
    return {
      totalQueued: this.queue.length,
      byType: stats,
      activeTimers: this.timers.size
    };
  }
}

export const batchQueue = new BatchQueue();