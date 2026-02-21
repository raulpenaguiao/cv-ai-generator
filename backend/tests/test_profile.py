"""Tests for the profile blueprint stub endpoints."""


def test_get_profile_returns_200(client):
    res = client.get("/profile")
    assert res.status_code == 200


def test_get_profile_has_required_fields(client):
    data = client.get("/profile").get_json()
    for field in ("id", "firstName", "lastName", "email", "phone", "location"):
        assert field in data, f"Missing field: {field}"


def test_save_profile_returns_200(client):
    payload = {
        "firstName": "John",
        "lastName": "Smith",
        "email": "j@s.com",
        "phone": "+1 555 0000",
        "location": "NYC",
        "website": "",
        "linkedin": "",
        "github": "",
    }
    res = client.put("/profile", json=payload)
    assert res.status_code == 200


def test_save_profile_response_has_id(client):
    res = client.put("/profile", json={})
    data = res.get_json()
    assert "id" in data
    assert "updatedAt" in data


def test_upload_photo_returns_201(client):
    from io import BytesIO
    data = {"photo": (BytesIO(b"fake image bytes"), "photo.jpg")}
    res = client.post("/profile/photos", data=data, content_type="multipart/form-data")
    assert res.status_code == 201


def test_delete_photo_returns_204(client):
    res = client.delete("/profile/photos/stub-photo-id-0001")
    assert res.status_code == 204


def test_select_main_photo_returns_200(client):
    res = client.put("/profile/photos/stub-photo-id-0001/select-main")
    assert res.status_code == 200
