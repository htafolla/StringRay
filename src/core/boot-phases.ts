/**
 * Boot Phases Configuration
 *
 * Defines the phases and their order for the boot sequence.
 * This file centralizes boot phase definitions for maintainability.
 *
 * @version 1.0.0
 * @since 2026-01-07
 */

export interface BootPhase {
  id: number;
  name: string;
  description: string;
  required: boolean;
}

export const BOOT_PHASES: BootPhase[] = [
  {
    id: 0,
    name: "Configuration",
    description: "Load StringRay configuration",
    required: true,
  },
  {
    id: 1,
    name: "Core Systems",
    description: "Initialize core systems including orchestrator",
    required: true,
  },
  {
    id: 2,
    name: "Delegation System",
    description: "Initialize delegation system components",
    required: true,
  },
  {
    id: 3,
    name: "Session Management",
    description: "Initialize session management",
    required: false,
  },
  {
    id: 4,
    name: "Processors",
    description: "Activate pre/post processors",
    required: false,
  },
  {
    id: 5,
    name: "Agents",
    description: "Load framework agents",
    required: false,
  },
  {
    id: 6,
    name: "Security",
    description: "Enable enforcement and compliance",
    required: false,
  },
];

export function getBootPhase(phaseId: number): BootPhase | undefined {
  return BOOT_PHASES.find(phase => phase.id === phaseId);
}

export function getRequiredPhases(): BootPhase[] {
  return BOOT_PHASES.filter(phase => phase.required);
}
