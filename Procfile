worker: PYTHONUNBUFFERED=true celery -A gavel:celery worker -E -P eventlet --loglevel=info
web: python initialize.py && gunicorn -k eventlet gavel:app