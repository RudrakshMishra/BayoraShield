from tests.breach.runner import load_fixture, summarize


def test_fixture_contains_fourteen_metadata_only_results():
    fixture = load_fixture()
    assert len(fixture["results"]) == 14
    assert all(set(item) == {"test_id", "name", "attempt", "baseline", "shield", "control"} for item in fixture["results"])


def test_expected_demo_outcomes():
    summary = summarize(load_fixture()["results"])
    assert summary["baseline"]["succeeded"] == 12
    assert summary["baseline"]["n/a"] == 2
    assert summary["shield"]["blocked"] == 14
