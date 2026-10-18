@echo off
cd /d "%~dp0"
node scripts\start-clarify.cjs
if errorlevel 1 pause
