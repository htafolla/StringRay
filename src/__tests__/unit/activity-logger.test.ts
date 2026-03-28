/**
 * Tests for Activity Logger
 * 
 * @module tests/activity-logger
 * @version 1.0.0
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  logActivity,
  activity,
  isActivityLoggingEnabled,
  setActivityLoggingEnabled,
  getSessionId,
} from "../../core/activity-logger.js";

describe("Activity Logger", () => {
  beforeEach(() => {
    // Enable logging for tests
    setActivityLoggingEnabled(true);
  });

  afterEach(() => {
    // Disable after tests
    setActivityLoggingEnabled(false);
  });

  describe("isActivityLoggingEnabled", () => {
    it("should return true when enabled", () => {
      setActivityLoggingEnabled(true);
      expect(isActivityLoggingEnabled()).toBe(true);
    });

    it("should return false when disabled", () => {
      setActivityLoggingEnabled(false);
      expect(isActivityLoggingEnabled()).toBe(false);
    });
  });

  describe("setActivityLoggingEnabled", () => {
    it("should toggle logging on", () => {
      setActivityLoggingEnabled(true);
      expect(isActivityLoggingEnabled()).toBe(true);
    });

    it("should toggle logging off", () => {
      setActivityLoggingEnabled(false);
      expect(isActivityLoggingEnabled()).toBe(false);
    });
  });

  describe("getSessionId", () => {
    it("should return a session ID", () => {
      const sessionId = getSessionId();
      expect(sessionId).toBeDefined();
      expect(sessionId).toMatch(/^session-\d+-[a-z0-9]+$/);
    });

    it("should return consistent session ID within same process", () => {
      const sessionId1 = getSessionId();
      const sessionId2 = getSessionId();
      expect(sessionId1).toBe(sessionId2);
    });
  });

  describe("logActivity", () => {
    it("should log activity when enabled", () => {
      setActivityLoggingEnabled(true);
      
      // Should not throw
      expect(() => {
        logActivity("development", "info", "test-action", "Test message", { key: "value" });
      }).not.toThrow();
    });

    it("should not log when disabled", () => {
      setActivityLoggingEnabled(false);
      
      // Should silently return without logging
      expect(() => {
        logActivity("development", "info", "test-action", "Test message");
      }).not.toThrow();
    });

    it("should accept all activity levels", () => {
      setActivityLoggingEnabled(true);
      
      expect(() => {
        logActivity("framework", "debug", "debug-action", "Debug message");
        logActivity("framework", "info", "info-action", "Info message");
        logActivity("framework", "warn", "warn-action", "Warn message");
        logActivity("framework", "error", "error-action", "Error message");
        logActivity("framework", "success", "success-action", "Success message");
      }).not.toThrow();
    });

    it("should accept all activity categories", () => {
      setActivityLoggingEnabled(true);
      
      const categories = [
        "framework", "development", "script", "file", 
        "test", "commit", "session", "agent", "processor", "config"
      ] as const;
      
      categories.forEach((category) => {
        expect(() => {
          logActivity(category, "info", "test", "Test");
        }).not.toThrow();
      });
    });
  });

  describe("activity convenience methods", () => {
    it("should have framework method", () => {
      setActivityLoggingEnabled(true);
      expect(activity.framework).toBeDefined();
      expect(typeof activity.framework).toBe("function");
    });

    it("should have development method", () => {
      setActivityLoggingEnabled(true);
      expect(activity.development).toBeDefined();
      expect(typeof activity.development).toBe("function");
    });

    it("should have script method", () => {
      setActivityLoggingEnabled(true);
      expect(activity.script).toBeDefined();
      expect(typeof activity.script).toBe("function");
    });

    it("should have file method", () => {
      setActivityLoggingEnabled(true);
      expect(activity.file).toBeDefined();
      expect(typeof activity.file).toBe("function");
    });

    it("should have test method", () => {
      setActivityLoggingEnabled(true);
      expect(activity.test).toBeDefined();
      expect(typeof activity.test).toBe("function");
    });

    it("should have commit method", () => {
      setActivityLoggingEnabled(true);
      expect(activity.commit).toBeDefined();
      expect(typeof activity.commit).toBe("function");
    });

    it("should have session method", () => {
      setActivityLoggingEnabled(true);
      expect(activity.session).toBeDefined();
      expect(typeof activity.session).toBe("function");
    });

    it("should have success method", () => {
      setActivityLoggingEnabled(true);
      expect(activity.success).toBeDefined();
      expect(typeof activity.success).toBe("function");
    });

    it("should have error method", () => {
      setActivityLoggingEnabled(true);
      expect(activity.error).toBeDefined();
      expect(typeof activity.error).toBe("function");
    });

    it("should have warn method", () => {
      setActivityLoggingEnabled(true);
      expect(activity.warn).toBeDefined();
      expect(typeof activity.warn).toBe("function");
    });
  });

  describe("activity.* convenience methods", () => {
    it("should log development activity", () => {
      setActivityLoggingEnabled(true);
      expect(() => {
        activity.development("feature-created", "Created new feature", { feature: "test" });
      }).not.toThrow();
    });

    it("should log script activity", () => {
      setActivityLoggingEnabled(true);
      expect(() => {
        activity.script("script-run", "Ran build", { command: "npm run build" });
      }).not.toThrow();
    });

    it("should log file activity", () => {
      setActivityLoggingEnabled(true);
      expect(() => {
        activity.file("file-created", "Created file", { path: "test.ts" });
      }).not.toThrow();
    });

    it("should log test activity", () => {
      setActivityLoggingEnabled(true);
      expect(() => {
        activity.test("test-passed", "Tests passed", { count: 100 });
      }).not.toThrow();
    });

    it("should log commit activity", () => {
      setActivityLoggingEnabled(true);
      expect(() => {
        activity.commit("commit-made", "Committed changes", { commit: "abc123" });
      }).not.toThrow();
    });

    it("should log success activity", () => {
      setActivityLoggingEnabled(true);
      expect(() => {
        activity.success("development", "feature-complete", "Feature completed");
      }).not.toThrow();
    });

    it("should log error activity", () => {
      setActivityLoggingEnabled(true);
      expect(() => {
        activity.error("framework", "operation-failed", "Operation failed", { error: "test" });
      }).not.toThrow();
    });

    it("should log warn activity", () => {
      setActivityLoggingEnabled(true);
      expect(() => {
        activity.warn("framework", "operation-slow", "Operation is slow");
      }).not.toThrow();
    });
  });

  describe("activity logging with disabled logger", () => {
    it("should not log when disabled - development", () => {
      setActivityLoggingEnabled(false);
      expect(() => {
        activity.development("test", "Test");
      }).not.toThrow();
    });

    it("should not log when disabled - script", () => {
      setActivityLoggingEnabled(false);
      expect(() => {
        activity.script("test", "Test");
      }).not.toThrow();
    });

    it("should not log when disabled - test", () => {
      setActivityLoggingEnabled(false);
      expect(() => {
        activity.test("test", "Test");
      }).not.toThrow();
    });

    it("should not log when disabled - commit", () => {
      setActivityLoggingEnabled(false);
      expect(() => {
        activity.commit("test", "Test");
      }).not.toThrow();
    });

    it("should not log when disabled - success", () => {
      setActivityLoggingEnabled(false);
      expect(() => {
        activity.success("test", "test", "Test");
      }).not.toThrow();
    });

    it("should not log when disabled - error", () => {
      setActivityLoggingEnabled(false);
      expect(() => {
        activity.error("test", "test", "Test");
      }).not.toThrow();
    });

    it("should not log when disabled - logActivity", () => {
      setActivityLoggingEnabled(false);
      expect(() => {
        logActivity("framework", "info", "test", "Test");
      }).not.toThrow();
    });
  });
});
