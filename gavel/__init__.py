# Copyright (c) 2015-2018 Anish Athalye (me@anishathalye.com)
#
# This software is released under AGPLv3. See the included LICENSE.txt for
# details.

import os

from flask import Flask
from flask_compress import Compress
from flask_minify import minify
from flask_socketio import SocketIO
from flask_json import FlaskJSON
import eventlet
eventlet.monkey_patch(os=True, select=True, socket=True, thread=True, time=True, psycopg=True)

BASE_DIR = os.path.dirname(__file__)

COMPRESS_MIMETYPES = [
  'text/html',
  'text/css',
  'text/xml',
  'application/json',
  'application/javascript'
]
COMPRESS_LEVEL = 6
COMPRESS_MIN_SIZE = 500

compress = Compress()

JSON = FlaskJSON()


def start_app():
  gavel = Flask(__name__)
  
  JSON.init_app(gavel)

  compress.init_app(gavel)

  minify(app=gavel)

  gavel.url_map.strict_slashes = False

  return gavel


app = start_app()

app.config['DEBUG'] = os.environ.get('DEBUG', False)

import gavel.settings as settings

app.config['SQLALCHEMY_DATABASE_URI'] = settings.DB_URI
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = settings.SECRET_KEY

from flask_assets import Environment, Bundle

assets = Environment(app)
assets.config['pyscss_style'] = 'expanded'
assets.url = app.static_url_path

bundles = {
  'scss_all': Bundle(
    'generated.scss',
    depends='**/*.scss',
    filters=('libsass',),
    output='all.css'
  ),
  'admin_js': Bundle(
    'js/admin/admin_live.js',
    'js/admin/admin_service.js',
    depends='**/*.js',
    filters=('rjsmin',),
    output='admin_all.js'
  )
}

assets.register(bundles)

@app.context_processor
def inject_context():
    return dict(
      virtual=settings.VIRTUAL_EVENT,
      finished_button_text=str("Finish Review" if settings.VIRTUAL_EVENT else "Done With Visit"),
      debug_state=settings.DEBUG,
    )

from celery import Celery

app.config['CELERY_BROKER_URL'] = settings.BROKER_URI
celery = Celery(app.name, broker=app.config['CELERY_BROKER_URL'])
celery.conf.update(app.config)

from gavel.models import db, ma

db.app = app
db.init_app(app)
ma.app = app
ma.init_app(app)

SOCKETIO_REDIS_URL = settings.BROKER_URI
async_mode="eventlet"

socketio = SocketIO(app, async_mode=async_mode, message_queue=SOCKETIO_REDIS_URL, async_handlers=True)

import gavel.template_filters  # registers template filters

import gavel.controllers  # registers controllers

# send usage stats
import gavel.utils

gavel.utils.send_telemetry('gavel-boot', {
  'base-url': settings.BASE_URL or '',
  'min-views': settings.MIN_VIEWS,
  'timeout': settings.TIMEOUT,
  'disable-email': settings.DISABLE_EMAIL
})