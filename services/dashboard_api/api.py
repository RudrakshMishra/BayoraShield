from __future__ import annotations

import http.server
import json
import os
import socketserver

PORT = int(os.environ.get("PORT", 8000))


class DashboardApiHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path.startswith("/api/health") or self.path.startswith("/health"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status":"healthy","service":"dashboard-api"}\n')
        elif self.path.startswith("/api/ledger/head"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"seq":2,"entry_hash":"0000000000000000000000000000000000000000000000000000000000000000","count":2,"anchored_at":null}\n')
        elif self.path.startswith("/api/ledger/entries"):
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            entries = [
                {"seq": 1, "ts": "2026-10-28T00:00:00Z", "cell": "broker", "action": "bootstrap", "payload_hash": None, "policy_version": "v1.0", "model_hash": None, "prev_hash": "0" * 64, "entry_hash": "1" * 64, "sig": "a" * 128, "meta": {}},
                {"seq": 2, "ts": "2026-10-28T00:01:00Z", "cell": "ledger", "action": "append", "payload_hash": None, "policy_version": "v1.0", "model_hash": None, "prev_hash": "1" * 64, "entry_hash": "2" * 64, "sig": "b" * 128, "meta": {}}
            ]
            self.wfile.write(json.dumps(entries).encode("utf-8") + b"\n")
        elif self.path.startswith("/api/events"):
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Cache-Control", "no-cache")
            self.send_header("Connection", "keep-alive")
            self.end_headers()
            self.wfile.write(b'data: {"id":"ev-1","type":"session_start","cell":"broker","timestamp":"2026-10-28T00:00:00Z","metadata":{}}\n\n')
        else:
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"status":"ok"}\n')

    def do_POST(self):
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        if "auth/login" in self.path:
            self.wfile.write(b'{"user":{"id":"u-admin","username":"admin","role":"admin"},"csrf_token":"mock-csrf-token"}\n')
        elif "ledger/verify" in self.path:
            self.wfile.write(b'{"ok":true,"checked":2,"first_bad_seq":null,"reason":null,"head_hash":"2222222222222222222222222222222222222222222222222222222222222222"}\n')
        else:
            self.wfile.write(b'{"status":"success"}\n')

    def log_message(self, format, *args):
        return


def main():
    with socketserver.TCPServer(("0.0.0.0", PORT), DashboardApiHandler) as httpd:
        httpd.serve_forever()


if __name__ == "__main__":
    main()
