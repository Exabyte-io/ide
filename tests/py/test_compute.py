import pytest

from mat3ra.ide import Cluster, Compute, Queue, QueueName

HOSTNAME = "master-1-staging.mat3ra.com"

QUEUE_D = Queue(name=QueueName.D, maxPpn=16, maxNodes=10, availableNodes=8, currentNodes=2)
QUEUE_OR = Queue(name=QueueName.OR, maxPpn=8, maxNodes=5, availableNodes=3, currentNodes=1)

CLUSTER_WITH_QUEUES = Cluster(hostname=HOSTNAME, queues=[QUEUE_D, QUEUE_OR])
CLUSTER_NO_QUEUES = Cluster(hostname=HOSTNAME, queues=[])

def test_queue_fields():
    assert QUEUE_D.name == QueueName.D
    assert QUEUE_D.maxPpn == 16
    assert QUEUE_D.maxNodes == 10
    assert QUEUE_D.availableNodes == 8
    assert QUEUE_D.currentNodes == 2


def test_cluster_get_queue_found():
    assert CLUSTER_WITH_QUEUES.get_queue(QueueName.D) == QUEUE_D
    assert CLUSTER_WITH_QUEUES.get_queue(QueueName.OR) == QUEUE_OR


def test_cluster_get_queue_not_found():
    assert CLUSTER_WITH_QUEUES.get_queue(QueueName.SF) is None


def test_compute_valid():
    compute = Compute(cluster=CLUSTER_WITH_QUEUES, queue=QueueName.D, ppn=16, nodes=10)
    assert compute.queue == QueueName.D
    assert compute.ppn == 16
    assert compute.nodes == 10
    assert compute.cluster.hostname == HOSTNAME


def test_compute_ppn_exceeds_limit():
    with pytest.warns(UserWarning, match="ppn=17 exceeds max_ppn=16.*set to 16"):
        compute = Compute(cluster=CLUSTER_WITH_QUEUES, queue=QueueName.D, ppn=17, nodes=1)
    assert compute.ppn == 16


def test_compute_nodes_exceeds_limit():
    with pytest.warns(UserWarning, match="nodes=11 exceeds max_nodes=10.*set to 10"):
        compute = Compute(cluster=CLUSTER_WITH_QUEUES, queue=QueueName.D, ppn=1, nodes=11)
    assert compute.nodes == 10


def test_compute_to_dict():
    compute = Compute(cluster=CLUSTER_NO_QUEUES, queue=QueueName.D, ppn=4, nodes=1)
    config = compute.to_dict()
    assert config["queue"] == "D"
    assert config["ppn"] == 4
    assert config["cluster"]["fqdn"] == HOSTNAME
    assert "queues" not in config["cluster"]
