
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

function getSessionFile() {
  return path.join(app.getPath("userData"), "quad_session_v14_1.json");
}

function loadSession() {
  try {
    const file = getSessionFile();
    if (!fs.existsSync(file)) return null;
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch (err) {
    console.error("Failed to load session:", err);
    return null;
  }
}

function saveSession(data) {
  try {
    const file = getSessionFile();
    fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save session:", err);
  }
}

module.exports = { loadSession, saveSession };
