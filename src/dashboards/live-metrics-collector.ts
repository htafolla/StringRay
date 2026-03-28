// Stub module for live metrics collector (not yet implemented)

export const liveMetricsCollector: {
  getMetrics(): Promise<any>;
  start(): void;
  stop(): void;
  emit?(event: string, data?: any): void;
  [key: string]: any;
} = {
  async getMetrics(): Promise<any> {
    return { responseTime: 0, memoryUsage: 0, cpuUsage: 0, throughput: 0, errorRate: 0 };
  },
  start(): void {},
  stop(): void {},
};
