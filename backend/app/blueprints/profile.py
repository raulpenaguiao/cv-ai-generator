from flask import Blueprint, jsonify

bp = Blueprint("profile", __name__)

_STUB_PROFILE = {
    "id": "stub-profile-id-0001",
    "firstName": "Jane",
    "lastName": "Doe",
    "email": "jane.doe@example.com",
    "phone": "+44 7700 900000",
    "location": "London, UK",
    "website": "https://janedoe.dev",
    "linkedin": "https://linkedin.com/in/janedoe",
    "github": "https://github.com/janedoe",
    "updatedAt": "2026-01-01T00:00:00Z",
}

_STUB_PHOTO = {
    "id": "stub-photo-id-0001",
    "filename": "profile.jpg",
    "isMain": True,
    "url": "https://placehold.co/200x200",
}


@bp.get("/profile")
def get_profile():
    return jsonify(_STUB_PROFILE), 200


@bp.put("/profile")
def save_profile():
    return jsonify({"id": "stub-profile-id-0001", "updatedAt": "2026-01-01T00:00:00Z"}), 200


@bp.post("/profile/photos")
def upload_photo():
    return jsonify(_STUB_PHOTO), 201


@bp.delete("/profile/photos/<photo_id>")
def delete_photo(photo_id: str):
    return "", 204


@bp.put("/profile/photos/<photo_id>/select-main")
def select_main_photo(photo_id: str):
    return jsonify({"message": "Main photo updated (stub)"}), 200
