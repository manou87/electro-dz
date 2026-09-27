#!/usr/bin/env python3
"""Serve le site (cwd = website) avec Cache-Control: no-store.

`python3 -m http.server` laisse le navigateur garder oibt-trainer/main.dart.js :
après un rebuild Flutter, le nouveau layout (DÉFAUTS / CEE / 62 %) semble
« absent » alors que les fichiers disque sont déjà à jour.

Usage (depuis website/) :
  python3 tools/serve_no_cache.py 8765
"""

from __future__ import annotations

import functools
import http.server
import os
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def main() -> int:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    if not (ROOT / "oibt-trainer" / "main.dart.js").is_file():
        print(f"oibt-trainer/main.dart.js absent sous {ROOT}", file=sys.stderr)
        return 1
    os.chdir(ROOT)
    handler = functools.partial(NoCacheHandler, directory=str(ROOT))
    with http.server.ThreadingHTTPServer(("127.0.0.1", port), handler) as httpd:
        print(f"OK http://127.0.0.1:{port}/swissdz-panel/index.html (no-store)")
        print(f"   Fluke embed http://127.0.0.1:{port}/oibt-trainer/meter-embed.html?embed=1#/meter")
        httpd.serve_forever()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
