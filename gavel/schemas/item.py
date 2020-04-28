from gavel.models import ma

from gavel.models import Item


class ItemSchema(ma.ModelSchema):
    class Meta:
        model = Item

