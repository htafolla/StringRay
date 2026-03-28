/**
 * OpenClaw Integration Types
 *
 * TypeScript interfaces for OpenClaw Gateway Protocol v3
 * and StringRay integration components.
 *
 * @version 1.0.0
 * @since 2026-03-14
 */

// ============================================================================
// OpenClaw Protocol Types
// ============================================================================

/**
 * OpenClaw WebSocket connection handshake parameters
 */
export interface OpenClawConnectParams {
  minProtocol: number;
  maxProtocol: number;
  client: {
    id: string;
    version: string;
    platform: string;
    mode: 'operator' | 'node';
  };
  role: 'operator' | 'node';
  scopes: string[];
  caps: string[];
  commands: string[];
  permissions?: Record<string, boolean>;
  auth?: {
    token?: string;
  };
  device?: {
    id: string;
    publicKey: string;
    signature: string;
    signedAt: number;
    nonce: string;
  };
  locale?: string;
  userAgent: string;
}

/**
 * OpenClaw WebSocket frame - Request (client → server)
 */
export interface OpenClawFrameRequest {
  type: 'req';
  id: string;
  method: string;
  params: Record<string, unknown>;
}

/**
 * OpenClaw WebSocket frame - Response (server → client)
 */
export interface OpenClawFrameResponse {
  type: 'res';
  id: string;
  ok: boolean;
  result?: unknown;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * OpenClaw WebSocket frame - Event (server → client)
 */
export interface OpenClawFrameEvent {
  type: 'event';
  event: string;
  data?: Record<string, unknown>;
  seq?: number;
  stateVersion?: string;
}

/**
 * Union type for all OpenClaw frame types
 */
export type OpenClawFrame = 
  | OpenClawFrameRequest 
  | OpenClawFrameResponse 
  | OpenClawFrameEvent;

// ============================================================================
// Client Connection Types
// ============================================================================

/**
 * OpenClaw client connection states
 */
export type OpenClawClientState = 
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'authenticating'
  | 'authorized'
  | 'reconnecting'
  | 'error';

/**
 * Pending request for request/response handling
 */
export interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timeout: NodeJS.Timeout;
  timestamp: number;
}

/**
 * Client configuration options
 */
export interface OpenClawClientConfig {
  gatewayUrl: string;
  authToken?: string;
  deviceId?: string;
  deviceKeyPair?: {
    publicKey: string;
    privateKey: string;
  };
  reconnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  pingInterval?: number;
  requestTimeout?: number;
}

// ============================================================================
// StringRay API Server Types
// ============================================================================

/**
 * StringRay API server configuration
 */
export interface StringRayAPIServerConfig {
  port: number;
  host?: string;
  apiKey?: string;
  cors?: boolean;
  rateLimit?: {
    windowMs: number;
    maxRequests: number;
  };
}

/**
 * Agent invocation request from OpenClaw skill
 */
export interface AgentInvokeRequest {
  command: string;
  args?: Record<string, unknown>;
  sessionId?: string;
  agent?: string;
  timeout?: number;
}

/**
 * Agent invocation response
 */
export interface AgentInvokeResponse {
  success: boolean;
  result?: unknown;
  error?: string;
  sessionId?: string;
  executionTime?: number;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptime: number;
  openclaw?: {
    connected: boolean;
    state: OpenClawClientState;
  };
}

/**
 * API route definitions
 */
export interface APIRoute {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  handler: (req: Request, res: Response) => Promise<void>;
  requiresAuth?: boolean;
}

// ============================================================================
// Skill Types
// ============================================================================

/**
 * OpenClaw Skill metadata (SKILL.md frontmatter)
 */
export interface OpenClawSkillMetadata {
  name: string;
  description: string;
  version?: string;
  metadata?: {
    openclaw?: {
      requires?: {
        bins?: string[];
        env?: string[];
        config?: string[];
      };
      primaryEnv?: string;
      emoji?: string;
    };
    author?: string;
    tags?: string[];
  };
  userInvocable?: boolean;
  commands?: SkillCommand[];
}

/**
 * Skill command definition
 */
export interface SkillCommand {
  name: string;
  description: string;
  usage?: string;
  examples?: string[];
  requiresAuth?: boolean;
}

/**
 * Skill command execution request
 */
export interface SkillExecutionRequest {
  command: string;
  args: Record<string, unknown>;
  userId?: string;
  sessionId?: string;
  channel?: string;
}

/**
 * Skill command execution response
 */
export interface SkillExecutionResponse {
  success: boolean;
  output?: string;
  error?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// StringRay Tool Hook Types
// ============================================================================

/**
 * Tool execution event from StringRay
 */
export interface ToolExecutionEvent {
  toolName: string;
  toolId: string;
  args: Record<string, unknown>;
  result?: unknown;
  error?: string;
  duration: number;
  timestamp: number;
  sessionId?: string;
  agent?: string;
}

/**
 * Tool before execution event
 */
export interface ToolBeforeEvent extends ToolExecutionEvent {
  eventType: 'tool.before';
}

/**
 * Tool after execution event
 */
export interface ToolAfterEvent extends ToolExecutionEvent {
  eventType: 'tool.after';
  success: boolean;
}

/**
 * Tool event subscription options
 */
export interface ToolEventSubscription {
  toolNames?: string[];
  includeArgs?: boolean;
  includeResult?: boolean;
  includeMetadata?: boolean;
}

// ============================================================================
// Configuration Types
// ============================================================================

/**
 * Complete OpenClaw integration configuration
 */
export interface OpenClawIntegrationConfig {
  // OpenClaw Gateway
  gatewayUrl: string;
  authToken?: string;
  deviceId?: string;
  deviceKeyPair?: {
    publicKey: string;
    privateKey: string;
  };
  
  // Reconnection
  autoReconnect: boolean;
  maxReconnectAttempts: number;
  reconnectDelay: number;
  
  // StringRay API Server
  apiServer: {
    enabled: boolean;
    port: number;
    host?: string;
    apiKey?: string;
  };
  
  // Tool hooks
  hooks: {
    enabled: boolean;
    toolBefore: boolean;
    toolAfter: boolean;
    includeArgs: boolean;
    includeResult: boolean;
    toolFilter?: string[];
  };
  
  // General
  enabled: boolean;
  debug: boolean;
  logLevel?: 'error' | 'warn' | 'info' | 'debug';
}

/**
 * Configuration validation result
 */
export interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigValidationError[];
  warnings: ConfigValidationWarning[];
}

export interface ConfigValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ConfigValidationWarning {
  field: string;
  message: string;
}

// ============================================================================
// Error Types
// ============================================================================

/**
 * OpenClaw integration error codes
 */
export enum OpenClawErrorCode {
  // Connection errors
  CONNECTION_FAILED = 'CONNECTION_FAILED',
  CONNECTION_TIMEOUT = 'CONNECTION_TIMEOUT',
  AUTH_FAILED = 'AUTH_FAILED',
  TOKEN_MISMATCH = 'TOKEN_MISMATCH',
  DEVICE_NOT_PAIRED = 'DEVICE_NOT_PAIRED',
  
  // Protocol errors
  INVALID_FRAME = 'INVALID_FRAME',
  UNSUPPORTED_METHOD = 'UNSUPPORTED_METHOD',
  OUT_OF_SCOPE = 'OUT_OF_SCOPE',
  PROTOCOL_VERSION_MISMATCH = 'PROTOCOL_VERSION_MISMATCH',
  
  // Request errors
  REQUEST_TIMEOUT = 'REQUEST_TIMEOUT',
  REQUEST_CANCELLED = 'REQUEST_CANCELLED',
  
  // Server errors
  SERVER_ERROR = 'SERVER_ERROR',
  SERVER_UNAVAILABLE = 'SERVER_UNAVAILABLE',
  
  // Skill errors
  SKILL_NOT_FOUND = 'SKILL_NOT_FOUND',
  SKILL_LOAD_FAILED = 'SKILL_LOAD_FAILED',
  SKILL_EXECUTION_FAILED = 'SKILL_EXECUTION_FAILED',
  
  // StringRay errors
  STRINGRAY_UNAVAILABLE = 'STRINGRAY_UNAVAILABLE',
  STRINGRAY_TIMEOUT = 'STRINGRAY_TIMEOUT',
  STRINGRAY_ERROR = 'STRINGRAY_ERROR',
  
  // Configuration errors
  CONFIG_INVALID = 'CONFIG_INVALID',
  CONFIG_MISSING = 'CONFIG_MISSING',
  
  // Unknown
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Base error class for OpenClaw integration
 */
export class OpenClawError extends Error {
  constructor(
    message: string,
    public code: OpenClawErrorCode,
    public recoverable: boolean,
    public context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'OpenClawError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Connection error
 */
export class OpenClawConnectionError extends OpenClawError {
  constructor(
    message: string,
    public originalError?: Error,
  ) {
    super(message, OpenClawErrorCode.CONNECTION_FAILED, true, {
      originalError: originalError?.message,
    });
    this.name = 'OpenClawConnectionError';
  }
}

/**
 * Authentication error
 */
export class OpenClawAuthError extends OpenClawError {
  constructor(
    message: string,
    public authType?: 'token' | 'device',
  ) {
    super(message, OpenClawErrorCode.AUTH_FAILED, false, { authType });
    this.name = 'OpenClawAuthError';
  }
}

/**
 * Request timeout error
 */
export class OpenClawTimeoutError extends OpenClawError {
  constructor(
    public method: string,
    public timeout: number,
  ) {
    super(`Request to ${method} timed out after ${timeout}ms`, OpenClawErrorCode.REQUEST_TIMEOUT, true, {
      method,
      timeout,
    });
    this.name = 'OpenClawTimeoutError';
  }
}

/**
 * Configuration error
 */
export class OpenClawConfigError extends OpenClawError {
  constructor(
    message: string,
    public field?: string,
  ) {
    super(message, OpenClawErrorCode.CONFIG_INVALID, false, { field });
    this.name = 'OpenClawConfigError';
  }
}

// ============================================================================
// Type Guards
// ============================================================================

/**
 * Check if frame is a request frame
 */
export function isOpenClawRequest(frame: unknown): frame is OpenClawFrameRequest {
  return (
    typeof frame === 'object' &&
    frame !== null &&
    (frame as any).type === 'req' &&
    typeof (frame as any).id === 'string' &&
    typeof (frame as any).method === 'string'
  );
}

/**
 * Check if frame is a response frame
 */
export function isOpenClawResponse(frame: unknown): frame is OpenClawFrameResponse {
  return (
    typeof frame === 'object' &&
    frame !== null &&
    (frame as any).type === 'res' &&
    typeof (frame as any).id === 'string' &&
    typeof (frame as any).ok === 'boolean'
  );
}

/**
 * Check if frame is an event frame
 */
export function isOpenClawEvent(frame: unknown): frame is OpenClawFrameEvent {
  return (
    typeof frame === 'object' &&
    frame !== null &&
    (frame as any).type === 'event' &&
    typeof (frame as any).event === 'string'
  );
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(error: OpenClawError): boolean {
  return error.recoverable;
}

// ============================================================================
// Statistics Types
// ============================================================================

/**
 * Client statistics
 */
export interface ClientStatistics {
  connectedAt?: number;
  lastMessageAt?: number;
  messagesSent: number;
  messagesReceived: number;
  requestsSent: number;
  requestsSucceeded: number;
  requestsFailed: number;
  reconnects: number;
  errors: number;
}

/**
 * API server statistics
 */
export interface APIServerStatistics {
  startedAt: number;
  requestsTotal: number;
  requestsByEndpoint: Record<string, number>;
  requestsByStatus: Record<number, number>;
  averageResponseTime: number;
  errors: number;
}

/**
 * Integration statistics
 */
export interface IntegrationStatistics {
  client: ClientStatistics;
  apiServer: APIServerStatistics;
  uptime: number;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * OpenClaw client events
 */
export type OpenClawClientEvent = 
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'authorized'
  | 'reconnecting'
  | 'error'
  | 'frame'
  | 'event';

/**
 * Client event listener type
 */
export type OpenClawEventListener = (data?: unknown) => void | Promise<void>;

/**
 * State change event
 */
export interface StateChangeEvent {
  previousState: OpenClawClientState;
  newState: OpenClawClientState;
  timestamp: number;
}
