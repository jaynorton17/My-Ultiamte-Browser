
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
const clickList = document.getElementById("clickList");
const addClickBtn = document.getElementById("addClick");
const startClickerBtn = document.getElementById("startClicker");
const stopClickerBtn = document.getElementById("stopClicker");

let clickActions = [];

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

function renderClickActions() {
  clickList.innerHTML = "";

  if (!clickActions.length) {
    const empty = document.createElement("div");
    empty.textContent = "No clicks added yet.";
    empty.style.fontSize = "12px";
    empty.style.color = "#888";
    clickList.appendChild(empty);
    return;
  }

  clickActions.forEach((action) => {
    const wrapper = document.createElement("div");
    wrapper.className = "click-item";

    const coords = document.createElement("div");
    coords.className = "click-coords";
    coords.textContent = `Location: x=${action.x}, y=${action.y}`;
    wrapper.appendChild(coords);

    const row = document.createElement("div");
    row.className = "click-row";

    const intervalLabel = document.createElement("label");
    intervalLabel.textContent = "Interval (ms)";
    const intervalInput = document.createElement("input");
    intervalInput.type = "number";
    intervalInput.min = "50";
    intervalInput.value = action.intervalMs;
    intervalInput.addEventListener("change", (e) => {
      const val = parseInt(e.target.value, 10);
      action.intervalMs = isNaN(val) ? 1000 : Math.max(50, val);
      intervalInput.value = action.intervalMs;
    });
    intervalLabel.appendChild(intervalInput);

    const repeatLabel = document.createElement("label");
    repeatLabel.textContent = "Repetitions (0 = until stop)";
    const repeatInput = document.createElement("input");
    repeatInput.type = "number";
    repeatInput.min = "0";
    repeatInput.value = action.repetitions;
    repeatInput.addEventListener("change", (e) => {
      const val = parseInt(e.target.value, 10);
      action.repetitions = isNaN(val) ? 0 : Math.max(0, val);
      repeatInput.value = action.repetitions;
    });
    repeatLabel.appendChild(repeatInput);

    row.appendChild(intervalLabel);
    row.appendChild(repeatLabel);
    wrapper.appendChild(row);

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remove";
    removeBtn.addEventListener("click", () => {
      clickActions = clickActions.filter((item) => item.id !== action.id);
      renderClickActions();
    });
    wrapper.appendChild(removeBtn);

    clickList.appendChild(wrapper);
  });
}

async function captureClick() {
  addClickBtn.disabled = true;
  addClickBtn.textContent = "Click anywhere...";
  try {
    const pos = await ipcRenderer.invoke("capture-click");
    if (pos && typeof pos.x === "number" && typeof pos.y === "number") {
      clickActions.push({
        id: Date.now() + Math.random(),
        x: Math.round(pos.x),
        y: Math.round(pos.y),
        intervalMs: 1000,
        repetitions: 0
      });
      renderClickActions();
    }
  } finally {
    addClickBtn.disabled = false;
    addClickBtn.textContent = "Add Click";
  }
}

function startClicker() {
  if (!clickActions.length) return;
  const payload = clickActions.map((a) => ({
    x: a.x,
    y: a.y,
    intervalMs: a.intervalMs,
    repetitions: a.repetitions
  }));
  ipcRenderer.send("start-clicker", payload);
}

function stopClicker() {
  ipcRenderer.send("stop-clicker");
}

addClickBtn.addEventListener("click", captureClick);
startClickerBtn.addEventListener("click", startClicker);
stopClickerBtn.addEventListener("click", stopClicker);

ipcRenderer.on("clicker-status", (_event, payload) => {
  const running = payload && payload.running;
  startClickerBtn.disabled = running;
  stopClickerBtn.disabled = !running;
  addClickBtn.disabled = running;
});

stopClickerBtn.disabled = true;
renderClickActions();
