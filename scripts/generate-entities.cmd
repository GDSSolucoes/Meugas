@echo off
REM Entity Generator Batch Script for Windows
REM Auto-discovers entities from backend and generates missing ones

setlocal enabledelayedexpansion

REM Parse arguments
if "%1"=="--help" goto show_help
if "%1"=="-h" goto show_help

REM If specific entity provided, generate only that
if not "%1"=="" (
  if "%1"=="--status" (
    node "%~dp0discover-and-generate.js" --status
    exit /b 0
  )
  if "%1"=="--generate" (
    node "%~dp0discover-and-generate.js" --generate
    exit /b !errorlevel!
  )
  echo Generating entity: %1
  node "%~dp0generate-entity.js" %1
  exit /b !errorlevel!
)

REM Default: Show status and list available actions
node "%~dp0discover-and-generate.js" --status
exit /b 0

:show_help
echo Entity Generator Batch Script (Windows)
echo.
echo Usage:
echo   generate-entities.cmd              Show status of entity generation
echo   generate-entities.cmd --status     Show detailed generation status
echo   generate-entities.cmd --generate   Auto-generate all missing entities
echo   generate-entities.cmd ^<Entity^>    Generate a specific entity
echo   generate-entities.cmd --help       Show this help message
echo.
echo Examples:
echo   generate-entities.cmd                    (check what's missing)
echo   generate-entities.cmd --generate         (generate all missing)
echo   generate-entities.cmd Product            (generate just Product)
echo.
goto end

:end
endlocal