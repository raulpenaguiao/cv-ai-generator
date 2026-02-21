"""Tests for the auth blueprint stub endpoints."""
import json


def test_register_returns_201(client):
    res = client.post("/auth/register", json={"email": "new@example.com"})
    assert res.status_code == 201


def test_register_response_has_required_fields(client):
    res = client.post("/auth/register", json={"email": "new@example.com"})
    data = res.get_json()
    assert "generatedPassword" in data
    assert "userId" in data
    assert isinstance(data["generatedPassword"], str)
    assert len(data["generatedPassword"]) > 0


def test_login_returns_200(client):
    res = client.post("/auth/login", json={"email": "a@b.com", "password": "pass"})
    assert res.status_code == 200


def test_login_response_has_token(client):
    res = client.post("/auth/login", json={"email": "a@b.com", "password": "pass"})
    data = res.get_json()
    assert "token" in data
    assert "userId" in data


def test_logout_returns_200(client):
    res = client.post("/auth/logout")
    assert res.status_code == 200


def test_reset_password_request_returns_200(client):
    res = client.post("/auth/reset-password/request", json={"email": "a@b.com"})
    assert res.status_code == 200


def test_reset_password_confirm_returns_200(client):
    res = client.post(
        "/auth/reset-password/confirm",
        json={"token": "abc123", "newPassword": "NewP@ss1"},
    )
    assert res.status_code == 200
