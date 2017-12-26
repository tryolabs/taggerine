from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session

from . import settings


engine = create_engine(
    settings.SQLALCHEMY_DATABASE_URI,
    pool_size=50,
    max_overflow=100
)

Base = declarative_base()


class Project(Base):

    __tablename__ = 'projects'

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(String, nullable=False)

    def __repr__(self):
        return f'<Project({self.id}, {self.name})>'


# TODO: Should be done in alembic.
# Create the schema if it doesn't already.
Base.metadata.create_all(engine)

session_factory = sessionmaker(bind=engine)
db = scoped_session(session_factory)
