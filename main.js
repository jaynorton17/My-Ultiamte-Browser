
const { app, BrowserWindow, BrowserView, ipcMain, Menu } = require("electron");
const sessionManager = require("./sessionManager");

let mainWindow;
let controlWindow;
let views = [];
let currentUrls = [];
let zoomFactors = [];
let screenCount = 4;

// remove native app menu
Menu.setApplicationMenu(null);

// GPU + sandbox settings for Crostini stability
app.commandLine.appendSwitch("disable-gpu");
app.commandLine.appendSwitch("disable-software-rasterizer", "true");
app.commandLine.appendSwitch("disable-gpu-compositing", "true");
app.commandLine.appendSwitch("use-gl", "desktop");
app.commandLine.appendSwitch("ignore-gpu-blacklist");
app.commandLine.appendSwitch("disable-gpu-vsync");
app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-hardware-acceleration");
app.commandLine.appendSwitch("no-sandbox");
app.commandLine.appendSwitch("disable-features", "VizDisplayCompositor");

function createMainWindow() {
  try {
    mainWindow = new BrowserWindow({
      width: 1600,
      height: 900,
      backgroundColor: "#000000",
      frame: false,                 // no top toolbar / frame
      titleBarStyle: "hidden",
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        webSecurity: false
      }
    });

    const saved = sessionManager.loadSession();
    if (saved && typeof saved.screenCount === "number") {
      screenCount = Math.max(1, Math.min(5, saved.screenCount));
    }

    const savedScreens = (saved && Array.isArray(saved.screens)) ? saved.screens : [];
    currentUrls = new Array(screenCount).fill("https://www.google.com/");
    zoomFactors = new Array(screenCount).fill(1.0);

    for (let i = 0; i < screenCount; i++) {
      const view = new BrowserView({
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: false,
          webSecurity: false,
          backgroundThrottling: false
        }
      });

      views.push(view);
      mainWindow.addBrowserView(view);

      const url = savedScreens[i] || "https://www.google.com/";
      currentUrls[i] = url;

      layoutScreens();
      safeLoad(view, url, i);
      addCrashRecovery(view, i);
    }
  } catch (err) {
    console.error("createMainWindow() crashed:", err);
  }
}

function layoutScreens() {
  if (!mainWindow) return;
  const [winW, winH] = mainWindow.getSize();

  if (screenCount === 1) {
    if (views[0]) views[0].setBounds({ x: 0, y: 0, width: winW, height: winH });
  } else if (screenCount === 2) {
    const halfW = Math.floor(winW / 2);
    for (let i = 0; i < 2; i++) {
      if (!views[i]) continue;
      views[i].setBounds({ x: i * halfW, y: 0, width: halfW, height: winH });
    }
  } else if (screenCount === 3) {
    const halfW = Math.floor(winW / 2);
    const halfH = Math.floor(winH / 2);
    if (views[0]) views[0].setBounds({ x: 0, y: 0, width: halfW, height: halfH });
    if (views[1]) views[1].setBounds({ x: halfW, y: 0, width: halfW, height: halfH });
    if (views[2]) views[2].setBounds({ x: 0, y: halfH, width: winW, height: halfH });
  } else if (screenCount === 4) {
    const halfW = Math.floor(winW / 2);
    const halfH = Math.floor(winH / 2);
    for (let i = 0; i < 4; i++) {
      if (!views[i]) continue;
      const col = i % 2;
      const row = Math.floor(i / 2);
      views[i].setBounds({ x: col * halfW, y: row * halfH, width: halfW, height: halfH });
    }
  } else if (screenCount === 5) {
    const thirdW = Math.floor(winW / 3);
    const halfH = Math.floor(winH / 2);
    const positions = [
      { x: 0, y: 0 },
      { x: thirdW, y: 0 },
      { x: thirdW * 2, y: 0 },
      { x: 0, y: halfH },
      { x: thirdW, y: halfH }
    ];
    for (let i = 0; i < 5; i++) {
      if (!views[i]) continue;
      const pos = positions[i];
      views[i].setBounds({ x: pos.x, y: pos.y, width: thirdW, height: halfH });
    }
  }
}

function safeLoad(view, url, index) {
  try {
    view.webContents.loadURL(url);
    view.webContents.setZoomFactor(zoomFactors[index] || 1.0);

    const track = (newUrl) => {
      currentUrls[index] = newUrl;
      sessionManager.saveSession({ screenCount, screens: currentUrls });
    };

    view.webContents.on("did-navigate", (_ev, url) => track(url));
    view.webContents.on("did-navigate-in-page", (_ev, url) => track(url));
  } catch (err) {
    console.error(`safeLoad failed for screen ${index}`, err);
  }
}

function addCrashRecovery(view, index) {
  view.webContents.on("render-process-gone", (event, details) => {
    console.error(`Renderer crashed on screen ${index}:`, details);
    setTimeout(() => {
      safeLoad(view, currentUrls[index] || "https://www.google.com/", index);
    }, 1000);
  });

  view.webContents.on("unresponsive", () => {
    console.warn(`Screen ${index} unresponsive. Reloading...`);
    safeLoad(view, currentUrls[index], index);
  });
}

function recreateViews() {
  if (mainWindow && views.length) {
    for (const v of views) {
      try {
        mainWindow.removeBrowserView(v);
      } catch (e) {}
    }
  }
  views = [];
  zoomFactors = new Array(screenCount).fill(1.0);
  const oldUrls = currentUrls.slice();
  currentUrls = new Array(screenCount).fill("https://www.google.com/");

  for (let i = 0; i < screenCount; i++) {
    const view = new BrowserView({
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: false,
        webSecurity: false,
        backgroundThrottling: false
      }
    });
    views.push(view);
    mainWindow.addBrowserView(view);

    const url = oldUrls[i] || "https://www.google.com/";
    currentUrls[i] = url;
    layoutScreens();
    safeLoad(view, url, i);
    addCrashRecovery(view, i);
  }

  sessionManager.saveSession({ screenCount, screens: currentUrls });
}

function createControlWindow() {
  controlWindow = new BrowserWindow({
    width: 260,
    height: 420,
    x: 0,
    y: 100,
    alwaysOnTop: true,
    frame: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false
    }
  });

  controlWindow.loadFile("control.html");
}

// IPC from control panel

ipcMain.on("set-screen-count", (event, count) => {
  const n = parseInt(count, 10);
  if (isNaN(n) || n < 1 || n > 5) return;
  screenCount = n;
  recreateViews();
});

ipcMain.on("reset-screen", (event, index) => {
  const i = parseInt(index, 10);
  if (isNaN(i) || i < 0 || i >= views.length) return;
  const url = "https://www.google.com/";
  currentUrls[i] = url;
  safeLoad(views[i], url, i);
  sessionManager.saveSession({ screenCount, screens: currentUrls });
});

ipcMain.on("reload-screen", (event, index) => {
  const i = parseInt(index, 10);
  if (isNaN(i) || i < 0 || i >= views.length) return;
  views[i].webContents.reload();
});

ipcMain.on("zoom-screen", (event, payload) => {
  const { index, delta } = payload;
  const i = parseInt(index, 10);
  if (isNaN(i) || i < 0 || i >= views.length) return;
  const step = delta === "in" ? 0.1 : -0.1;
  zoomFactors[i] = Math.max(0.25, Math.min(3.0, (zoomFactors[i] || 1.0) + step));
  views[i].webContents.setZoomFactor(zoomFactors[i]);
});

ipcMain.on("set-url", (event, payload) => {
  const { index, url } = payload;
  const i = parseInt(index, 10);
  if (isNaN(i) || i < 0 || i >= views.length) return;
  if (!url || typeof url !== "string") return;
  let finalUrl = url.trim();
  if (!/^https?:\/\//i.test(finalUrl)) {
    finalUrl = "https://" + finalUrl;
  }
  currentUrls[i] = finalUrl;
  safeLoad(views[i], finalUrl, i);
  sessionManager.saveSession({ screenCount, screens: currentUrls });
});

app.whenReady().then(() => {
  createMainWindow();
  createControlWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
      createControlWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
