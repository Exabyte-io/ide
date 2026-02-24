import warnings
from typing import Any, Dict, List, Optional

from pydantic import model_validator

from mat3ra.code.entity import InMemoryEntitySnakeCase
from mat3ra.esse.models.job.compute import Cluster as ClusterESSE
from mat3ra.esse.models.job.compute import ComputeArgumentsSchema
from mat3ra.esse.models.job.queue import Name as QueueName, QueueSchema


class Queue(QueueSchema, InMemoryEntitySnakeCase):
    pass


class Cluster(ClusterESSE, InMemoryEntitySnakeCase):
    queues: List[Queue] = []

    def get_queue(self, name: QueueName) -> Optional[Queue]:
        return next((q for q in self.queues if q.name == name), None)


class Compute(ComputeArgumentsSchema, InMemoryEntitySnakeCase):
    queue: QueueName
    nodes: int = 1
    ppn: int = 1
    # ESSE should define default
    timeLimit: Optional[str] = "01:00:00"
    cluster: Optional[Cluster] = None


    @model_validator(mode="after")
    def validate_limits(self) -> "Compute":
        if not self.cluster:
            return self
        queue = self.cluster.get_queue(self.queue)
        if not queue:
            return self
        if self.ppn > queue.max_ppn:
            warnings.warn(f"ppn={self.ppn} exceeds max_ppn={queue.max_ppn} for {self.queue.value}, set to {queue.max_ppn}.")
            self.ppn = queue.max_ppn
        if self.nodes > queue.max_nodes:
            warnings.warn(f"nodes={self.nodes} exceeds max_nodes={queue.max_nodes} for {self.queue.value}, set to {queue.max_nodes}.")
            self.nodes = queue.max_nodes
        return self
