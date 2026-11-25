$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$port = 27183
$nodeDir = 'C:\Users\asnll\AppData\Local\NodeJS\node-v26.13.1-win-x64'
$npm = Join-Path $nodeDir 'npm.cmd'
$url = "http://127.0.0.1:$port/"

# 1. already running -> just open the browser
$listen = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($listen) {
  Start-Process $url
  exit 0
}

# 2. start detached: closing any terminal will not stop it
Start-Process -FilePath $npm `
  -ArgumentList 'run', 'dev' `
  -WorkingDirectory $root `
  -WindowStyle Hidden `
  -RedirectStandardOutput (Join-Path $root 'dev-server.log') `
  -RedirectStandardError (Join-Path $root 'dev-server.err.log')

# 3. wait for the port, then open the browser
for ($i = 0; $i -lt 30; $i++) {
  Start-Sleep -Seconds 1
  if (Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue) {
    Start-Process $url
    exit 0
  }
}

Write-Host 'dev server did not come up. Check dev-server.err.log'
Read-Host 'Press Enter to close'
exit 1
