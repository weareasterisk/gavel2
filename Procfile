worker: PYTHONUNBUFFERED=true celery -A gavel:celery worker -B -E --loglevel=info
web: python initialize.py && gunicorn -k eventlet gavel:app