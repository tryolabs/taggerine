import os
from flask import Blueprint, jsonify, request, send_file
from flask_apispec import marshal_with, use_kwargs
from PIL import Image as PilImage, ImageOps

from ..models import db, Project, Image, Tag
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

    # Generate dict {filename: upload} with corrected filenames
    files = {
        # Extract filename from path and replace spaces by "_"
        image.filename.rsplit('/')[0].replace(' ', '_'): image
        for image in request.files.values()
    }
    already_uploaded_names = [image.name
                              for image in db.query(Image).filter(
                                  Image.name.in_(files.keys()))]
    for filename in files:
        if filename not in already_uploaded_names:
            destination = '/'.join([target, filename])
            print('Accept incoming file:', filename)
            print('Save it to:', destination)
            files[filename].save(destination)
            images.append(Image(name=filename, project_id=id, tags=[]))
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
            status='ok', images=[{'name': img.name, 'tags': img.tags} for img in project.images],
            total_images=len(project.images)
    )


@bp.route('/<project_id>/tags', methods=['GET'])
def get_tags(project_id):
    return jsonify(status='ok',
                   tags=[tag.name for tag in db.query(Tag).filter_by(project_id=project_id)])


@bp.route('/<id>/images/<imagename>', methods=['GET'])
def get_image(id, imagename):
    project = db.query(Project).filter_by(id=id).first()
    imagePath = '{}/{}/{}'.format(
        UPLOAD_FOLDER, get_project_folder(project), imagename
    )
    return send_file(imagePath)


@bp.route('/<project_id>/images/<imagename>', methods=['DELETE'])
def delete_image(project_id, imagename):
    project = db.query(Project).filter_by(id=project_id).first()
    os.remove(os.path.join(UPLOAD_FOLDER, get_project_folder(project), imagename))
    db.query(Image).\
        filter((Image.project_id == project_id) & (Image.name == imagename)).\
        delete()
    db.commit()
    return jsonify(status='ok')


@bp.route('/<id>/images/thumbnail/<imagename>', methods=['GET'])
def get_image_thumbnail(id, imagename):
    project = db.query(Project).filter_by(id=id).first()
    target = '{}/{}'.format(UPLOAD_FOLDER, get_project_folder(project))
    thumbnails_folder = '{}/thumbnails'.format(target)
    thumbnail_path = '{}/{}'.format(thumbnails_folder, imagename)
    return send_file(thumbnail_path)


@bp.route('/<project_id>/image/<imagename>/tags', methods=['POST'])
def update_image_tags(project_id, imagename):
    if not request.is_json:
        return jsonify(status='error')

    new_tags = request.json

    image = db.query(Image).filter((Image.project_id == project_id)
                                   & (Image.name == imagename)).first()

    # Update Tag objects, since each one has a list of the images using it
    Tag.update_tags_references(db, project_id, image, new_tags)

    image.tags = new_tags
    db.commit()
    return jsonify(status='ok')
