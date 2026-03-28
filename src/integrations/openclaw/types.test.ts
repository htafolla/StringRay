/**
 * OpenClaw Integration Types Tests
 *
 * Tests for type guards, error classes, and type validation.
 *
 * @version 1.0.0
 * @since 2026-03-14
 */

import { describe, test, expect, beforeEach } from 'vitest';
import {
  isOpenClawRequest,
  isOpenClawResponse,
  isOpenClawEvent,
  isRecoverableError,
  OpenClawError,
  OpenClawConnectionError,
  OpenClawAuthError,
  OpenClawTimeoutError,
  OpenClawConfigError,
  OpenClawErrorCode,
  OpenClawFrameRequest,
  OpenClawFrameResponse,
  OpenClawFrameEvent,
} from './types.js';

describe('OpenClaw Type Guards', () => {
  describe('isOpenClawRequest', () => {
    test('returns true for valid request frame', () => {
      const frame: unknown = {
        type: 'req',
        id: 'test-id-123',
        method: 'test.method',
        params: { foo: 'bar' },
      };
      expect(isOpenClawRequest(frame)).toBe(true);
    });

    test('returns false for null', () => {
      expect(isOpenClawRequest(null)).toBe(false);
    });

    test('returns false for undefined', () => {
      expect(isOpenClawRequest(undefined)).toBe(false);
    });

    test('returns false for non-object', () => {
      expect(isOpenClawRequest('string')).toBe(false);
      expect(isOpenClawRequest(123)).toBe(false);
    });

    test('returns false for missing type', () => {
      expect(isOpenClawRequest({ id: 'test', method: 'test' })).toBe(false);
    });

    test('returns false for wrong type', () => {
      expect(isOpenClawRequest({ type: 'req' })).toBe(false);
      expect(isOpenClawRequest({ type: 'res', id: 'test' })).toBe(false);
    });

    test('returns false for missing id', () => {
      expect(isOpenClawRequest({ type: 'req', method: 'test' })).toBe(false);
    });

    test('returns false for missing method', () => {
      expect(isOpenClawRequest({ type: 'req', id: 'test' })).toBe(false);
    });

    test('returns false for non-string id', () => {
      expect(isOpenClawRequest({ type: 'req', id: 123, method: 'test' })).toBe(false);
    });

    test('returns false for non-string method', () => {
      expect(isOpenClawRequest({ type: 'req', id: 'test', method: 123 })).toBe(false);
    });
  });

  describe('isOpenClawResponse', () => {
    test('returns true for valid response frame (success)', () => {
      const frame: unknown = {
        type: 'res',
        id: 'test-id-123',
        ok: true,
        result: { data: 'test' },
      };
      expect(isOpenClawResponse(frame)).toBe(true);
    });

    test('returns true for valid response frame (error)', () => {
      const frame: unknown = {
        type: 'res',
        id: 'test-id-123',
        ok: false,
        error: { code: 'ERROR_CODE', message: 'Error message' },
      };
      expect(isOpenClawResponse(frame)).toBe(true);
    });

    test('returns false for null', () => {
      expect(isOpenClawResponse(null)).toBe(false);
    });

    test('returns false for non-object', () => {
      expect(isOpenClawResponse('string')).toBe(false);
      expect(isOpenClawResponse(123)).toBe(false);
    });

    test('returns false for missing type', () => {
      expect(isOpenClawResponse({ id: 'test', ok: true })).toBe(false);
    });

    test('returns false for wrong type', () => {
      expect(isOpenClawResponse({ type: 'event', id: 'test', ok: true })).toBe(false);
    });

    test('returns false for missing id', () => {
      expect(isOpenClawResponse({ type: 'res', ok: true })).toBe(false);
    });

    test('returns false for missing ok', () => {
      expect(isOpenClawResponse({ type: 'res', id: 'test' })).toBe(false);
    });

    test('returns false for non-boolean ok', () => {
      expect(isOpenClawResponse({ type: 'res', id: 'test', ok: 'true' })).toBe(false);
      expect(isOpenClawResponse({ type: 'res', id: 'test', ok: 1 })).toBe(false);
    });
  });

  describe('isOpenClawEvent', () => {
    test('returns true for valid event frame', () => {
      const frame: unknown = {
        type: 'event',
        event: 'test.event',
        data: { key: 'value' },
      };
      expect(isOpenClawEvent(frame)).toBe(true);
    });

    test('returns true for minimal event frame', () => {
      const frame: unknown = {
        type: 'event',
        event: 'test.event',
      };
      expect(isOpenClawEvent(frame)).toBe(true);
    });

    test('returns true for event with seq and stateVersion', () => {
      const frame: unknown = {
        type: 'event',
        event: 'state.changed',
        seq: 1,
        stateVersion: 'v1.0',
      };
      expect(isOpenClawEvent(frame)).toBe(true);
    });

    test('returns false for null', () => {
      expect(isOpenClawEvent(null)).toBe(false);
    });

    test('returns false for non-object', () => {
      expect(isOpenClawEvent('string')).toBe(false);
    });

    test('returns false for missing type', () => {
      expect(isOpenClawEvent({ event: 'test' })).toBe(false);
    });

    test('returns false for wrong type', () => {
      expect(isOpenClawEvent({ type: 'req', event: 'test' })).toBe(false);
    });

    test('returns false for missing event', () => {
      expect(isOpenClawEvent({ type: 'event' })).toBe(false);
    });

    test('returns false for non-string event', () => {
      expect(isOpenClawEvent({ type: 'event', event: 123 })).toBe(false);
    });
  });

  describe('isRecoverableError', () => {
    test('returns true for recoverable error', () => {
      const error = new OpenClawError(
        'Test error',
        OpenClawErrorCode.CONNECTION_FAILED,
        true
      );
      expect(isRecoverableError(error)).toBe(true);
    });

    test('returns false for non-recoverable error', () => {
      const error = new OpenClawError(
        'Test error',
        OpenClawErrorCode.AUTH_FAILED,
        false
      );
      expect(isRecoverableError(error)).toBe(false);
    });
  });
});

describe('OpenClaw Error Classes', () => {
  describe('OpenClawError', () => {
    test('creates error with all properties', () => {
      const error = new OpenClawError(
        'Test error message',
        OpenClawErrorCode.CONNECTION_FAILED,
        true,
        { key: 'value' }
      );

      expect(error.message).toBe('Test error message');
      expect(error.code).toBe(OpenClawErrorCode.CONNECTION_FAILED);
      expect(error.recoverable).toBe(true);
      expect(error.context).toEqual({ key: 'value' });
      expect(error.name).toBe('OpenClawError');
    });

    test('captures stack trace', () => {
      const error = new OpenClawError(
        'Test error',
        OpenClawErrorCode.UNKNOWN_ERROR,
        false
      );
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('OpenClawError');
    });

    test('works without optional context', () => {
      const error = new OpenClawError(
        'Test error',
        OpenClawErrorCode.REQUEST_TIMEOUT,
        true
      );

      expect(error.context).toBeUndefined();
    });
  });

  describe('OpenClawConnectionError', () => {
    test('creates connection error with message', () => {
      const error = new OpenClawConnectionError('Connection failed');
      expect(error.message).toBe('Connection failed');
      expect(error.code).toBe(OpenClawErrorCode.CONNECTION_FAILED);
      expect(error.recoverable).toBe(true);
      expect(error.name).toBe('OpenClawConnectionError');
    });

    test('creates connection error with original error', () => {
      const originalError = new Error('Original error');
      const error = new OpenClawConnectionError('Connection failed', originalError);

      expect(error.originalError).toBe(originalError);
      expect(error.context?.originalError).toBe('Original error');
    });
  });

  describe('OpenClawAuthError', () => {
    test('creates auth error with token type', () => {
      const error = new OpenClawAuthError('Authentication failed', 'token');
      expect(error.message).toBe('Authentication failed');
      expect(error.authType).toBe('token');
      expect(error.code).toBe(OpenClawErrorCode.AUTH_FAILED);
      expect(error.recoverable).toBe(false);
      expect(error.name).toBe('OpenClawAuthError');
    });

    test('creates auth error with device type', () => {
      const error = new OpenClawAuthError('Device pairing failed', 'device');
      expect(error.authType).toBe('device');
    });

    test('creates auth error without type', () => {
      const error = new OpenClawAuthError('Auth failed');
      expect(error.authType).toBeUndefined();
    });
  });

  describe('OpenClawTimeoutError', () => {
    test('creates timeout error with method and timeout', () => {
      const error = new OpenClawTimeoutError('test.method', 5000);
      expect(error.message).toBe('Request to test.method timed out after 5000ms');
      expect(error.method).toBe('test.method');
      expect(error.timeout).toBe(5000);
      expect(error.code).toBe(OpenClawErrorCode.REQUEST_TIMEOUT);
      expect(error.recoverable).toBe(true);
      expect(error.name).toBe('OpenClawTimeoutError');
    });
  });

  describe('OpenClawConfigError', () => {
    test('creates config error with message', () => {
      const error = new OpenClawConfigError('Invalid configuration');
      expect(error.message).toBe('Invalid configuration');
      expect(error.code).toBe(OpenClawErrorCode.CONFIG_INVALID);
      expect(error.recoverable).toBe(false);
      expect(error.name).toBe('OpenClawConfigError');
    });

    test('creates config error with field', () => {
      const error = new OpenClawConfigError('Invalid port', 'apiServer.port');
      expect(error.field).toBe('apiServer.port');
    });
  });
});

describe('OpenClaw Error Codes', () => {
  test('has all expected error codes', () => {
    expect(OpenClawErrorCode.CONNECTION_FAILED).toBe('CONNECTION_FAILED');
    expect(OpenClawErrorCode.CONNECTION_TIMEOUT).toBe('CONNECTION_TIMEOUT');
    expect(OpenClawErrorCode.AUTH_FAILED).toBe('AUTH_FAILED');
    expect(OpenClawErrorCode.TOKEN_MISMATCH).toBe('TOKEN_MISMATCH');
    expect(OpenClawErrorCode.DEVICE_NOT_PAIRED).toBe('DEVICE_NOT_PAIRED');
    expect(OpenClawErrorCode.INVALID_FRAME).toBe('INVALID_FRAME');
    expect(OpenClawErrorCode.UNSUPPORTED_METHOD).toBe('UNSUPPORTED_METHOD');
    expect(OpenClawErrorCode.OUT_OF_SCOPE).toBe('OUT_OF_SCOPE');
    expect(OpenClawErrorCode.PROTOCOL_VERSION_MISMATCH).toBe('PROTOCOL_VERSION_MISMATCH');
    expect(OpenClawErrorCode.REQUEST_TIMEOUT).toBe('REQUEST_TIMEOUT');
    expect(OpenClawErrorCode.REQUEST_CANCELLED).toBe('REQUEST_CANCELLED');
    expect(OpenClawErrorCode.SERVER_ERROR).toBe('SERVER_ERROR');
    expect(OpenClawErrorCode.SERVER_UNAVAILABLE).toBe('SERVER_UNAVAILABLE');
    expect(OpenClawErrorCode.SKILL_NOT_FOUND).toBe('SKILL_NOT_FOUND');
    expect(OpenClawErrorCode.SKILL_LOAD_FAILED).toBe('SKILL_LOAD_FAILED');
    expect(OpenClawErrorCode.SKILL_EXECUTION_FAILED).toBe('SKILL_EXECUTION_FAILED');
    expect(OpenClawErrorCode.STRINGRAY_UNAVAILABLE).toBe('STRINGRAY_UNAVAILABLE');
    expect(OpenClawErrorCode.STRINGRAY_TIMEOUT).toBe('STRINGRAY_TIMEOUT');
    expect(OpenClawErrorCode.STRINGRAY_ERROR).toBe('STRINGRAY_ERROR');
    expect(OpenClawErrorCode.CONFIG_INVALID).toBe('CONFIG_INVALID');
    expect(OpenClawErrorCode.CONFIG_MISSING).toBe('CONFIG_MISSING');
    expect(OpenClawErrorCode.UNKNOWN_ERROR).toBe('UNKNOWN_ERROR');
  });
});

describe('Type Validation', () => {
  test('OpenClawFrameRequest has correct structure', () => {
    const request: OpenClawFrameRequest = {
      type: 'req',
      id: 'unique-id',
      method: 'skill.execute',
      params: { command: 'test' },
    };
    expect(isOpenClawRequest(request)).toBe(true);
  });

  test('OpenClawFrameResponse has correct structure', () => {
    const response: OpenClawFrameResponse = {
      type: 'res',
      id: 'unique-id',
      ok: true,
      result: { output: 'success' },
    };
    expect(isOpenClawResponse(response)).toBe(true);
  });

  test('OpenClawFrameEvent has correct structure', () => {
    const event: OpenClawFrameEvent = {
      type: 'event',
      event: 'skill.completed',
      data: { skillId: 'test' },
      seq: 1,
    };
    expect(isOpenClawEvent(event)).toBe(true);
  });
});
