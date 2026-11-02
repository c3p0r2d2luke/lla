const fileInput = document.querySelector("#file-input");
const dropZone = document.querySelector("#drop-zone");
const chooseButton = document.querySelector("#choose-button");
const image = document.querySelector("#screen-image");
const placeholder = document.querySelector("#screen-placeholder");
const loading = document.querySelector("#screen-loading");
const loadingMessage = document.querySelector("#loading-message");
const toast = document.querySelector("#toast");
const connectionDot = document.querySelector("#connection-dot");
const connectionLabel = document.querySelector("#connection-label");
const runtimeCaption = document.querySelector("#runtime-caption");
let refreshTimer;
let toastTimer;
let pointerStart;
let currentFile;
let screenUrl;

function notify(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 4200);
}

function setLoading(message) {
  loadingMessage.textContent = message;
  loading.hidden = false;
  placeholder.hidden = true;
}

function setIdle(title, message) {
  if (screenUrl) URL.revokeObjectURL(screenUrl);
  screenUrl = null;
  image.removeAttribute("src");
  image.hidden = true;
  placeholder.hidden = false;
  loading.hidden = true;
  document.querySelector("#screen-title").textContent = title;
  document.querySelector("#screen-message").textContent = message;
}

async function request(path, options = {}) {
  const response = await fetch(path, options);
  const data = response.headers.get("content-type")?.includes("application/json")
    ? await response.json()
    : null;
  if (!response.ok) throw new Error(data?.error || `Request failed (${response.status})`);
  return data;
}

async function checkStatus() {
  try {
    const data = await request("./api/status");
    connectionDot.classList.toggle("online", data.available);
    connectionLabel.textContent = data.connected ? "Emulator connected" : data.available ? "Runner ready" : "Emulator unavailable";
    if (!data.available) {
      runtimeCaption.textContent = "Android SDK / AVD not configured";
      if (!currentFile && !image.src) setIdle("Emulator not configured", "Set up an Android SDK and AVD to run apps here.");
    } else if (!currentFile && !image.src) {
      runtimeCaption.textContent = "Waiting for an app";
    }
  } catch {
    connectionDot.classList.remove("online");
    connectionLabel.textContent = "Runner offline";
    runtimeCaption.textContent = "Start the local runner server";
  }
}

async function refreshScreen() {
  try {
    const response = await fetch(`./api/screenshot?t=${Date.now()}`, { cache: "no-store" });
    if (response.status === 204) return;
    if (!response.ok) throw new Error("Could not read emulator screen.");
    const blob = await response.blob();
    if (screenUrl) URL.revokeObjectURL(screenUrl);
    screenUrl = URL.createObjectURL(blob);
    image.src = screenUrl;
    image.hidden = false;
    placeholder.hidden = true;
    loading.hidden = true;
  } catch (error) {
    notify(error.message);
  }
}

function startRefreshing() {
  clearInterval(refreshTimer);
  refreshScreen();
  refreshTimer = setInterval(refreshScreen, 1100);
}

async function submitFile(file) {
  if (!file) return;
  const extension = file.name.toLowerCase().split(".").pop();
  if (!["apk", "zip"].includes(extension)) {
    notify("Choose an APK or a ZIP containing one APK.");
    return;
  }
  if (file.size > 300 * 1024 * 1024) {
    notify("This file is larger than the 300 MB limit.");
    return;
  }

  currentFile = file;
  document.querySelector("#file-name").textContent = file.name;
  document.querySelector("#file-name").hidden = false;
  setLoading("Uploading app…");
  runtimeCaption.textContent = "Uploading app";
  try {
    setLoading("Starting Android emulator…");
    const result = await request("./api/upload", {
      method: "POST",
      headers: { "X-File-Name": encodeURIComponent(file.name) },
      body: file
    });
    runtimeCaption.textContent = result.packageName;
    notify(`Running ${result.packageName}`);
    startRefreshing();
  } catch (error) {
    currentFile = null;
    setIdle("Could not start this app", error.message);
    runtimeCaption.textContent = "Waiting for an app";
    notify(error.message);
  }
}

chooseButton.addEventListener("click", () => fileInput.click());
fileInput.addEventListener("change", () => {
  submitFile(fileInput.files?.[0]);
  fileInput.value = "";
});
dropZone.addEventListener("dragover", event => {
  event.preventDefault();
  dropZone.classList.add("dragging");
});
dropZone.addEventListener("dragleave", () => dropZone.classList.remove("dragging"));
dropZone.addEventListener("drop", event => {
  event.preventDefault();
  dropZone.classList.remove("dragging");
  submitFile(event.dataTransfer.files?.[0]);
});
document.querySelector("#refresh-button").addEventListener("click", refreshScreen);
document.querySelectorAll("[data-key]").forEach(button => {
  button.addEventListener("click", async () => {
    try {
      await request("./api/key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyCode: Number(button.dataset.key) })
      });
      refreshScreen();
    } catch (error) {
      notify(error.message);
    }
  });
});

const screen = document.querySelector("#device-screen");
screen.addEventListener("pointerdown", event => {
  if (image.hidden) return;
  pointerStart = { x: event.clientX, y: event.clientY, time: Date.now() };
  screen.setPointerCapture(event.pointerId);
});
screen.addEventListener("pointerup", async event => {
  if (!pointerStart || image.hidden || !image.naturalWidth) return;
  const rect = image.getBoundingClientRect();
  const scaleX = image.naturalWidth / rect.width;
  const scaleY = image.naturalHeight / rect.height;
  const x = Math.round(((pointerStart.x + event.clientX) / 2 - rect.left) * scaleX);
  const y = Math.round(((pointerStart.y + event.clientY) / 2 - rect.top) * scaleY);
  const deltaX = Math.round((event.clientX - pointerStart.x) * scaleX);
  const deltaY = Math.round((event.clientY - pointerStart.y) * scaleY);
  const duration = Math.max(120, Math.min(700, Date.now() - pointerStart.time));
  pointerStart = null;
  try {
    await request("./api/touch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ x, y, deltaX, deltaY, duration })
    });
    setTimeout(refreshScreen, 250);
  } catch (error) {
    notify(error.message);
  }
});

checkStatus();
setInterval(checkStatus, 10000);
