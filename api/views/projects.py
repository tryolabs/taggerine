from flask import Blueprint, jsonify

from ..models import db, Project
from ..serializers import ProjectSchema


bp = Blueprint('projects', __name__, url_prefix='/projects')


@bp.route('/', methods=['GET'])
def project_list():
    projects = db.query(Project).all()
    schema = ProjectSchema()
    serialized = [schema.dump(p).data for p in projects]
    return jsonify(projects=serialized)
