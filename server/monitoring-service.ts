/**
 * Monitoring Service for Royal Voyage
 * Tracks API health, performance, and errors
 */

import { apiLogger } from "./logger";

export interface HealthMetrics {
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  requestsPerSecond: number;
  errorRate: number;
  averageResponseTime: number;
}

export interface ApiEndpointMetrics {
  endpoint: string;
  method: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  errorRate: number;
}

class MonitoringService {
  private startTime = Date.now();
  private requestCount = 0;
  private errorCount = 0;
  private responseTimes: number[] = [];
  private endpointMetrics: Map<string, ApiEndpointMetrics> = new Map();

  /**
   * Track API request
   */
  trackRequest(endpoint: string, method: string, responseTime: number, success: boolean) {
    this.requestCount++;
    this.responseTimes.push(responseTime);

    if (!success) {
      this.errorCount++;
    }

    const key = `${method} ${endpoint}`;
    const metrics = this.endpointMetrics.get(key) || {
      endpoint,
      method,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      errorRate: 0,
    };

    metrics.totalRequests++;
    if (success) {
      metrics.successfulRequests++;
    } else {
      metrics.failedRequests++;
    }

    metrics.averageResponseTime =
      (metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime) /
      metrics.totalRequests;
    metrics.errorRate = (metrics.failedRequests / metrics.totalRequests) * 100;

    this.endpointMetrics.set(key, metrics);
  }

  /**
   * Get health metrics
   */
  getHealthMetrics(): HealthMetrics {
    const uptime = Date.now() - this.startTime;
    const avgResponseTime =
      this.responseTimes.length > 0
        ? this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length
        : 0;

    return {
      uptime,
      memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
      cpuUsage: 0, // TODO: Implement CPU usage tracking
      requestsPerSecond: (this.requestCount / uptime) * 1000,
      errorRate: (this.errorCount / this.requestCount) * 100 || 0,
      averageResponseTime: avgResponseTime,
    };
  }

  /**
   * Get endpoint metrics
   */
  getEndpointMetrics(): ApiEndpointMetrics[] {
    return Array.from(this.endpointMetrics.values());
  }

  /**
   * Get metrics for specific endpoint
   */
  getEndpointMetric(endpoint: string, method: string): ApiEndpointMetrics | null {
    const key = `${method} ${endpoint}`;
    return this.endpointMetrics.get(key) || null;
  }

  /**
   * Alert on high error rate
   */
  checkErrorThreshold(threshold: number = 5) {
    const health = this.getHealthMetrics();
    if (health.errorRate > threshold) {
      apiLogger.warn(`High error rate detected: ${health.errorRate.toFixed(2)}%`, {
        errorRate: health.errorRate,
        threshold,
        totalRequests: this.requestCount,
        failedRequests: this.errorCount,
      });
    }
  }

  /**
   * Alert on slow response time
   */
  checkResponseTimeThreshold(threshold: number = 1000) {
    const health = this.getHealthMetrics();
    if (health.averageResponseTime > threshold) {
      apiLogger.warn(`Slow response time detected: ${health.averageResponseTime.toFixed(2)}ms`, {
        averageResponseTime: health.averageResponseTime,
        threshold,
      });
    }
  }

  /**
   * Reset metrics
   */
  reset() {
    this.requestCount = 0;
    this.errorCount = 0;
    this.responseTimes = [];
    this.endpointMetrics.clear();
    this.startTime = Date.now();
  }

  /**
   * Get summary report
   */
  getSummaryReport() {
    const health = this.getHealthMetrics();
    const endpoints = this.getEndpointMetrics();

    return {
      health,
      endpoints: endpoints.sort((a, b) => b.totalRequests - a.totalRequests).slice(0, 10),
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const monitoringService = new MonitoringService();

export default MonitoringService;
