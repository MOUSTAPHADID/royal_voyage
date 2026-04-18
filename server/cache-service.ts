/**
 * خدمة الـ Caching لتحسين الأداء
 * توفر caching للبيانات المتكررة والاستعلامات الثقيلة
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class CacheService {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // تنظيف الـ cache كل 5 دقائق
    this.startCleanup();
  }

  /**
   * حفظ بيانات في الـ cache
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  /**
   * الحصول على بيانات من الـ cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl;

    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * حذف مدخل من الـ cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * مسح جميع الـ cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * الحصول على عدد المدخلات
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * تنظيف المدخلات المنتهية الصلاحية
   */
  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[Cache] Cleaned ${cleaned} expired entries`);
    }
  }

  /**
   * بدء تنظيف دوري
   */
  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000); // كل 5 دقائق
  }

  /**
   * إيقاف التنظيف الدوري
   */
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// إنشاء instance واحد من الـ cache service
export const cacheService = new CacheService();

/**
 * Decorator للـ caching التلقائي
 */
export function Cacheable(ttlSeconds: number = 300) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${propertyKey}:${JSON.stringify(args)}`;
      const cached = cacheService.get(cacheKey);

      if (cached) {
        console.log(`[Cache] Hit for ${cacheKey}`);
        return cached;
      }

      const result = await originalMethod.apply(this, args);
      cacheService.set(cacheKey, result, ttlSeconds);

      return result;
    };

    return descriptor;
  };
}

/**
 * دوال مساعدة للـ caching
 */

export async function withCache<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const cached = cacheService.get<T>(key);

  if (cached) {
    console.log(`[Cache] Hit for ${key}`);
    return cached;
  }

  const result = await fn();
  cacheService.set(key, result, ttlSeconds);

  return result;
}

/**
 * تنظيف الـ cache بناءً على نمط
 */
export function invalidatePattern(pattern: string): number {
  let count = 0;

  for (const key of cacheService['cache'].keys()) {
    if (key.includes(pattern)) {
      cacheService.delete(key);
      count++;
    }
  }

  console.log(`[Cache] Invalidated ${count} entries matching pattern: ${pattern}`);
  return count;
}

/**
 * إحصائيات الـ cache
 */
export function getCacheStats() {
  return {
    size: cacheService.size(),
    timestamp: new Date().toISOString(),
  };
}
