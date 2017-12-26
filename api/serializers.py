from marshmallow import Schema
from marshmallow.fields import Integer, String


class ProjectSchema(Schema):
    id = Integer()
    name = String()
