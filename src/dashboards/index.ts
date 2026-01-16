/**
 * StringRay AI v1.0.7 - Real-Time Performance Dashboards
 *
 * Comprehensive real-time performance monitoring dashboard system
 * with live metrics collection, alert management, and WebSocket streaming.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

// Core components
export {
  liveMetricsCollector,
  LiveMetricsCollector,
} from "./live-metrics-collector.js";
export { alertEngine, AlertEngine } from "./alert-engine.js";
export { webSocketGateway, WebSocketGateway } from "./websocket-gateway.js";
export { dashboardUIEngine, DashboardUIEngine } from "./dashboard-ui-engine.js";

// Types
export type {
  MetricSource,
  CollectedMetric,
  MetricsCollectionConfig,
  CollectionStats,
} from "./live-metrics-collector.js";

export type {
  AlertRule,
  Alert,
  EscalationPolicy,
  EscalationLevel,
  AlertEngineConfig,
  NotificationChannel,
  AlertStats,
} from "./alert-engine.js";

export type {
  DashboardConnection,
  DashboardSubscription,
  DashboardMessage,
  WebSocketGatewayConfig,
  GatewayStats,
} from "./websocket-gateway.js";

export type {
  DashboardWidget,
  DashboardLayout,
  DashboardState,
  DashboardConfig,
  RenderContext,
} from "./dashboard-ui-engine.js";

// Convenience exports for common use cases
import { liveMetricsCollector } from "./live-metrics-collector.js";
import { alertEngine } from "./alert-engine.js";
import { webSocketGateway } from "./websocket-gateway.js";
import { dashboardUIEngine } from "./dashboard-ui-engine.js";

export const dashboards = {
  metrics: liveMetricsCollector,
  alerts: alertEngine,
  gateway: webSocketGateway,
  ui: dashboardUIEngine,
};
