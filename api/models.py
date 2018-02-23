from sqlalchemy import create_engine, Column, Integer, String, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session, relationship

from . import settings


engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    pool_size=50,
    max_overflow=100
)

Base = declarative_base()


class Project(Base):

    __tablename__ = 'projects'

    id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    name = Column(String, nullable=False, unique=True)
    images = relationship('Image', backref='project')
    settings = Column(JSON, nullable=True)

    def __repr__(self):
        return f'<Project({self.id}, {self.name})>'


class Image(Base):
    __tablename__ = 'images'

    id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    project_id = Column(Integer, ForeignKey('projects.id', ondelete='CASCADE'), nullable=True)
    name = Column(String, nullable=False)
    tags = Column(JSON, nullable=False)

    def __repr__(self):
        return f'<Image({self.id}, {self.name})>'


# Tags are not handled in a relational way, since it's too costly and complex to update and query
class Tag(Base):
    __tablename__ = 'tags'

    id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    project_id = Column(Integer, ForeignKey('projects.id', ondelete='CASCADE'), nullable=True)
    name = Column(String, nullable=False)
    image_ids = Column(JSON, nullable=True)

    @staticmethod
    def update_tags_references(db, project_id, image, new_tags):
        new_tag_names = set(tag['label'] for tag in new_tags)
        old_tag_names = set(tag['label'] for tag in image.tags)

        # Retrieve only tags that will need update (^ operator is union - intersection)
        tags_to_update = new_tag_names ^ old_tag_names
        tags = {tag.name: tag
                for tag in db.query(Tag).filter(
                    (Tag.project_id == project_id)
                    & (Tag.name.in_(tags_to_update)))}

        # Tags added to the image
        for tagname in (new_tag_names - old_tag_names):

            # Existing Tag: add image_id to the list
            if tagname in tags:
                tags[tagname].image_ids.append(image.id)

            # Create new Tag with this image_id as first reference
            else:
                db.add(Tag(project_id=project_id, name=tagname, image_ids=[image.id]))

        # Tags removed from the image
        for tagname in (old_tag_names - new_tag_names):

            # Defensive: requests that update Tag references may have failed previously
            if tagname not in tags or image.id not in tags[tagname].image_ids:
                continue

            # Remove image_id from this Tag's list
            tags[tagname].image_ids.remove(image.id)

            # If no further images are using this Tag, remove it
            if(not len(tags[tagname].image_ids)):
                db.delete(tags[tagname])


# TODO: Should be done in alembic.
# Create the schema if it doesn't already.
Base.metadata.create_all(engine)


session_factory = sessionmaker(bind=engine)
db = scoped_session(session_factory)
