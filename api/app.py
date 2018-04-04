import logging

from flask import Flask, jsonify
from flask_compress import Compress
from flask_cors import CORS

from . import settings
from .views import projects


BLUEPRINTS = (
    projects.bp,
)

logger = logging.getLogger('api')


def create_app(config=None):
    app = Flask(__name__)
    app.config.from_object(settings)

    configure_logging(app)
    configure_blueprints(app, BLUEPRINTS)
    configure_error_handlers(app)
    configure_extensions(app)

    logger.info('Flask app created successfully')

    return app


def configure_db(app):
    """
    Make Flask destroy sessions on context teardown.
    """
    @app.teardown_appcontext
    def shutdown_session(response_or_exc):
        return response_or_exc


def configure_blueprints(app, blueprints):
    logger.info(
        'Registering blueprints = %s',
        ", ".join([bp.name for bp in blueprints])
    )
    for blueprint in blueprints:
        app.register_blueprint(blueprint)


def configure_error_handlers(app):

    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'error': 'bad_request',
            'message': error.description,
        }), 401

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error': 'not_found',
            'message': error.description,
        }), 404


def configure_extensions(app):
    CORS(app, max_age=600)
    Compress(app)


def configure_logging(app):
    # Log to standard output/error so the docker daemon picks it up.
    logging.basicConfig(
        format='%(asctime)s :: %(name)s :: %(levelname)s :: %(message)s',
        datefmt="%Y-%m-%dT%H:%M:%S", level=logging.INFO
    )


app = create_app()
