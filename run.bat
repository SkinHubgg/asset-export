@echo off
setlocal EnableExtensions DisableDelayedExpansion
::=============================================================================================
:: run.bat - the Windows entry point for the CS2 asset exporter.
::
:: Double-click it, or call it from a console with the same flags export.ts takes:
::
::     run.bat
::     run.bat --discover
::     run.bat --only models,weapontex
::     run.bat --incremental
::     run.bat --cs2 "D:\Steam Library\steamapps\common\Counter-Strike Global Offensive"
::
:: It relaunches itself through UAC, then runs `bun run export.ts` with whatever it was given.
:: NOTHING IN THIS FILE HAS BEEN RUN ON WINDOWS - it was written and reviewed on macOS. Treat the
:: first run as the test: `run.bat --no-admin --discover` extracts nothing and is safe.
::
:: ---------------------------------------------------------------------------------------------
:: WHY THIS ASKS FOR ADMINISTRATOR. Do not "simplify" the elevation away.
:: ---------------------------------------------------------------------------------------------
::
:: --incremental turns on the decompiler's own --vpk_cache, and the decompiler writes that cache
:: manifest as "<archive>.manifest.txt" NEXT TO THE VPK IT READ - i.e. INSIDE THE CS2 INSTALL,
:: under C:\Program Files (x86)\Steam\steamapps\common\... by default. That path is hardcoded in
:: the decompiler; there is no flag to move it, and Program Files is not user-writable. export.ts
:: probes the directory up front and refuses with a clear message rather than dying mid-export, so
:: without elevation --incremental simply cannot run on a default Windows install.
::
:: WHAT DOES *NOT* NEED ADMIN, because a tool that demands it needlessly teaches people to click
:: through UAC prompts without reading them: everything else. --discover, --list, --manifest-only,
:: --sample and a full export all write only into this folder (out\ and .tools\). And if CS2 lives
:: on another drive - D:\SteamLibrary is the common case - even --incremental needs nothing.
::
:: So elevation is the DEFAULT, because it is the one setting under which every flag works on a
:: stock install and one UAC prompt beats a confusing refusal three commands later - but it is
:: NOT mandatory:
::
:: >>> run.bat --no-admin     runs without elevating. Correct whenever CS2 is not under
:: >>>                        Program Files, or when you are not using --incremental.
::
:: ---------------------------------------------------------------------------------------------
:: HOW THE RELAUNCH PASSES ARGUMENTS, which is the part these scripts normally get wrong.
:: ---------------------------------------------------------------------------------------------
::
:: An elevated relaunch crosses a batch -> PowerShell -> cmd boundary, and each layer eats a
:: different set of quotes. `--cs2 "C:\Program Files (x86)\..."` is exactly the input that breaks
:: the usual `-ArgumentList '%*'` one-liner, and "Program Files" guarantees such paths exist.
::
:: So NO USER ARGUMENT EVER GOES ON THE RELAUNCH COMMAND LINE. The arguments are written to a
:: sibling file, and the elevated copy - which has to cd to this script's folder anyway - reads
:: them back. The only things passed through UAC are the literal word __elevated and a numeric
:: tag, so there is nothing left for a quote to break. The tag keeps two concurrent runs apart.
::
:: __elevated IS ALSO THE LOOP BREAKER. The elevated copy sees it and jumps straight past the
:: elevation check, so even if the "am I admin?" probe were to answer wrongly on some machine,
:: this can prompt at most once. An unbounded chain of UAC dialogs is not a failure mode anyone
:: should be able to trigger.
::
:: The other classics, each handled below: an elevated shell starts in C:\Windows\system32, so it
:: MUST cd to %~dp0 before doing anything; a declined UAC prompt is a normal outcome and gets a
:: readable message; the exit code is propagated at every hop instead of being swallowed; and the
:: window stays open on failure, because a console that flashes and vanishes takes the error
:: message with it.
::=============================================================================================

:: ---- scan our own flags, and rebuild the rest for export.ts ---------------------------------
:: Each argument is re-quoted as "%~1", which is what makes a path with spaces survive. run.bat's
:: own flags are REMOVED rather than forwarded, and that is not tidiness: export.ts treats "any
:: argument at all" as "the caller knows what it wants" and skips its interactive picker, so a
:: forwarded --no-admin would silently turn a double-click into a full export that wipes out\.
set "ELEVTAG="
set "NOADMIN="
set "NOPAUSE="
set "ARGS="

:scan
if "%~1"=="" goto :scanned
if /i "%~1"=="__elevated" goto :scan_elev
if /i "%~1"=="--no-admin" goto :scan_noadmin
if /i "%~1"=="--no-pause" goto :scan_nopause
:: The `set "NAME=..."` form is what protects an argument containing & or ^ from cmd's parser.
set "ARGS=%ARGS% "%~1""
shift
goto :scan
:scan_elev
set "ELEVTAG=%~2"
shift
shift
goto :scan
:scan_noadmin
set "NOADMIN=1"
shift
goto :scan
:scan_nopause
set "NOPAUSE=1"
shift
goto :scan
:scanned

:: The env-var form of the two flags, for a scheduled task that cannot easily pass arguments.
if defined CS2_EXPORT_NO_ADMIN set "NOADMIN=1"
if defined CS2_EXPORT_NO_PAUSE set "NOPAUSE=1"

:: ---- always work from this script's folder --------------------------------------------------
:: An elevated process starts in %SystemRoot%\system32, so without this the exporter would be
:: looked for there. pushd rather than `cd /d` because pushd also maps a UNC path to a temporary
:: drive letter, and elevated cmd cannot cd into a \\server\share at all.
pushd "%~dp0" 2>nul
if errorlevel 1 (
  echo [run.bat] Could not enter "%~dp0".
  exit /b 1
)

:: ---- elevated pass: recover the arguments from the sibling file -----------------------------
if not defined ELEVTAG goto :maybe_elevate
set "ARGSFILE=%~dp0.run-args-%ELEVTAG%.tmp"
if not exist "%ARGSFILE%" goto :have_args
:: set /p reads the line verbatim, quotes included. Whether it keeps the leading space differs by
:: Windows build, so the invocation below supplies its own separator and tolerates both.
set /p ARGS=<"%ARGSFILE%"
del /f /q "%ARGSFILE%" 2>nul
goto :have_args

:: ---- decide whether to elevate ---------------------------------------------------------------
:maybe_elevate
if defined NOADMIN goto :have_args

:: fltmc requires administrator and has no side effects, which makes it the standard elevation
:: probe. `net session` is the older trick and gives a false negative when the Server service is
:: stopped. If fltmc were missing entirely this reads as "not elevated" and prompts once - see the
:: loop-breaker note above for why that cannot become a chain of prompts.
fltmc >nul 2>&1
if not errorlevel 1 goto :have_args

:: Not elevated. Park the arguments in a file so no quote has to survive the trip through UAC.
set "ELEVTAG=%RANDOM%%RANDOM%"
set "ARGSFILE=%~dp0.run-args-%ELEVTAG%.tmp"
>"%ARGSFILE%" echo(%ARGS%
if not exist "%ARGSFILE%" (
  echo [run.bat] Could not write next to this script - running without elevation instead.
  goto :have_args
)

:: Double any apostrophe so a path like C:\Users\O'Brien\... cannot break the PowerShell string.
:: Everything inside -Command is single-quoted and no double quote appears anywhere in it, which is
:: what keeps cmd from re-splitting the line.
set "SELF=%~f0"
set "SELFQ=%SELF:'=''%"

echo [run.bat] Asking for administrator - needed only so --incremental can write its cache into
echo [run.bat] the CS2 install. Use --no-admin to skip. A UAC prompt is about to appear.
:: TWO try blocks, not one, and the split matters. Start-Process throws when UAC is DECLINED. A
:: separate throw comes from WaitForExit/ExitCode, because a medium-integrity process cannot always
:: query a high-integrity one - reporting that as "declined" would be a lie, so it reports "unknown"
:: and lets the elevated window speak for itself.
powershell -NoProfile -ExecutionPolicy Bypass -Command "try { $p = Start-Process -FilePath '%SELFQ%' -ArgumentList '__elevated','%ELEVTAG%' -Verb RunAs -PassThru -ErrorAction Stop } catch { exit 1223 }; try { $p.WaitForExit(); exit $p.ExitCode } catch { exit 259 }"
set "ELEVRC=%ERRORLEVEL%"
del /f /q "%ARGSFILE%" 2>nul
popd

:: 1223 is ERROR_CANCELLED - the user said No. Not a crash, and worth saying so plainly.
if "%ELEVRC%"=="1223" (
  echo.
  echo [run.bat] Elevation was declined, so nothing ran.
  echo [run.bat] Re-run as `run.bat --no-admin` if you do not need --incremental.
  exit /b 1223
)
:: 259 is STILL_ACTIVE - the elevated run started but its exit code could not be read back across
:: the integrity boundary. Say so rather than inventing a 0.
if "%ELEVRC%"=="259" (
  echo [run.bat] Running in the elevated window; its exit code cannot be read from here.
  exit /b 0
)
:: The elevated copy has already reported and paused in its own window; do not do it twice here.
exit /b %ELEVRC%

:: ---- run it ----------------------------------------------------------------------------------
:have_args
where bun >nul 2>&1
if errorlevel 1 (
  echo [run.bat] bun is not on PATH.
  echo [run.bat] Install it from https://bun.sh - then open a NEW window so PATH is picked up.
  set "RC=9009"
  goto :finish
)

echo [run.bat] bun run export.ts %ARGS%
:: `call`, because bun may be a .cmd shim on PATH and a bare shim call would never return here.
call bun run export.ts %ARGS%
set "RC=%ERRORLEVEL%"

:finish
:: The log folder is named BEFORE popd, while %~dp0 is still meaningful, and named at all because a
:: Windows console buffer is not evidence - it scrolls, it truncates, and the window closes with it.
:: export.ts appends to logs\ line by line as the run proceeds, so the newest file there describes
:: this run even if it was killed part-way. That file is what to send with a bug report.
if not "%RC%"=="0" (
  echo [run.bat] exited with code %RC%
  echo [run.bat] A full log of this run is in "%~dp0logs" - newest file. Send that, not a screenshot.
)
popd
:: Pause ONLY on failure, and never when asked not to. An unconditional pause would hang a
:: scheduled task - the same "blocks instead of erroring" trap export.ts guards its picker against.
:: On success the window closes; on failure the message stays on screen to be read.
if not "%RC%"=="0" if not defined NOPAUSE pause
exit /b %RC%
