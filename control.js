
const { ipcRenderer } = require("electron");

const screenCountSelect = document.getElementById("screenCount");
const applyScreensBtn = document.getElementById("applyScreens");
const screenIndexSelect = document.getElementById("screenIndex");
const urlInput = document.getElementById("urlInput");
const applyUrlBtn = document.getElementById("applyUrl");
const zoomInBtn = document.getElementById("zoomIn");
const zoomOutBtn = document.getElementById("zoomOut");
const resetBtn = document.getElementById("reset");
const reloadBtn = document.getElementById("reload");

applyScreensBtn.addEventListener("click", () => {
  const count = screenCountSelect.value;
  ipcRenderer.send("set-screen-count", count);
});

applyUrlBtn.addEventListener("click", () => {
  const index = screenIndexSelect.value;
  const url = urlInput.value;
  ipcRenderer.send("set-url", { index, url });
});

zoomInBtn.addEventListener("click", () => {
  const index = screenIndexSelect.value;
  ipcRenderer.send("zoom-screen", { index, delta: "in" });
});

zoomOutBtn.addEventListener("click", () => {
  const index = screenIndexSelect.value;
  ipcRenderer.send("zoom-screen", { index, delta: "out" });
});

resetBtn.addEventListener("click", () => {
  const index = screenIndexSelect.value;
  ipcRenderer.send("reset-screen", index);
});

reloadBtn.addEventListener("click", () => {
  const index = screenIndexSelect.value;
  ipcRenderer.send("reload-screen", index);
});
