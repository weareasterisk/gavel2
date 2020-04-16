from gavel.models import ma

from gavel.models import Flag


class FlagSchema(ma.ModelSchema):
    class Meta:
        model = Flag
