# Changelog

## Repository package — 2026-10-21

- Packaged the existing v1.2.0 userscript without modifying its contents.
- Added English and Turkish installation, usage, and troubleshooting documentation.
- Added an MIT license, publishing instructions, and validation notes.
- Checked JavaScript syntax and verified the packaged script against the recovered source by SHA-256.

## Userscript 1.2.0 — 2026-09-29

- Fixed the target batch size at 100.
- Reloads 3 seconds after a completed batch.
- Uses a 10-second readiness window for selection controls and a 10-second delay for other recoverable errors.
- Retains single-batch mode, manual stop, tab session state, and recognition of several Instagram restriction messages.

This package does not include the older 100/200 selector or the separate night-mode script.
