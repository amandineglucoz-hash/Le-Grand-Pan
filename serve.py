#!/usr/bin/env python3
import os, http.server, socketserver

os.chdir("/Users/agenceglucoz/le grand pan")
PORT = 3939
Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map.update({'.svg': 'image/svg+xml', '.woff2': 'font/woff2'})
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    httpd.serve_forever()
