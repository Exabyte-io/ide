from mat3ra.ide.compute import ComputeConfiguration
from mat3ra.ide import Cluster, Queue


def test_compute_configuration():
    cluster = Cluster(fqdn="master-1-staging.exabyte.io")
    compute = ComputeConfiguration(
        queue=Queue.D,
        nodes=1,
        ppn=8,
        cluster=cluster,
    )
    assert compute.queue == Queue.D
    assert compute.nodes == 1
    assert compute.ppn == 8
    assert compute.cluster is not None
    assert compute.cluster.fqdn == "master-1-staging.exabyte.io"
    assert compute.cluster.jid is None
