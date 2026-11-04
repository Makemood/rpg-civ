"""Local-only launcher, Python 3. No external dependencies."""
from functools import partial
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
import webbrowser
import sys

root = Path(__file__).resolve().parent
handler = partial(SimpleHTTPRequestHandler, directory=str(root))
with ThreadingHTTPServer(('127.0.0.1', 4173), handler) as server:
    print('River запущен. Для остановки нажмите Ctrl+C.')
    if '--no-browser' not in sys.argv:
        webbrowser.open('http://127.0.0.1:4173')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
