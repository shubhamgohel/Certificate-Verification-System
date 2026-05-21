@echo off
rem Wrapper to run the PowerShell script that serves and opens the HTML file
powershell -ExecutionPolicy Bypass -File "%~dp0scripts\run_server_open_chrome.ps1" "%~1" %2
