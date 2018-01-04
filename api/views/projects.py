import os
from flask import Blueprint, jsonify, request
from flask_apispec import marshal_with, use_kwargs
from PIL import Image as PilImage

from ..models import db, Project, Image
from ..serializers import ProjectSchema

DEFAULT_THUMBNAIL_SIZE = (120, 120)

bp = Blueprint('projects', __name__, url_prefix='/projects')


@bp.route('/', methods=['GET'])
def project_list():
    projects = db.query(Project).all()
    schema = ProjectSchema()
    serialized = [schema.dump(p).data for p in projects]
    return jsonify(projects=serialized)


@bp.route('/', methods=['POST'])
@use_kwargs(ProjectSchema)
def create_project(kwargs):
    project = Project(**kwargs)
    project.save()

    target = 'upload/{}'.format(project.name)
    os.mkdir(target)
    thumbnails_folder = '{}/thumbnails'.format(target)
    os.mkdir(thumbnails_folder)

    return project


@bp.route('/<id>', methods=('GET',))
def get_project(id):
    project = Project.query.filter_by(id=id).first()
    return project


@bp.route('/<id>/images', methods=['POST'])
def upload_images(id):
    project = Project.query.filter_by(id=id).first()
    target = 'upload/{}'.format(project.name)
    thumbnails_folder = '{}/thumbnails'.format(target)
    images = []
    for upload in request.files.getlist('file'):
        filename = upload.filename.rsplit('/')[0]
        destination = '/'.join([target, filename])
        print('Accept incoming file:', filename)
        print('Save it to:', destination)
        upload.save(destination)
        images.append(Image(name=filename))
        # generate thumbnail
        PilImage.open(destination).thumbnail(DEFAULT_THUMBNAIL_SIZE).save(
            '/'.join([thumbnails_folder, filename]))
    db.bulk_save_objects(images)
    db.commit()
    return jsonify(status='ok', msg='upload successful')


@bp.route('/<id>/images', methods=['GET'])
def get_images(id):
    project = Project.query.filter_by(id=id).first()
    return jsonify(status='ok', images=[img.name for img in project.images])


@bp.route('/<id>/images/<imagename>', methods=['GET'])
def get_image(id, imagename):
    project = Project.query.filter_by(id=id).first()
    imagePath = 'upload/{}/{}'.format(project.name, imagename)
    return send_file(imagePath)


@bp.route('/<id>/images/thumbnail/<imagename>', methods=['GET'])
def get_image_thumbnail(id, imagename):
    project = Project.query.filter_by(id=id).first()
    target = 'upload/{}'.format(project.name)
    thumbnails_folder = '{}/thumbnails'.format(target)
    thumbnail_path = '{}/{}'.format(thumbnails_folder, imagename)
    return send_file(thumbnail_path)
