@echo off
setlocal
REM ============================================================
REM  LeafScan AI - let your phone reach the dev servers on this PC
REM
REM    8081  Metro / Expo bundler        (already allowed)
REM    4000  LeafScan backend API        <-- currently BLOCKED
REM
REM  Windows Firewall blocks inbound LAN connections by default,
REM  so the phone shows "Network request failed" / "Cannot reach
REM  the server" even though the backend is running fine.
REM
REM  HOW TO USE: just double-click this file, then click "Yes" on
REM  the User Account Control prompt. That's it.
REM
REM  To undo later:  run it from a terminal with  --remove
REM ============================================================

set "ELEV="
if not "%~1"=="" set "ELEV=-ArgumentList '%*'"

REM --- self-elevate if we are not already running as Administrator ---
net session >nul 2>&1
if %errorlevel% neq 0 (
  echo Requesting administrator access...
  powershell -NoProfile -Command "Start-Process -FilePath '%~f0' %ELEV% -Verb RunAs"
  exit /b
)

if /i "%~1"=="--remove" goto remove
if /i "%~1"=="-remove"  goto remove
if /i "%~1"=="/remove"  goto remove

echo Adding firewall rules...
call :ensure "LeafScan Backend 4000" 4000
call :ensure "LeafScan Metro 8081" 8081
echo.
echo Done. Now on the phone:
echo   1. Make sure it is on the SAME Wi-Fi as this PC (not mobile data / guest).
echo   2. Fully close and reopen the app (or shake -^> Reload).
echo   3. Log out and log back in - this clears the offline "demo" session
echo      so uploads are sent with a real login token.
echo.
echo   Test from the phone's browser (use this PC's Wi-Fi IP):
echo     http://192.168.68.146:4000/api/health
echo.
pause
exit /b

:ensure
netsh advfirewall firewall show rule name=%1 >nul 2>&1
if %errorlevel% neq 0 (
  netsh advfirewall firewall add rule name=%1 dir=in action=allow protocol=TCP localport=%2 profile=any >nul
  echo   Added: %~1  ^(TCP %2^)
) else (
  echo   Already present: %~1
)
exit /b

:remove
echo Removing firewall rules...
netsh advfirewall firewall delete rule name="LeafScan Backend 4000" >nul 2>&1 && echo   Removed: LeafScan Backend 4000 || echo   Not present: LeafScan Backend 4000
netsh advfirewall firewall delete rule name="LeafScan Metro 8081" >nul 2>&1 && echo   Removed: LeafScan Metro 8081 || echo   Not present: LeafScan Metro 8081
echo.
pause
exit /b
