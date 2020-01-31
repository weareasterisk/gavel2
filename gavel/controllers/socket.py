from gavel import app
from gavel import socketio
from flask_socketio import emit
from gavel.constants import *
from gavel.models import *
import gavel.settings as settings
import gavel.utils as utils
from sqlalchemy import event
from sqlalchemy import (or_, not_)
from flask import (json)

def standardize(target):
  name = target.__tablename__
  if str(name) == 'annotator':
    return {
      'type': name,
      'target': json.dumps(injectAnnotator(target, target.to_dict()))
    }
  elif str(name) == 'flag':
    return {
      'type': name,
      'target': json.dumps(injectFlag(target, target.to_dict()))
    }
  elif str(name) == 'item':
    return {
      'type': name,
      'target': json.dumps(injectItem(target, target.to_dict()))
    }
  else:
    return {
      'type': name,
      'target': target.to_dict()
    }
def injectAnnotator(target, target_dumped):
  count = Decision.query.filter(Decision.annotator_id == target.id).count()
  target_dumped.update({
    'votes': count
  })

  # Emit DB modify event to update item views affected by annotator modifications
  for i in target.ignore:
    item = Item.query.get(i.id)
    socketio.emit(DB_MODIFY_EVENT, standardize(item), namespace='/admin')

  return target_dumped

def injectFlag(target, target_dumped):
  target_dumped.update({
    'item_name': target.item.name,
    'item_location': target.item.location,
    'annotator_name': target.annotator.name
  })
  return target_dumped

def injectItem(target, target_dumped):
  assigned = Annotator.query.filter(Annotator.next == target).all()
  viewed_ids = {i.id for i in target.viewed}
  if viewed_ids:
    skipped = Annotator.query.filter(
      Annotator.ignore.contains(target) & ~Annotator.id.in_(viewed_ids)
    ).count()
  else:
    skipped = Annotator.query.filter(Annotator.ignore.contains(target)).count()

  viewed = len(target.viewed)

  target_dumped.update({
    'viewed': viewed,
    'votes': Decision.query.filter(or_(Decision.winner_id == target.id, Decision.loser_id == target.id)).distinct(Decision.id).count(),
    'skipped': skipped
  })
  return target_dumped

CONNECT = 'connected'
DB_INSERT_EVENT = 'db.inserted'
DB_MODIFY_EVENT = 'db.modified'

@socketio.on('user.connected', namespace='/admin')
def test_connect(data):
  emit(CONNECT, data, namespace='/admin')

@event.listens_for(Annotator, 'after_insert')
@utils.requires_auth
def annotator_listen_insert(mapper, connection, target):
  socketio.emit(DB_INSERT_EVENT, standardize(target), namespace='/admin')

@event.listens_for(Annotator, 'after_update')
@utils.requires_auth
def annotator_listen_modify(mapper, connection, target):
  socketio.emit(DB_MODIFY_EVENT, standardize(target), namespace='/admin')

@event.listens_for(Item, 'after_insert')
@utils.requires_auth
def item_listen_insert(mapper, connection, target):
  socketio.emit(DB_INSERT_EVENT, standardize(target), namespace='/admin')

@event.listens_for(Item, 'after_update')
@utils.requires_auth
def item_listen_modify(mapper, connection, target):
  socketio.emit(DB_MODIFY_EVENT, standardize(target), namespace='/admin')

@event.listens_for(Flag, 'after_insert')
@utils.requires_auth
def flag_listen_insert(mapper, connection, target):
  socketio.emit(DB_INSERT_EVENT, standardize(target), namespace='/admin')

@event.listens_for(Flag, 'after_update')
@utils.requires_auth
def flag_listen_update(mapper, connection, target):
  socketio.emit(DB_MODIFY_EVENT, standardize(target), namespace='/admin')

@event.listens_for(Setting, 'after_insert')
@utils.requires_auth
def setting_listen_insert(mapper, connection, target):
  socketio.emit(DB_INSERT_EVENT, standardize(target), namespace='/admin')

@event.listens_for(Setting, 'after_update')
@utils.requires_auth
def setting_listen_update(mapper, connection, target):
  socketio.emit(DB_MODIFY_EVENT, standardize(target), namespace='/admin')