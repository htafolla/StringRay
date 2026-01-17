import { executeCompleteE2ESimulation } from "../../dist/simulation/complete-end-to-end-simulation.js";

async function runSimulation() {
  try {
    const result = await executeCompleteE2ESimulation(
      "Test the complete StrRay pipeline",
    );
    console.log("Simulation completed:", result.success ? "SUCCESS" : "FAILED");
    console.log("Phases completed:", result.phases.length);
    console.log("Execution time:", result.executionTime + "ms");
  } catch (error) {
    console.error("Simulation failed:", error);
  }
}

runSimulation();
