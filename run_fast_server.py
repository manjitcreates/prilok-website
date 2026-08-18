import http.server, socketserver, os, functools

PORT = 8080
DIRECTORY = r"c:\prilok website assets\PRILOK_WEBSITE_PACKAGE\godaddy"

Handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=DIRECTORY)

class FastServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True

with FastServer(('0.0.0.0', PORT), Handler) as httpd:
    print(f"Serving {DIRECTORY} on port {PORT}...")
    httpd.serve_forever()
