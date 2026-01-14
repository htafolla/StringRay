"""Performance monitoring for StringRay agents."""

import time
from typing import Dict, Any, Optional
from collections import defaultdict

try:
    import psutil

    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False


class PerformanceMonitor:
    """Monitor performance metrics for agents."""

    def __init__(self):
        """Initialize performance monitor."""
        self.metrics: Dict[str, list] = defaultdict(list)
        self.start_times: Dict[str, float] = {}

    def start_timer(self, operation: str) -> None:
        """Start timing an operation."""
        self.start_times[operation] = time.perf_counter()

    def stop_timer(self, operation: str) -> float:
        """Stop timing and return duration."""
        if operation in self.start_times:
            duration = time.perf_counter() - self.start_times[operation]
            del self.start_times[operation]
            return duration
        return 0.0

    def record_metric(
        self,
        name: str,
        value: float,
        unit: str = "",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Record a performance metric."""
        metric_data = {
            "timestamp": time.time(),
            "value": value,
            "unit": unit,
            "metadata": metadata or {},
        }
        self.metrics[name].append(metric_data)

        # Keep only last 1000 metrics per name
        if len(self.metrics[name]) > 1000:
            self.metrics[name] = self.metrics[name][-1000:]

    def get_metrics(self, name: str, limit: int = 100) -> list:
        """Get recent metrics for a name."""
        return self.metrics[name][-limit:]

    def get_system_stats(self) -> Dict[str, Any]:
        """Get current system statistics."""
        if not HAS_PSUTIL:
            return {"error": "psutil not available", "timestamp": time.time()}

        return {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage("/").percent,
            "timestamp": time.time(),
        }

    def clear_metrics(self, name: Optional[str] = None) -> None:
        """Clear metrics."""
        if name:
            self.metrics[name].clear()
        else:
            self.metrics.clear()
