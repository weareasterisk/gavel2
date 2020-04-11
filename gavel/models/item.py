from gavel.models import db
import gavel.crowd_bt as crowd_bt
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy.orm import validates
from datetime import datetime
import gavel.settings as settings

from gavel.models._basemodel import BaseModel

view_table = db.Table('view',
                      db.Column('item_id', db.Integer, db.ForeignKey('item.id')),
                      db.Column('annotator_id', db.Integer, db.ForeignKey('annotator.id'))
                      )


class Item(BaseModel):
    id = db.Column(db.Integer, primary_key=True, nullable=False)
    name = db.Column(db.Text, nullable=False)
    location = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text, nullable=False)

    # Optional Video Reference (implicitly "required" in "virtual mode")
    video_reference = db.Column(db.Text, nullable=True)
    # Optional Submission Reference (implicitly "required" in "virtual mode")
    submission_reference = db.Column(db.Text, nullable=True)
    # Optional Tagline (implicitly "required" in "virtual mode")
    tagline = db.Column(db.Text, nullable=True)
    # Optional Submission Website Reference (implicitly "required" in "virtual mode")
    submission_website = db.Column(db.Text, nullable=True)

    active = db.Column(db.Boolean, default=True, nullable=False)
    viewed = db.relationship('Annotator', secondary=view_table)
    prioritized = db.Column(db.Boolean, default=False, nullable=False)
    flags = db.relationship('Flag', back_populates="item")
    updated = db.Column(db.DateTime, onupdate=datetime.utcnow)

    mu = db.Column(db.Float)
    sigma_sq = db.Column(db.Float)

    _default_fields = [
        "name",
        "location",
        "description",
        "video_reference",
        "submission_reference",
        "submission_website",
        "tagline",
        "active",
        "seen",
        "prioritized",
        "mu",
        "sigma_sq",
        "updated"
    ]

    relations_keys = ("viewed", "flags")

    def __init__(self, name, location, description, tagline="", video_reference="", submission_reference="", submission_website=""):
        self.name = name
        self.location = location
        self.description = description
        self.video_reference = video_reference
        self.submission_reference = submission_reference
        self.mu = crowd_bt.MU_PRIOR
        self.sigma_sq = crowd_bt.SIGMA_SQ_PRIOR

    @validates('tagline')
    def require_tagline_on_virtual(self, key, tagline):
        if settings.VIRTUAL_EVENT:
            assert tagline
    
    @validates('video_reference')
    def require_video_reference_on_virtual(self, key, video_reference):
        if settings.VIRTUAL_EVENT:
            assert video_reference
    
    @validates('submission_reference')
    def require_submission_reference_on_virtual(self, key, submission_reference):
        if settings.VIRTUAL_EVENT:
            assert submission_reference
    
    @validates('submission_website')
    def require_submission_website_on_virtual(self, key, submission_website):
        if settings.VIRTUAL_EVENT:
            assert submission_website

    @property
    def seen(self):
        return len(self.viewed)

    @classmethod
    def by_id(cls, uid):
        if uid is None:
            return None
        try:
            item = cls.query.get(uid)
        except NoResultFound:
            item = None
        return item
