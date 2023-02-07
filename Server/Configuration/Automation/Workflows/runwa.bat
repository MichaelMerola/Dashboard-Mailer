@echo off
REM ================================================================
REM      Workflow troubleshooting utility
REM
REM Usage: 
REM    - Run this batch file at Configuration/Automation/Workflows 
REM    - It should show stack trace of your workflow if it crashes
REM    Specify the workflow to run, in quotes, as first argument.
REM  
REM     eg. runw.bat "My Workflow"
REM   
REM ================================================================

if [%1] == [] goto usage

rem Get the current working directory
set cwd=%~dp0

setlocal ENABLEDELAYEDEXPANSION

rem !! The following line works only if this bat file is running in /server/Configuration/Automation/workflows
rem  (as this is 43 chars long, and it chops this off the CWD to get the Prognosis install directory)
set prog_home=%cwd:~0,-43%

set NODE_PATH=%prog_home%\Server\Configuration\Automation\Engine;%prog_home%\nodejs\node_modules

call "%prog_home%\nodejs\node.exe" ../engine/runwafonce.js %1 %2 %3 %4 %5 %6

goto end

:usage

ECHO _ MISSING ARGUMENT!
ECHO Specify the workflow to run, in quotes, as first argument.
ECHO eg. runw.bat "My Workflow"
ECHO _


:end