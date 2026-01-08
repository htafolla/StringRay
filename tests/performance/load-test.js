import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "2m", target: 100 }, // Ramp up to 100 users over 2 minutes
    { duration: "5m", target: 100 }, // Stay at 100 users for 5 minutes
    { duration: "2m", target: 200 }, // Ramp up to 200 users over 2 minutes
    { duration: "5m", target: 200 }, // Stay at 200 users for 5 minutes
    { duration: "2m", target: 0 }, // Ramp down to 0 users over 2 minutes
  ],
  thresholds: {
    http_req_duration: ["p(99)<1500"], // 99% of requests must complete below 1.5s
    http_req_failed: ["rate<0.1"], // Error rate must be below 10%
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";

export default function () {
  // Simulate user journey: orchestrator task execution
  const payload = JSON.stringify({
    task: "complex-analysis",
    agent: "test-architect",
    parameters: {
      complexity: "high",
      priority: "normal",
    },
  });

  const params = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = http.post(`${BASE_URL}/api/orchestrate`, payload, params);

  check(response, {
    "status is 200": (r) => r.status === 200,
    "response time < 1000ms": (r) => r.timings.duration < 1000,
    "has session id": (r) => r.json().sessionId !== undefined,
  });

  sleep(1); // Wait 1 second between iterations
}
