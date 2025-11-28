# Quad Browser V14.1

This repository contains the Electron-based multi-view "Quad Browser" and its control window. It is set up to run on Linux (including Crostini on Chromebooks) with only Node.js and standard system packages.

## Prerequisites (Linux / Crostini)

1. **System packages** (for Electron runtime & sandboxing):
   ```bash
   sudo apt-get update
   sudo apt-get install -y libnss3 libatk-bridge2.0-0 libgtk-3-0 libxss1 libasound2 libgbm1 libdrm2 libxkbcommon0
   ```
2. **Node.js + npm**: install from your preferred source (e.g., `sudo apt-get install -y nodejs npm`).

## Download & run

1. Download or copy the repository as a **single folder** (zip/tar are fine) onto your Linux filesystem.
2. Extract it, open a terminal in the folder, then install dependencies:
   ```bash
   npm install
   ```
3. Start the app:
   ```bash
   npm start
   ```

### Notes for Chromebooks

- The `npm start` script already passes GPU and sandbox flags for Crostini stability (`--disable-gpu`, `--disable-software-rasterizer`, `--no-sandbox`).
- The app stores session data under the Electron user data directory (usually `~/.config/quad-browser-v14-1-electron`).
- If you see permission prompts when opening the zip, move the folder into your Linux home directory before running the commands above.

## Development scripts

- `npm start` — launches the Electron app in development mode using the sources in this folder.

## Project structure

- `main.js` — creates the main browser grid, control window, and click automation IPC handlers.
- `control.html` / `control.js` — UI and renderer logic for the controller window (including click automation setup).
- `sessionManager.js` — persists tab layout and URL state.

