// src/core/trace-context.ts
// Centralized trace propagation

export interface TraceContext {
  traceId: string;
  parentId?: string;
  operation: string;
  governanceApproved: boolean;
  startTime: number;
  metadata?: Record<string, any>;
}

let currentTrace: TraceContext | null = null;

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

export function startTrace(operation: string, metadata?: Record<string, any>): TraceContext {
  const trace: TraceContext = {
    traceId: generateId(),
    operation,
    governanceApproved: false,
    startTime: Date.now(),
    metadata: metadata || {}
  };
  currentTrace = trace;
  return trace;
}

export function getCurrentTrace(): TraceContext | null {
  return currentTrace;
}

export function endTrace(approved: boolean = true): void {
  if (currentTrace) currentTrace.governanceApproved = approved;
  currentTrace = null;
}

export function propagateTrace(childOperation: string): TraceContext | null {
  if (!currentTrace) return null;
  return { ...currentTrace, parentId: currentTrace.traceId, operation: childOperation, startTime: Date.now() };
}