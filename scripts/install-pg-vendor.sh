#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
VENDOR="vendor/postgres"
mkdir -p "$VENDOR"
curl -sL "https://registry.npmjs.org/postgres/-/postgres-3.4.5.tgz" | tar xz -C /tmp
rm -rf "$VENDOR"
mv /tmp/package "$VENDOR"
echo "OK — postgres installé dans scripts/$VENDOR"
