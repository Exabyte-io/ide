from typing import Optional

from mat3ra.code.entity import InMemoryEntityPydantic
from mat3ra.esse.models.job.compute import Cluster, Queue


class ComputeConfiguration(InMemoryEntityPydantic):
    queue: Queue
    nodes: int = 1
    ppn: int = 1
    cluster: Optional[Cluster] = None
    timeLimit: Optional[str] = None
    notify: Optional[str] = None
    timeLimitType: Optional[str] = None
    isRestartable: Optional[bool] = None
    email: Optional[str] = None
    maxCPU: Optional[int] = None

