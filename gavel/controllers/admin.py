from gavel import app
from gavel import socketio
from gavel.models import *
from gavel.constants import *
from functools import wraps
import gavel.settings as settings
import gavel.utils as utils
from flask import (
  redirect,
  render_template,
  request,
  url_for,
  json)

socket = socketio
from sqlalchemy import event

try:
  import urllib
except ImportError:
  import urllib3
import xlrd

import asyncio

loop = asyncio.new_event_loop()
asyncio.set_event_loop(loop)

def async_action(f):
  @wraps(f)
  def wrapped(*args, **kwargs):
    return loop.run_until_complete(f(*args, **kwargs))
  return wrapped


ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}


@app.route('/legacy/')
@utils.requires_auth
def admin_legacy():
  annotators = Annotator.query.order_by(Annotator.id).all()
  items = Item.query.order_by(Item.id).all()
  flags = Flag.query.order_by(Flag.id).all()
  decisions = Decision.query.all()
  counts = {}
  item_counts = {}
  for d in decisions:
    a = d.annotator_id
    w = d.winner_id
    l = d.loser_id
    counts[a] = counts.get(a, 0) + 1
    item_counts[w] = item_counts.get(w, 0) + 1
    item_counts[l] = item_counts.get(l, 0) + 1
  viewed = {i.id: {a.id for a in i.viewed} for i in items}
  skipped = {}
  for a in annotators:
    for i in a.ignore:
      if a.id not in viewed[i.id]:
        skipped[i.id] = skipped.get(i.id, 0) + 1
  # settings
  setting_closed = Setting.value_of(SETTING_CLOSED) == SETTING_TRUE
  setting_stop_queue = Setting.value_of(SETTING_STOP_QUEUE) == SETTING_TRUE
  return render_template(
    'admin_legacy.html',
    annotators=annotators,
    counts=counts,
    item_counts=item_counts,
    item_count=len(items),
    skipped=skipped,
    items=items,
    votes=len(decisions),
    setting_closed=setting_closed,
    setting_stop_queue=setting_stop_queue,
    flags=flags,
    flag_count=len(flags)
  )


@app.route('/admin/')
@utils.requires_auth
def admin():
  annotators = Annotator.query.order_by(Annotator.id).all()
  items = Item.query.order_by(Item.id).all()
  flags = Flag.query.order_by(Flag.id).all()
  decisions = Decision.query.all()
  counts = {}
  item_counts = {}
  for d in decisions:
    a = d.annotator_id
    w = d.winner_id
    l = d.loser_id
    counts[a] = counts.get(a, 0) + 1
    item_counts[w] = item_counts.get(w, 0) + 1
    item_counts[l] = item_counts.get(l, 0) + 1
  viewed = {i.id: {a.id for a in i.viewed} for i in items}
  skipped = {}
  for a in annotators:
    for i in a.ignore:
      if a.id not in viewed[i.id]:
        skipped[i.id] = skipped.get(i.id, 0) + 1
  # settings
  setting_closed = Setting.value_of(SETTING_CLOSED) == SETTING_TRUE
  setting_stop_queue = Setting.value_of(SETTING_STOP_QUEUE) == SETTING_TRUE
  return render_template(
    'admin.html',
    annotators=annotators,
    counts=counts,
    item_counts=item_counts,
    item_count=len(items),
    skipped=skipped,
    items=items,
    votes=len(decisions),
    setting_closed=setting_closed,
    setting_stop_queue=setting_stop_queue,
    flags=flags,
    flag_count=len(flags)
  )


@app.route('/admin/items')
@utils.requires_auth
def admin_items():
  items = Item.query.order_by(Item.id).all()
  annotators = Annotator.query.order_by(Annotator.id).all()
  decisions = Decision.query.all()

  viewed = {}
  for i in items:
    viewed_holder = []
    for a in i.viewed:
      viewed_holder.append(a.id)
    viewed[i.id] = viewed_holder

  skipped = {}
  for a in annotators:
    for i in a.ignore:
      if a.id not in viewed[i.id]:
        skipped[i.id] = skipped.get(i.id, 0) + 1

  item_count = len(items)

  item_counts = {}

  for d in decisions:
    a = d.annotator_id
    w = d.winner_id
    l = d.loser_id
    item_counts[w] = item_counts.get(w, 0) + 1
    item_counts[l] = item_counts.get(l, 0) + 1

  items_dumped = []

  for it in items:
    try:
      item_dumped = it.to_dict()
      item_dumped.update({
        'viewed': len(viewed.get(it.id, 0)),
        'votes': item_counts.get(it.id, 0),
        'skipped': skipped.get(it.id, 0)
      })
      items_dumped.append(item_dumped)
    except:
      items_dumped.append({'null': 'null'})

  dump_data = {
    "items": items_dumped,
    "item_count": item_count
  }

  response = app.response_class(
    response=json.dumps(dump_data),
    status=200,
    mimetype='application/json'
  )

  return response


@app.route('/admin/flags')
@utils.requires_auth
def admin_flags():
  flags = Flag.query.order_by(Flag.id).all()
  flag_count = len(flags)

  flags_dumped = []

  for fl in flags:
    flag_dumped = fl.to_dict()
    flag_dumped.update({
      'item_name': fl.item.name,
      'item_location': fl.item.location,
      'annotator_name': fl.annotator.name
      })
    flags_dumped.append(flag_dumped)

  dump_data = {
    "flags": flags_dumped,
    "flag_count": flag_count
  }

  response = app.response_class(
    response=json.dumps(dump_data),
    status=200,
    mimetype='application/json'
  )

  return response


@app.route('/admin/annotators')
@utils.requires_auth
def admin_annotators():
  annotators = Annotator.query.order_by(Annotator.id).all()
  decisions = Decision.query.all()
  annotator_count = len(annotators)

  counts = {}

  for d in decisions:
    a = d.annotator_id
    w = d.winner_id
    l = d.loser_id
    counts[a] = counts.get(a, 0) + 1

  annotators_dumped = []
  
  for an in annotators:
    try:
      annotator_dumped = an.to_dict()
      annotator_dumped.update({
        'votes': counts.get(an.id, 0)
      })
      annotators_dumped.append(annotator_dumped)
    except:
      annotators_dumped.append({'null': 'null'})
  dump_data = {
    "annotators": annotators_dumped,
    "anotator_count": annotator_count
  }

  response = app.response_class(
    response=json.dumps(dump_data),
    status=200,
    mimetype='application/json'
  )

  return response


@app.route('/admin/auxiliary')
@utils.requires_auth
def admin_live():
  annotators = Annotator.query.order_by(Annotator.id).all()
  items = Item.query.order_by(Item.id).all()
  flags = Flag.query.order_by(Flag.id).all()
  decisions = Decision.query.all()

  # settings
  setting_closed = Setting.value_of(SETTING_CLOSED) == SETTING_TRUE
  setting_stop_queue = Setting.value_of(SETTING_STOP_QUEUE) == SETTING_TRUE

  item_count = len(items)
  votes = len(decisions)
  flag_count = len(flags)

  # Calculate average sigma
  holder = 0.0
  for it in items:
    holder += it.sigma_sq
  try:
    average_sigma = holder / len(items)
  except:
    average_sigma = 0.0

  # Calculate average seen
  holder = 0
  for an in annotators:
    seen = Item.query.filter(Item.viewed.contains(an)).all()
    holder += len(seen)
  try:
    average_seen = holder / len(annotators)
  except:
    average_seen = 0

  dump_data = {
    "votes": votes,
    "setting_closed": setting_closed,
    "setting_stop_queue": setting_stop_queue,
    "flag_count": flag_count,
    "item_count": item_count,
    "average_sigma": average_sigma,
    "average_seen": average_seen
  }

  response = app.response_class(
    response=json.dumps(dump_data),
    status=200,
    mimetype='application/json'
  )

  return response


@app.route('/admin/item', methods=['POST'])
@utils.requires_auth
def item():
  action = request.form['action']
  if action == 'Submit':
    data = parse_upload_form()
    if data:
      # validate data
      for index, row in enumerate(data):
        if len(row) != 3:
          return utils.user_error('Bad data: row %d has %d elements (expecting 3)' % (index + 1, len(row)))
      def tx():
        for row in data:
          _item = Item(*row)
          db.session.add(_item)
        db.session.commit()
      with_retries(tx)
  elif action == 'Prioritize' or action == 'Cancel':
    item_id = request.form['item_id']
    target_state = action == 'Prioritize'
    def tx():
      Item.by_id(item_id).prioritized = target_state
      db.session.commit()
    with_retries(tx)
  elif action == 'Disable' or action == 'Enable':
    item_id = request.form['item_id']
    target_state = action == 'Enable'
    def tx():
      Item.by_id(item_id).active = target_state
      db.session.commit()
    with_retries(tx)
  elif action == 'Delete':
    item_id = request.form['item_id']
    try:
      def tx():
        db.session.execute(ignore_table.delete(ignore_table.c.item_id == item_id))
        Item.query.filter_by(id=item_id).delete()
        db.session.commit()
      with_retries(tx)
    except IntegrityError as e:
      return utils.server_error(str(e))
  elif action == 'BatchDisable':
    item_ids = request.form.getlist('ids')
    error = []
    for item_id in item_ids:
      try:
        def tx():
          Item.by_id(item_id).active = False
          db.session.commit()
        with_retries(tx)
      except:
        error.append(item_id)
        def tx():
          db.session.rollback()
        with_retries(tx)
  elif action == 'BatchDelete':
    db.Session.autocommit = True
    item_ids = request.form.getlist('ids')
    error = []
    for item_id in item_ids:
      try:
        def tx():
          db.session.execute(ignore_table.delete(ignore_table.c.item_id == item_id))
          Item.query.filter_by(id=item_id).delete()
          db.session.commit()
        with_retries(tx)
      except Exception as e:
        error.append(str(e))
        def tx():
          db.session.rollback()
        with_retries(tx)
        continue
  return redirect(url_for('admin'))


@app.route('/admin/queueshutdown', methods=['POST'])
@utils.requires_auth
def queue_shutdown():
  action = request.form['action']
  annotators = Annotator.query.order_by(Annotator.id).all()
  if action == 'queue':
    for an in annotators:
      if an.active:
        an.stop_next = True
    def tx():
      Setting.set(SETTING_STOP_QUEUE, True)
      db.session.commit()
    with_retries(tx)
  elif action == 'dequeue':
    for an in annotators:
      if an.stop_next:
        an.stop_next = False
    def tx():
      Setting.set(SETTING_STOP_QUEUE, False)
      db.session.commit()
    with_retries(tx)

  return redirect(url_for('admin'))


@app.route('/admin/report', methods=['POST'])
@utils.requires_auth
def flag():
  action = request.form['action']
  if action == 'resolve':
    flag_id = request.form['flag_id']
    target_state = action == 'resolve'
    def tx():
      Flag.by_id(flag_id).resolved = target_state
      db.session.commit()
    with_retries(tx)
  elif action == 'open':
    flag_id = request.form['flag_id']
    target_state = 1 == 2
    def tx():
      Flag.by_id(flag_id).resolved = target_state
      db.session.commit()
    with_retries(tx)
  return redirect(url_for('admin'))


def allowed_file(filename):
  return '.' in filename and \
         filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def parse_upload_form():
  f = request.files.get('file')
  data = []
  if f and allowed_file(f.filename):
    extension = str(f.filename.rsplit('.', 1)[1].lower())
    if extension == "xlsx" or extension == "xls":
      workbook = xlrd.open_workbook(file_contents=f.read())
      worksheet = workbook.sheet_by_index(0)
      data = list(utils.cast_row(worksheet.row_values(rx, 0, 3)) for rx in range(worksheet.nrows) if
                  worksheet.row_len(rx) == 3)
    elif extension == "csv":
      data = utils.data_from_csv_string(f.read().decode("utf-8"))
  else:
    csv = request.form['data']
    data = utils.data_from_csv_string(csv)
  return data


@app.route('/admin/item_patch', methods=['POST'])
@utils.requires_auth
def item_patch():
  def tx():
    item = Item.by_id(request.form['item_id'])
    if not item:
      return utils.user_error('Item %s not found ' % request.form['item_id'])
    if 'location' in request.form:
      item.location = request.form['location']
    if 'name' in request.form:
      item.name = request.form['name']
    if 'description' in request.form:
      item.description = request.form['description']
    db.session.commit()
  with_retries(tx)
  return redirect(url_for('item_detail', item_id=item.id))


@app.route('/admin/annotator_patch', methods=['POST'])
@utils.requires_auth
def annotator_patch():
  def tx():
    annotator = Annotator.by_id(request.form['annotator_id'])
    if not item:
      return utils.user_error('Annotator %s not found ' % request.form['annotator_id'])
    if 'name' in request.form:
      annotator.name = request.form['name']
    if 'email' in request.form:
      annotator.email = request.form['email']
    if 'description' in request.form:
      annotator.description = request.form['description']
    db.session.commit()
  with_retries(tx)
  return redirect(url_for('annotator_detail', annotator_id=annotator.id))


@app.route('/admin/annotator', methods=['POST'])
@utils.requires_auth
def annotator():
  action = request.form['action']
  if action == 'Submit':
    data = parse_upload_form()
    added = []
    if data:
      # validate data
      for index, row in enumerate(data):
        if len(row) != 3:
          return utils.user_error('Bad data: row %d has %d elements (expecting 3)' % (index + 1, len(row)))
      def tx():
        for row in data:
          annotator = Annotator(*row)
          added.append(annotator)
          db.session.add(annotator)
        db.session.commit()
      with_retries(tx)
      try:
        email_invite_links(added)
      except Exception as e:
        return utils.server_error(str(e))
  elif action == 'Email':
    annotator_id = request.form['annotator_id']
    try:
      email_invite_links(Annotator.by_id(annotator_id))
    except Exception as e:
      return utils.server_error(str(e))
  elif action == 'Disable' or action == 'Enable':
    annotator_id = request.form['annotator_id']
    target_state = action == 'Enable'
    def tx():
      Annotator.by_id(annotator_id).active = target_state
      db.session.commit()
    with_retries(tx)
  elif action == 'Delete':
    annotator_id = request.form['annotator_id']
    try:
      def tx():
        db.session.execute(ignore_table.delete(ignore_table.c.annotator_id == annotator_id))
        Annotator.query.filter_by(id=annotator_id).delete()
        db.session.commit()
      with_retries(tx)
    except IntegrityError as e:
      return utils.server_error(str(e))
  elif action == 'BatchDisable':
    annotator_ids = request.form.getlist('ids')
    errored = []
    for annotator_id in annotator_ids:
      try:
        def tx():
          Annotator.by_id(annotator_id).active = False
          db.session.commit()
        with_retries(tx)
      except:
        def tx():
          db.session.rollback()
        with_retries(tx)
        errored.append(annotator_id)
        continue
  elif action == 'BatchDelete':
    annotator_ids = request.form.getlist('ids')
    errored = []
    for annotator_id in annotator_ids:
      try:
        def tx():
          db.session.execute(ignore_table.delete(ignore_table.c.annotator_id == annotator_id))
          Annotator.query.filter_by(id=annotator_id).delete()
          db.session.commit()
        with_retries(tx)
      except:
        def tx():
          db.session.rollback()
        with_retries(tx)
        errored.append(annotator_id)
        continue
  return redirect(url_for('admin'))


@app.route('/admin/setting', methods=['POST'])
@utils.requires_auth
def setting():
  key = request.form['key']
  if key == 'closed':
    action = request.form['action']
    new_value = SETTING_TRUE if action == 'Close' else SETTING_FALSE
    Setting.set(SETTING_CLOSED, new_value)
    db.session.commit()
  return redirect(url_for('admin'))


@app.route('/admin/item/<item_id>/')
@utils.requires_auth
def item_detail(item_id):
  item = Item.by_id(item_id)
  if not item:
    return utils.user_error('Item %s not found ' % item_id)
  else:
    assigned = Annotator.query.filter(Annotator.next == item).all()
    viewed_ids = {i.id for i in item.viewed}
    if viewed_ids:
      skipped = Annotator.query.filter(
        Annotator.ignore.contains(item) & ~Annotator.id.in_(viewed_ids)
      )
    else:
      skipped = Annotator.query.filter(Annotator.ignore.contains(item))
    return render_template(
      'admin_item.html',
      item=item,
      assigned=assigned,
      skipped=skipped
    )


@app.route('/admin/annotator/<annotator_id>/')
@utils.requires_auth
def annotator_detail(annotator_id):
  annotator = Annotator.by_id(annotator_id)
  if not annotator:
    return utils.user_error('Annotator %s not found ' % annotator_id)
  else:
    seen = Item.query.filter(Item.viewed.contains(annotator)).all()
    ignored_ids = {i.id for i in annotator.ignore}
    if ignored_ids:
      skipped = Item.query.filter(
        Item.id.in_(ignored_ids) & ~Item.viewed.contains(annotator)
      )
    else:
      skipped = []
    return render_template(
      'admin_annotator.html',
      annotator=annotator,
      login_link=annotator_link(annotator),
      seen=seen,
      skipped=skipped
    )


def annotator_link(annotator):
  return urllib.parse.urljoin(settings.BASE_URL, url_for('login', secret=annotator.secret))

@async_action
async def email_invite_links(annotators):
  if settings.DISABLE_EMAIL or annotators is None:
    return
  if not isinstance(annotators, list):
    annotators = [annotators]

  emails = []
  for annotator in annotators:
    link = annotator_link(annotator)
    raw_body = settings.EMAIL_BODY.format(name=annotator.name, link=link)
    body = '\n\n'.join(utils.get_paragraphs(raw_body))
    emails.append((annotator.email, settings.EMAIL_SUBJECT, body))

  utils.send_emails.apply_async(args=[emails])
