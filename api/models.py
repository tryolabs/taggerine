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

    def __repr__(self):
        return f'<Project({self.id}, {self.name})>'


class Image(Base):
    __tablename__ = 'images'

    id = Column(Integer, primary_key=True, autoincrement=True, nullable=False)
    project_id = Column(
        Integer, ForeignKey('projects.id', ondelete='CASCADE'), nullable=True
    )
    name = Column(String, nullable=False)
    tags = Column(JSON, nullable=True)

    def __repr__(self):
        return f'<Image({self.id}, {self.name})>'


# TODO: Should be done in alembic.
# Create the schema if it doesn't already.
Base.metadata.create_all(engine)


session_factory = sessionmaker(bind=engine)
db = scoped_session(session_factory)
