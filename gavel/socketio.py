from flask_socketio import SocketIO
from gavel import app
import eventlet
eventlet.monkey_patch()
import gavel.settings as settings

async_mode = 'eventlet'

SOCKETIO_REDIS_URL = settings.BROKER_URI

socketio = None

def init_app(app):
  socketio = SocketIO(app, async_mode=async_mode, message_queue=SOCKETIO_REDIS_URL)

def getBus():
  return socketio