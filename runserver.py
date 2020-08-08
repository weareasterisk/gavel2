# Copyright (c) 2015-2018 Anish Athalye (me@anishathalye.com)
#
# This software is released under AGPLv3. See the included LICENSE.txt for
# details.

if __name__ == '__main__':
    from gavel import socketio
    from gavel.settings import PORT
    import os

    extra_files = []
    if os.environ.get('DEBUG', False):
        socketio.debug = True
        extra_files.append('./config.yaml')

    socketio.jinja_env.cache = {}
    
    socketio.run(
        host='0.0.0.0',
        port=PORT,
        extra_files=extra_files,
        threaded=True
    )
