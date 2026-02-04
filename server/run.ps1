# Run the API so it's reachable from the browser (e.g. when using WSL).
# Use: .\run.ps1
Set-Location $PSScriptRoot
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
