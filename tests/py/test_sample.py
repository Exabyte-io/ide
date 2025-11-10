import numpy as np

from mat3ra.ide import get_length


def test_get_length():
    """Test that get_length returns correct type and value."""
    vec = np.array([1, 2])
    result = get_length(vec)
    assert isinstance(result, float)
    assert np.isclose(result, np.sqrt(5))

