from __future__ import annotations

import http.server
import json
import os
import socketserver
import sys
from pathlib import Path

PORT = int(os.environ.get("PORT", 8001))


class BrokerHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/v1/health":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status":"healthy","service":"broker"}\n')
        elif self.path == "/v1/events":
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self.end_headers()
            self.wfile.write(b'data: {"type":"connected","service":"broker"}\n\n')
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        if self.path == "/v1/infer" or self.path == "/v1/session":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length) if content_length > 0 else b"{}"
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            response = {"status": "allowed", "outcome": "blocked_by_policy", "policy_version": "v1.0"}
            self.wfile.write(json.dumps(response).encode("utf-8") + b"\n")
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        return


def main():
    with socketserver.TCPServer(("0.0.0.0", PORT), BrokerHandler) as httpd:
        httpd.serve_forever()


if __name__ == "__main__":
    main()
