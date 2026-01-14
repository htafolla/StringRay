"""
StringRay Framework - Async Orchestration System

Provides multi-agent workflow coordination with persistent state management,
conflict resolution, and delegation capabilities.
"""

import asyncio
import json
import time
from typing import Dict, List, Optional, Any, Callable
from dataclasses import dataclass, field
from enum import Enum
import logging

from strray.core.agent import BaseAgent
from strray.config.manager import ConfigManager


class WorkflowStatus(Enum):
    """Workflow execution status."""

    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class TaskPriority(Enum):
    """Task priority levels."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class WorkflowTask:
    """Represents a task within a workflow."""

    id: str
    name: str
    agent_type: str
    priority: TaskPriority = TaskPriority.MEDIUM
    dependencies: List[str] = field(default_factory=list)
    status: WorkflowStatus = WorkflowStatus.PENDING
    result: Optional[Any] = None
    error: Optional[str] = None
    start_time: Optional[float] = None
    end_time: Optional[float] = None
    retry_count: int = 0
    max_retries: int = 3


@dataclass
class Workflow:
    """Represents a multi-agent workflow."""

    id: str
    name: str
    tasks: Dict[str, WorkflowTask] = field(default_factory=dict)
    status: WorkflowStatus = WorkflowStatus.PENDING
    created_at: float = field(default_factory=time.time)
    completed_at: Optional[float] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


class ConflictResolutionStrategy(Enum):
    """Strategies for resolving agent conflicts."""

    MAJORITY_VOTE = "majority_vote"
    EXPERT_PRIORITY = "expert_priority"
    CONSENSUS = "consensus"
    MANUAL_OVERRIDE = "manual_override"


class AsyncCoordinator:
    """
    Multi-agent orchestration system with async coordination.

    Features:
    - Persistent workflow state management
    - Conflict resolution between agents
    - Task delegation and dependency management
    - Progress monitoring and reporting
    - Retry logic and error recovery
    """

    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """Initialize the async coordinator."""
        self.config = config or {}
        self.workflows: Dict[str, Workflow] = {}
        self.agents: Dict[str, BaseAgent] = {}
        self.logger = logging.getLogger(__name__)

        # Load configuration
        self.max_concurrent_tasks = self.config.get("max_concurrent_tasks", 5)
        self.task_timeout = self.config.get("task_timeout", 300)
        self.retry_delay = self.config.get("retry_delay", 1.0)
        self.conflict_resolution = ConflictResolutionStrategy(
            self.config.get(
                "conflict_resolution", ConflictResolutionStrategy.MAJORITY_VOTE.value
            )
        )

        # Initialize state persistence
        self.state_file = self.config.get("state_file", ".strray/workflow_state.json")
        self._load_state()

    def register_agent(self, agent_type: str, agent: BaseAgent) -> None:
        """Register an agent for task delegation."""
        self.agents[agent_type] = agent
        self.logger.info(f"Registered agent: {agent_type}")

    def create_workflow(
        self, workflow_id: str, name: str, metadata: Optional[Dict[str, Any]] = None
    ) -> Workflow:
        """Create a new workflow."""
        workflow = Workflow(id=workflow_id, name=name, metadata=metadata or {})
        self.workflows[workflow_id] = workflow
        self._save_state()
        self.logger.info(f"Created workflow: {workflow_id}")
        return workflow

    def add_task(self, workflow_id: str, task: WorkflowTask) -> None:
        """Add a task to a workflow."""
        if workflow_id not in self.workflows:
            raise ValueError(f"Workflow {workflow_id} does not exist")

        workflow = self.workflows[workflow_id]
        workflow.tasks[task.id] = task
        self._save_state()
        self.logger.info(f"Added task {task.id} to workflow {workflow_id}")

    def async_coordinate_workflow(self, workflow_id: str) -> asyncio.Task:
        """Asynchronously coordinate workflow execution."""
        return asyncio.create_task(self._execute_workflow(workflow_id))

    async def coordinate_workflow(self, workflow: Dict[str, Any]) -> Dict[str, Any]:
        """
        Coordinate a multi-agent workflow.

        Args:
            workflow: Workflow definition with tasks and dependencies

        Returns:
            Workflow execution results
        """
        workflow_id = workflow.get("id", f"workflow_{int(time.time())}")
        workflow_name = workflow.get("name", "Unnamed Workflow")

        # Create workflow object
        wf = self.create_workflow(workflow_id, workflow_name, workflow.get("metadata"))

        # Add tasks
        tasks = workflow.get("tasks", [])
        for task_def in tasks:
            task = WorkflowTask(
                id=task_def["id"],
                name=task_def["name"],
                agent_type=task_def["agent_type"],
                priority=TaskPriority(task_def.get("priority", "medium")),
                dependencies=task_def.get("dependencies", []),
            )
            self.add_task(workflow_id, task)

        # Execute workflow
        await self._execute_workflow(workflow_id)

        # Return results
        return self.get_workflow_results(workflow_id)

    async def _execute_workflow(self, workflow_id: str) -> None:
        """Execute a workflow with proper task ordering."""
        if workflow_id not in self.workflows:
            raise ValueError(f"Workflow {workflow_id} does not exist")

        workflow = self.workflows[workflow_id]
        workflow.status = WorkflowStatus.RUNNING

        try:
            # Execute tasks in dependency order
            remaining_tasks = list(workflow.tasks.keys())

            while remaining_tasks:
                # Find tasks with satisfied dependencies
                executable_tasks = []
                for task_id in remaining_tasks:
                    task = workflow.tasks[task_id]
                    if self._dependencies_satisfied(task, workflow):
                        executable_tasks.append(task_id)

                if not executable_tasks:
                    raise ValueError(
                        f"Circular dependency detected in workflow {workflow_id}"
                    )

                # Execute tasks concurrently (up to max_concurrent_tasks)
                batch_size = min(len(executable_tasks), self.max_concurrent_tasks)
                batch_tasks = executable_tasks[:batch_size]

                # Create async tasks
                async_tasks = []
                for task_id in batch_tasks:
                    task = asyncio.create_task(self._execute_task(workflow_id, task_id))
                    async_tasks.append(task)

                # Wait for batch completion
                await asyncio.gather(*async_tasks, return_exceptions=True)

                # Remove completed tasks
                for task_id in batch_tasks:
                    if workflow.tasks[task_id].status in [
                        WorkflowStatus.COMPLETED,
                        WorkflowStatus.FAILED,
                    ]:
                        remaining_tasks.remove(task_id)

            # Mark workflow as completed
            workflow.status = WorkflowStatus.COMPLETED
            workflow.completed_at = time.time()

        except Exception as e:
            workflow.status = WorkflowStatus.FAILED
            self.logger.error(f"Workflow {workflow_id} failed: {e}")

        finally:
            self._save_state()

    async def _execute_task(self, workflow_id: str, task_id: str) -> None:
        """Execute a single task."""
        workflow = self.workflows[workflow_id]
        task = workflow.tasks[task_id]

        task.status = WorkflowStatus.RUNNING
        task.start_time = time.time()

        try:
            # Get appropriate agent
            if task.agent_type not in self.agents:
                raise ValueError(f"No agent registered for type: {task.agent_type}")

            agent = self.agents[task.agent_type]

            # Create task payload
            task_payload = {
                "id": task.id,
                "content": task.name,
                "priority": task.priority.value,
                "workflow_id": workflow_id,
            }

            # Execute task with timeout
            result = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(
                    None, agent.execute_task, task_payload
                ),
                timeout=self.task_timeout,
            )

            task.result = result
            task.status = WorkflowStatus.COMPLETED

        except asyncio.TimeoutError:
            task.error = "Task timed out"
            task.status = WorkflowStatus.FAILED
        except Exception as e:
            task.error = str(e)
            task.status = WorkflowStatus.FAILED

            # Retry logic
            if task.retry_count < task.max_retries:
                task.retry_count += 1
                self.logger.info(
                    f"Retrying task {task_id} (attempt {task.retry_count})"
                )
                await asyncio.sleep(self.retry_delay * task.retry_count)
                await self._execute_task(workflow_id, task_id)
                return

        finally:
            task.end_time = time.time()
            self._save_state()

    def _dependencies_satisfied(self, task: WorkflowTask, workflow: Workflow) -> bool:
        """Check if task dependencies are satisfied."""
        for dep_id in task.dependencies:
            if dep_id not in workflow.tasks:
                return False
            dep_task = workflow.tasks[dep_id]
            if dep_task.status != WorkflowStatus.COMPLETED:
                return False
        return True

    async def delegate_task(
        self, task: Dict[str, Any], agent_type: str
    ) -> Dict[str, Any]:
        """
        Delegate a task to a specific agent type.

        Args:
            task: Task definition
            agent_type: Type of agent to handle the task

        Returns:
            Task execution result
        """
        if agent_type not in self.agents:
            raise ValueError(f"No agent registered for type: {agent_type}")

        agent = self.agents[agent_type]
        return await asyncio.get_event_loop().run_in_executor(
            None, agent.execute_task, task
        )

    def resolve_conflicts(self, conflicts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Resolve conflicts between agent responses.

        Args:
            conflicts: List of conflicting responses with agent metadata

        Returns:
            Resolved response
        """
        if not conflicts:
            return {}

        if len(conflicts) == 1:
            return conflicts[0]

        # Apply conflict resolution strategy
        if self.conflict_resolution == ConflictResolutionStrategy.MAJORITY_VOTE:
            return self._resolve_by_majority_vote(conflicts)
        elif self.conflict_resolution == ConflictResolutionStrategy.EXPERT_PRIORITY:
            return self._resolve_by_expert_priority(conflicts)
        elif self.conflict_resolution == ConflictResolutionStrategy.CONSENSUS:
            return self._resolve_by_consensus(conflicts)
        else:
            # Default to first response
            return conflicts[0]

    def _resolve_by_majority_vote(
        self, conflicts: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Resolve conflicts by majority vote."""
        # Simplified majority vote - return most common response
        responses = [c.get("response") for c in conflicts]
        most_common = max(set(responses), key=responses.count)
        return next(c for c in conflicts if c.get("response") == most_common)

    def _resolve_by_expert_priority(
        self, conflicts: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Resolve conflicts by agent expertise priority."""
        # Sort by agent priority/expertise score
        sorted_conflicts = sorted(
            conflicts, key=lambda x: x.get("expertise_score", 0), reverse=True
        )
        return sorted_conflicts[0]

    def _resolve_by_consensus(self, conflicts: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Resolve conflicts by finding consensus."""
        # Find responses within similarity threshold
        # Simplified - return first response (implement similarity logic as needed)
        return conflicts[0]

    def get_workflow_results(self, workflow_id: str) -> Dict[str, Any]:
        """Get results for a completed workflow."""
        if workflow_id not in self.workflows:
            raise ValueError(f"Workflow {workflow_id} does not exist")

        workflow = self.workflows[workflow_id]

        return {
            "workflow_id": workflow_id,
            "status": workflow.status.value,
            "tasks": {
                task_id: {
                    "status": task.status.value,
                    "result": task.result,
                    "error": task.error,
                    "duration": (
                        task.end_time - task.start_time
                        if task.start_time and task.end_time
                        else None
                    ),
                }
                for task_id, task in workflow.tasks.items()
            },
            "created_at": workflow.created_at,
            "completed_at": workflow.completed_at,
            "metadata": workflow.metadata,
        }

    def _load_state(self) -> None:
        """Load workflow state from persistent storage."""
        try:
            with open(self.state_file, "r") as f:
                state_data = json.load(f)
                # Restore workflows from state
                for wf_data in state_data.get("workflows", []):
                    workflow = Workflow(**wf_data)
                    self.workflows[workflow.id] = workflow
        except (FileNotFoundError, json.JSONDecodeError):
            # Start with empty state
            pass

    def _save_state(self) -> None:
        """Save workflow state to persistent storage."""
        try:
            # Create directory if needed
            import os

            os.makedirs(os.path.dirname(self.state_file), exist_ok=True)

            state_data = {
                "workflows": [
                    {
                        "id": wf.id,
                        "name": wf.name,
                        "status": wf.status.value,
                        "created_at": wf.created_at,
                        "completed_at": wf.completed_at,
                        "metadata": wf.metadata,
                        "tasks": {
                            tid: {
                                "id": t.id,
                                "name": t.name,
                                "agent_type": t.agent_type,
                                "priority": t.priority.value,
                                "dependencies": t.dependencies,
                                "status": t.status.value,
                                "result": t.result,
                                "error": t.error,
                                "start_time": t.start_time,
                                "end_time": t.end_time,
                                "retry_count": t.retry_count,
                                "max_retries": t.max_retries,
                            }
                            for tid, t in wf.tasks.items()
                        },
                    }
                    for wf in self.workflows.values()
                ]
            }

            with open(self.state_file, "w") as f:
                json.dump(state_data, f, indent=2)

        except Exception as e:
            self.logger.error(f"Failed to save workflow state: {e}")

    def cleanup_completed_workflows(self, max_age: int = 86400) -> int:
        """
        Clean up old completed workflows.

        Args:
            max_age: Maximum age in seconds for completed workflows

        Returns:
            Number of workflows cleaned up
        """
        current_time = time.time()
        to_remove = []

        for wf_id, workflow in self.workflows.items():
            if (
                workflow.status in [WorkflowStatus.COMPLETED, WorkflowStatus.FAILED]
                and workflow.completed_at
                and current_time - workflow.completed_at > max_age
            ):
                to_remove.append(wf_id)

        for wf_id in to_remove:
            del self.workflows[wf_id]

        if to_remove:
            self._save_state()

        return len(to_remove)
