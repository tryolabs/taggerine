import os
from flask import Blueprint, jsonify, request, send_file
from flask_apispec import marshal_with, use_kwargs
from PIL import Image as PilImage, ImageOps

from ..models import db, Project, Image
from ..serializers import ProjectSchema

DEFAULT_THUMBNAIL_SIZE = (120, 120)
UPLOAD_FOLDER = '/upload'
bp = Blueprint('projects', __name__, url_prefix='/projects')


def get_project_folder(project):
    return project.name.replace(' ', '_')


@bp.route('/', methods=['GET'])
def project_list():
    projects = db.query(Project).all()
    schema = ProjectSchema()
    serialized = [schema.dump(p).data for p in projects]
    return jsonify(projects=serialized)


@bp.route('/', methods=['POST'])
def create_project():
    print(request)
    print(request.get_json())
    name = request.get_json()['name']
    project = Project(name=name)
    db.add(project)
    db.commit()

    target = '{}/{}'.format(UPLOAD_FOLDER, get_project_folder(project))
    os.mkdir(target)
    thumbnails_folder = '{}/thumbnails'.format(target)
    os.mkdir(thumbnails_folder)

    return jsonify(status='ok', project_id=project.id)


@bp.route('/<id>', methods=('GET',))
def get_project(id):
    project = db.query(Project).filter_by(id=id).first()
    return project


@bp.route('/<id>/images', methods=['POST'])
def upload_images(id):
    project = db.query(Project).filter_by(id=id).first()
    target = '{}/{}'.format(UPLOAD_FOLDER, get_project_folder(project))
    thumbnails_folder = '{}/thumbnails'.format(target)
    images = []
    filenames = [
        image.filename.rsplit('/')[0]
        for image in request.files.values()
    ]
    already_uploaded = db.query(Image).filter(Image.name.in_(filenames))
    already_uploaded_names = [image.name for image in already_uploaded]
    for upload in request.files.values():
        filename = upload.filename.rsplit('/')[0]
        if filename not in already_uploaded_names:
            destination = '/'.join([target, filename])
            print('Accept incoming file:', filename)
            print('Save it to:', destination)
            upload.save(destination)
            images.append(Image(name=filename, project_id=id))
            # generate thumbnail
            thumb = ImageOps.fit(
                PilImage.open(destination), DEFAULT_THUMBNAIL_SIZE,
                PilImage.ANTIALIAS
            )
            thumb.save('/'.join([thumbnails_folder, filename]))
    if len(images) > 0:
        db.bulk_save_objects(images)
        db.commit()
    return jsonify(status='ok', msg='upload successful')


@bp.route('/<id>/images', methods=['GET'])
def get_images(id):
    project = db.query(Project).filter_by(id=id).first()

    return jsonify(
        status='ok', images=[img.name for img in project.images],
        total_images=len(project.images)
    )


@bp.route('/<id>/images/<imagename>', methods=['GET'])
def get_image(id, imagename):
    project = db.query(Project).filter_by(id=id).first()
    imagePath = '{}/{}/{}'.format(
        UPLOAD_FOLDER, get_project_folder(project), imagename
    )
    return send_file(imagePath)


@bp.route('/<id>/images/thumbnail/<imagename>', methods=['GET'])
def get_image_thumbnail(id, imagename):
    project = db.query(Project).filter_by(id=id).first()
    target = '{}/{}'.format(UPLOAD_FOLDER, get_project_folder(project))
    thumbnails_folder = '{}/thumbnails'.format(target)
    thumbnail_path = '{}/{}'.format(thumbnails_folder, imagename)
    return send_file(thumbnail_path)
