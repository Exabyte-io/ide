import warnings
from typing import Any, Optional
from typing import List

from mat3ra.code.entity import InMemoryEntitySnakeCase
from mat3ra.esse.models.compute.nodes.cluster import ClusterNodeSchema
from mat3ra.esse.models.job.compute import ComputeArgumentsSchema, Cluster as ComputeClusterSchema
from mat3ra.esse.models.job.queue import Name as QueueName, QueueSchema
from pydantic import model_validator


class Queue(QueueSchema, InMemoryEntitySnakeCase):
    pass


class Cluster(ClusterNodeSchema, InMemoryEntitySnakeCase):
    queues: List[Queue] = []

    def get_queue(self, name: QueueName) -> Optional[Queue]:
        return next((q for q in self.queues if q.name == name), None)


class ComputeCluster(ComputeClusterSchema, InMemoryEntitySnakeCase):
    pass


class Compute(ComputeArgumentsSchema, InMemoryEntitySnakeCase):
    queue: QueueName
    nodes: int = 1
    ppn: int = 1
    # ESSE should define default
    timeLimit: Optional[str] = "01:00:00"
    cluster: Optional[ComputeCluster] = None

    @model_validator(mode="before")
    @classmethod
    def accept_full_cluster_then_downcast(cls, values: Any) -> Any:
        if not isinstance(values, dict):
            return values

        cluster_value = values.get("cluster")
        if cluster_value is None or isinstance(cluster_value, ComputeCluster):
            return values

        if not isinstance(cluster_value, Cluster):
            return values

        queue_name = values.get("queue")
        queue = cluster_value.get_queue(queue_name) if queue_name is not None else None
        if queue_name is not None:
            requested_ppn = values.get("ppn", 1)
            requested_nodes = values.get("nodes", 1)

            if requested_ppn > queue.max_ppn:
                msg = (
                    f"ppn={requested_ppn} exceeds max_ppn={queue.max_ppn} for "
                    f"{queue_name.value}, set to {queue.max_ppn}."
                )
                warnings.warn(msg)
                values["ppn"] = queue.max_ppn

            if requested_nodes > queue.max_nodes:
                msg = (
                    f"nodes={requested_nodes} exceeds max_nodes={queue.max_nodes} for "
                    f"{queue_name.value}, set to {queue.max_nodes}."
                )
                warnings.warn(msg)
                values["nodes"] = queue.max_nodes
        fqdn = cluster_value.fqdn or cluster_value.hostname
        values["cluster"] = ComputeCluster(fqdn=fqdn) if fqdn else None
        return values


