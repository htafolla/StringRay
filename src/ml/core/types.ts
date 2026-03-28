// Stub module for ML core types (not yet implemented)

export interface MLModel {
  id: string;
  name: string;
  version: string;
  type?: string;
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface InferenceRequest {
  modelId: string;
  input?: unknown;
  data?: unknown;
  [key: string]: unknown;
}

export interface InferenceResponse {
  output: unknown;
  latency: number;
  confidence: number;
  [key: string]: unknown;
}
