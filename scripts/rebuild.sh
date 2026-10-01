#!/usr/bin/env bash
# QA helper: rebuild and restart the production server on :3100
powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3100 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id \$_.OwningProcess -Force -ErrorAction SilentlyContinue }"
npm run build 2>&1 | grep -E "error|Error|Compiled|failed" 
(npx next start -p 3100 > /tmp/next-start.log 2>&1 &)
sleep 5
