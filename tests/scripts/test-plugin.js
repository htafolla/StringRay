export function createTestHook() {
  return {
    name: "test-hook",
    hooks: {
      "agent.start": (sessionId) => {
        console.log("Test hook loaded successfully");
      },
    },
  };
}
