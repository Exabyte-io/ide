from mat3ra.ide.compute import ComputeConfiguration
from mat3ra.ide import Cluster, Queue


def test_compute_configuration():
    """Test ComputeConfiguration can be created with Cluster."""
    cluster = Cluster(fqdn="master-1-staging.exabyte.io")
    compute = ComputeConfiguration(
        queue=Queue.D,
        nodes=1,
        ppn=1,
        cluster=cluster,
    )
    assert compute.queue == Queue.OR8
    assert compute.queue == "OR8"
    assert compute.nodes == 1
    assert compute.ppn == 8
    assert compute.cluster is not None
    assert compute.cluster.fqdn == "master-1-staging.exabyte.io"
    assert compute.cluster.jid is None
