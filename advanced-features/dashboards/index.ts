/**
 * StringRay AI v1.1.1 - Real-Time Performance Dashboards
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
} from "./live-metrics-collector";
export { alertEngine, AlertEngine } from "./alert-engine";
export { webSocketGateway, WebSocketGateway } from "./websocket-gateway";
export { dashboardUIEngine, DashboardUIEngine } from "./dashboard-ui-engine";

// Types
export type {
  MetricSource,
  CollectedMetric,
  MetricsCollectionConfig,
  CollectionStats,
} from "./live-metrics-collector";

export type {
  AlertRule,
  Alert,
  EscalationPolicy,
  EscalationLevel,
  AlertEngineConfig,
  NotificationChannel,
  AlertStats,
} from "./alert-engine";

export type {
  DashboardConnection,
  DashboardSubscription,
  DashboardMessage,
  WebSocketGatewayConfig,
  GatewayStats,
} from "./websocket-gateway";

export type {
  DashboardWidget,
  DashboardLayout,
  DashboardState,
  DashboardConfig,
  RenderContext,
} from "./dashboard-ui-engine";

// Convenience exports for common use cases
import { liveMetricsCollector } from "./live-metrics-collector";
import { alertEngine } from "./alert-engine";
import { webSocketGateway } from "./websocket-gateway";
import { dashboardUIEngine } from "./dashboard-ui-engine";

export const dashboards = {
  metrics: liveMetricsCollector,
  alerts: alertEngine,
  gateway: webSocketGateway,
  ui: dashboardUIEngine,
};
