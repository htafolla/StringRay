// This test should be BLOCKED by codex enforcement due to TODO comment
describe("Codex Enforcement Blocking Test", () => {
  test("should block TODO comments", () => {
    // TODO: This should be blocked by enforcement
    const result = "test";
    expect(result).toBe("test");
  });
});
