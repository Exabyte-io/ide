from typing import Optional

from mat3ra.code.entity import InMemoryEntityPydantic
from mat3ra.esse.models.job.compute import Cluster as ClusterESSE, Queue, ComputeArgumentsSchema


class Cluster(InMemoryEntityPydantic, ClusterESSE):
    pass


class ComputeConfiguration(InMemoryEntityPydantic, ComputeArgumentsSchema):
    queue: Queue
    nodes: int = 1
    ppn: int = 1
    # ESSE should define default
    timeLimit: Optional[str] = "01:00:00"
    cluster: Optional[Cluster] = None
    # This should be defined based on the queue (or cluster) used
    maxCPU: Optional[int] = None

