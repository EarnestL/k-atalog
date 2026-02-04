#!/usr/bin/env bash
# Run the API so it's reachable from the browser (e.g. when using WSL).
# Use: ./run.sh   or: python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
cd "$(dirname "$0")"
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
