#!/usr/bin/env bash
# One-command launcher per the task spec. Defaults to MODE=wasm.
set -euo pipefail
MODE="${MODE:-wasm}"
export MODE
docker-compose up --build
