@echo off
powershell -NoProfile -ExecutionPolicy Bypass -Command "npm start 2>&1 | Tee-Object -FilePath 'log.txt'"
pause
