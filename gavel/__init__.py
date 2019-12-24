# Copyright (c) 2015-2018 Anish Athalye (me@anishathalye.com)
#
# This software is released under AGPLv3. See the included LICENSE.txt for
# details.

import os

from flask import Flask
from flask_compress import Compress
from flask_minify import minify
from flask_socketio import SocketIO

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


def start_app():
  gavel = Flask(__name__)
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
    'css/style.scss',
    depends='**/*.scss',
    filters=('pyscss','cssmin',),
    output='all.css'
  ),
  'admin_js': Bundle(
    'js/admin/jquery.tablesorter.min.js',
    'js/admin/jquery.tablesorter.widgets.js',
    'js/admin/admin_live.js',
    'js/admin/tabulator.js',
    depends='**/*.js',
    filters=('jsmin',),
    output='admin_all.js'
  )
}

assets.register(bundles)

from celery import Celery

app.config['CELERY_BROKER_URL'] = settings.BROKER_URI
celery = Celery(app.name, broker=app.config['CELERY_BROKER_URL'])
celery.conf.update(app.config)

from gavel.models import db, ma

db.app = app
db.init_app(app)
ma.app = app
ma.init_app(app)

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

import gavel.socketio

gavel.socketio.init_app(app)
socketio = gavel.socketio.getBus()