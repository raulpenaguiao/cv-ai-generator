"""Tests for the experiences blueprint stub endpoints."""


def test_list_experiences_returns_200(client):
    res = client.get("/experiences")
    assert res.status_code == 200


def test_list_experiences_returns_list(client):
    data = client.get("/experiences").get_json()
    assert isinstance(data, list)


def test_list_experiences_items_have_required_fields(client):
    data = client.get("/experiences").get_json()
    assert len(data) > 0
    for item in data:
        for field in ("id", "category", "title", "organization", "startDate", "keywords"):
            assert field in item, f"Missing field '{field}' in experience item"


def test_add_experience_returns_201(client):
    payload = {
        "category": "work",
        "title": "Engineer",
        "organization": "Corp",
        "startDate": "2023-01-01",
        "endDate": None,
        "description": "Did engineering.",
        "keywords": ["Python"],
    }
    res = client.post("/experiences", json=payload)
    assert res.status_code == 201


def test_update_experience_returns_200(client):
    res = client.put("/experiences/stub-exp-id-0001", json={"title": "Updated"})
    assert res.status_code == 200


def test_delete_experience_returns_204(client):
    res = client.delete("/experiences/stub-exp-id-0001")
    assert res.status_code == 204
