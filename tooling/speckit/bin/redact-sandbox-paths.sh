#!/usr/bin/env bash
# Redacts sandbox paths (op 023, #60). Scaffold: copies stdin to stdout and changes no file.
set -euo pipefail
if [[ "${1:-}" == "--in-place" ]]; then exit 0; fi
cat
