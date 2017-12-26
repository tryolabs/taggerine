from flask import Blueprint, jsonify


bp = Blueprint('projects', __name__, url_prefix='/projects')


@bp.route('/', methods=['GET'])
def project_list():
    return jsonify(projects=[])
