import warnings
from typing import List
from typing import Optional

from mat3ra.code.entity import InMemoryEntitySnakeCase
from mat3ra.esse.models.compute.nodes.cluster import ClusterNodeSchema
from mat3ra.esse.models.job.compute import ComputeArgumentsSchema, Cluster as ComputeClusterSchema
from mat3ra.esse.models.job.queue import Name as QueueName, QueueSchema
from pydantic import field_serializer, model_validator


class Queue(QueueSchema, InMemoryEntitySnakeCase):
    pass


class Cluster(ClusterNodeSchema, InMemoryEntitySnakeCase):
    queues: List[Queue] = []

    def get_queue_by_name(self, name: QueueName) -> Optional[Queue]:
        return next((q for q in self.queues if q.name == name), None)


class ComputeCluster(ComputeClusterSchema, InMemoryEntitySnakeCase):
    pass


class Compute(ComputeArgumentsSchema, InMemoryEntitySnakeCase):
    queue: QueueName
    nodes: int = 1
    ppn: int = 1
    # ESSE should define default
    timeLimit: Optional[str] = "01:00:00"
    cluster: Optional[Cluster | ComputeCluster] = None

    @field_serializer("cluster", when_used="always")
    def serialize_cluster(self, cluster: Optional[Cluster | ComputeCluster]):
        # Always serialize as a minimal ComputeCluster (fqdn only).
        if cluster is None:
            return None
        fqdn = getattr(cluster, "fqdn", None) or getattr(cluster, "hostname", None)
        return ComputeCluster(fqdn=fqdn) if fqdn else None

    @model_validator(mode="after")
    def validate_limits(self) -> "Compute":
        if not self.cluster or not isinstance(self.cluster, Cluster):
            return self
        queue = self.cluster.get_queue_by_name(self.queue)
        if not queue:
            return self
        if self.ppn > queue.max_ppn:
            msg = f"ppn={self.ppn} exceeds max_ppn={queue.max_ppn} for {self.queue.value}, set to {queue.max_ppn}."
            warnings.warn(msg)
            self.ppn = queue.max_ppn
        if self.nodes > queue.max_nodes:
            msg = (
                f"nodes={self.nodes} exceeds max_nodes={queue.max_nodes} for "
                f"{self.queue.value}, set to {queue.max_nodes}."
            )
            warnings.warn(msg)
            self.nodes = queue.max_nodes
        return self
