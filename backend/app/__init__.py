from flask import Flask
from flask_cors import CORS

from config import Config
from app.db import init_db, close_db
from app.blueprints.auth import bp as auth_bp
from app.blueprints.api_keys import bp as api_keys_bp
from app.blueprints.profile import bp as profile_bp
from app.blueprints.experiences import bp as experiences_bp
from app.blueprints.projects import bp as projects_bp
from app.blueprints.job_descriptions import bp as job_descriptions_bp
from app.blueprints.blurbs import bp as blurbs_bp
from app.blueprints.agent import bp as agent_bp
from app.blueprints.latex import bp as latex_bp


def create_app(test_config: dict | None = None) -> Flask:
    app = Flask(__name__, instance_relative_config=True)
    app.config.from_object(Config)

    if test_config is not None:
        app.config.update(test_config)

    CORS(app, resources={r"/*": {"origins": "*"}})

    # Ensure the instance folder exists
    import os
    os.makedirs(app.instance_path, exist_ok=True)

    # Database
    init_db(app)
    app.teardown_appcontext(close_db)

    # Blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(api_keys_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(experiences_bp)
    app.register_blueprint(projects_bp)
    app.register_blueprint(job_descriptions_bp)
    app.register_blueprint(blurbs_bp)
    app.register_blueprint(agent_bp)
    app.register_blueprint(latex_bp)

    # Standard error handlers
    @app.errorhandler(404)
    def not_found(e):
        from flask import jsonify
        return jsonify({"error": {"code": "NOT_FOUND", "message": str(e)}}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        from flask import jsonify
        return jsonify({"error": {"code": "METHOD_NOT_ALLOWED", "message": str(e)}}), 405

    return app
