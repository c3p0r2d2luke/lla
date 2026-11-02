import { createServer } from "node:http";
import { createReadStream, createWriteStream } from "node:fs";
import { access, mkdir, mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { basename, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

const here = fileURLToPath(new URL(".", import.meta.url));
const port = Number(process.env.PORT || 4178);
const host = process.env.HOST || "127.0.0.1";
const maxUpload = 300 * 1024 * 1024;
const maxExtracted = 500 * 1024 * 1024;
const root = resolve(process.env.APK_RUNNER_TMP || join(tmpdir(), "apk-playground"));
const sdkRoot = process.env.ANDROID_SDK_ROOT || process.env.ANDROID_HOME;
const adb = process.env.ADB_PATH || (sdkRoot ? join(sdkRoot, "platform-tools", "adb") : "adb");
const emulator = process.env.EMULATOR_PATH || (sdkRoot ? join(sdkRoot, "emulator", "emulator") : "emulator");
const avdName = process.env.ANDROID_AVD;
const aapt = process.env.AAPT_PATH || (sdkRoot ? join(sdkRoot, "build-tools") : "aapt");
const activeProcesses = new Set();
let deviceSerial;
let emulatorProcess;
let currentPackage;
let busy = false;

await mkdir(root, { recursive: true });

function sendJson(response, status, data) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(data));
}

function run(command, args, { timeout = 15000, maxOutput = 2 * 1024 * 1024, input } = {}) {
  return new Promise((resolveRun, reject) => {
    const child = spawn(command, args, { stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
    activeProcesses.add(child);
    const stdout = [];
    const stderr = [];
    let outputSize = 0;
    let settled = false;
    const timer = setTimeout(() => child.kill("SIGKILL"), timeout);
    child.stdout.on("data", chunk => {
      outputSize += chunk.length;
      if (outputSize > maxOutput) child.kill("SIGKILL");
      else stdout.push(chunk);
    });
    child.stderr.on("data", chunk => stderr.push(chunk));
    child.on("error", error => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      activeProcesses.delete(child);
      reject(error);
    });
    child.on("close", code => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      activeProcesses.delete(child);
      if (code !== 0) {
        reject(new Error(Buffer.concat(stderr).toString("utf8").trim() || `${basename(command)} exited with status ${code}`));
        return;
      }
      resolveRun(Buffer.concat(stdout));
    });
    if (input) child.stdin.end(input);
    else child.stdin.end();
  });
}

function adbRun(args, options = {}) {
  const deviceArgs = deviceSerial ? ["-s", deviceSerial] : [];
  return run(adb, [...deviceArgs, ...args], options);
}

async function findDevice() {
  const output = await run(adb, ["devices"], { timeout: 5000 });
  const devices = output.toString().split("\n")
    .slice(1).map(line => line.trim().split(/\s+/))
    .filter(parts => parts.length > 1 && parts[1] === "device");
  const selected = devices.find(parts => parts[0].startsWith("emulator-"));
  if (selected) deviceSerial = selected[0];
}

async function ensureEmulator() {
  await findDevice();
  if (!deviceSerial) {
    if (!avdName) throw new Error("No running Android emulator found. Set ANDROID_AVD to an installed virtual device.");
    emulatorProcess = spawn(emulator, ["-avd", avdName, "-no-window", "-no-audio", "-no-boot-anim", "-gpu", "swiftshader_indirect"], {
      stdio: "ignore",
      windowsHide: true
    });
    activeProcesses.add(emulatorProcess);
    emulatorProcess.on("close", () => activeProcesses.delete(emulatorProcess));
    const deadline = Date.now() + 150000;
    while (Date.now() < deadline) {
      if (emulatorProcess.exitCode !== null) throw new Error(`Android emulator exited with status ${emulatorProcess.exitCode}.`);
      try {
        await findDevice();
        if (deviceSerial) break;
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      await new Promise(resolveDelay => setTimeout(resolveDelay, 1200));
    }
    if (!deviceSerial) throw new Error("Timed out waiting for the emulator device.");
  }

  await adbRun(["wait-for-device"], { timeout: 30000 });
  const deadline = Date.now() + 150000;
  while (Date.now() < deadline) {
    const ready = await adbRun(["shell", "getprop", "sys.boot_completed"], { timeout: 5000 });
    if (ready.toString().trim() === "1") return;
    await new Promise(resolveDelay => setTimeout(resolveDelay, 1500));
  }
  throw new Error("The emulator did not finish booting in time.");
}

async function findAapt() {
  if (process.env.AAPT_PATH) return aapt;
  if (!sdkRoot) return aapt;
  try {
    const versions = (await readdir(aapt)).filter(name => /^\d/.test(name)).sort((left, right) => right.localeCompare(left, undefined, { numeric: true }));
    for (const version of versions) {
      const candidate = join(aapt, version, "aapt");
      try {
        await access(candidate);
        return candidate;
      } catch {}
    }
  } catch {}
  return aapt;
}

async function getPackageName(apkPath) {
  let output;
  try {
    output = await run(await findAapt(), ["dump", "badging", apkPath], { timeout: 15000 });
  } catch (error) {
    throw new Error(`Could not read the APK manifest. Check that Android build-tools (aapt) are installed. ${error.message}`);
  }
  const match = output.toString().match(/^package: name='([A-Za-z0-9_.]+)'/m);
  if (!match) throw new Error("Could not find a valid Android package name in this APK.");
  return match[1];
}

async function saveRequest(request, destination) {
  let size = 0;
  const limiter = new Transform({
    transform(chunk, encoding, callback) {
      size += chunk.length;
      if (size > maxUpload) callback(new Error("Upload exceeds the 300 MB limit."));
      else callback(null, chunk);
    }
  });
  try {
    await pipeline(request, limiter, createWriteStream(destination, { flags: "wx" }));
  } catch (error) {
    await rm(destination, { force: true });
    throw error;
  }
}

async function extractApk(filePath, fileName, workDir) {
  if (extname(fileName).toLowerCase() === ".apk") return filePath;
  if (extname(fileName).toLowerCase() !== ".zip") throw new Error("Upload an APK file or ZIP archive containing an APK.");
  let entries;
  try {
    entries = (await run("unzip", ["-Z1", filePath], { timeout: 15000, maxOutput: 2 * 1024 * 1024 }))
      .toString("utf8").split(/\r?\n/).filter(name => name && name.toLowerCase().endsWith(".apk"));
  } catch (error) {
    throw new Error(`Could not read ZIP archive: ${error.message}`);
  }
  if (entries.length !== 1) throw new Error("The ZIP must contain exactly one APK file.");
  if (entries[0].startsWith("/") || entries[0].split(/[\\/]/).includes("..")) throw new Error("Unsafe APK path in archive.");
  const apkPath = join(workDir, "uploaded.apk");
  let size = 0;
  const output = createWriteStream(apkPath, { flags: "wx" });
  const unzip = spawn("unzip", ["-p", filePath, entries[0]], { stdio: ["ignore", "pipe", "pipe"] });
  activeProcesses.add(unzip);
  unzip.on("close", () => activeProcesses.delete(unzip));
  const closePromise = once(unzip, "close");
  const limiter = new Transform({
    transform(chunk, encoding, callback) {
      size += chunk.length;
      callback(size > maxExtracted ? new Error("Extracted APK exceeds the 500 MB limit.") : null, chunk);
    }
  });
  try {
    await pipeline(unzip.stdout, limiter, output);
    const [code] = await closePromise;
    if (code !== 0) throw new Error("Failed extracting APK from ZIP.");
  } catch (error) {
    unzip.kill("SIGKILL");
    output.destroy();
    await rm(apkPath, { force: true });
    throw error;
  }
  return apkPath;
}

async function handleUpload(request, response) {
  if (busy) return sendJson(response, 409, { error: "An app is already being installed. Please wait and try again." });
  if (Number(request.headers["content-length"]) > maxUpload + 1024 * 1024) return sendJson(response, 413, { error: "Upload exceeds the 300 MB limit." });
  busy = true;
  const workDir = await mkdtemp(join(root, "upload-"));
  const uploadPath = join(workDir, "upload");
  try {
    const filename = basename(decodeURIComponent(request.headers["x-file-name"] || ""));
    if (!filename || ![".apk", ".zip"].includes(extname(filename).toLowerCase())) {
      request.resume();
      return sendJson(response, 400, { error: "Upload an APK or ZIP file." });
    }
    await saveRequest(request, uploadPath);
    await ensureEmulator();
    const apkPath = await extractApk(uploadPath, filename, workDir);
    const packageName = await getPackageName(apkPath);
    await adbRun(["install", "-r", apkPath], { timeout: 120000, maxOutput: 1024 * 1024 });
    await adbRun(["shell", "monkey", "-p", packageName, "-c", "android.intent.category.LAUNCHER", "1"], { timeout: 15000 });
    currentPackage = packageName;
    sendJson(response, 200, { packageName });
  } catch (error) {
    if (!response.headersSent) sendJson(response, error.message.includes("300 MB") ? 413 : 400, { error: error.message });
  } finally {
    busy = false;
    await rm(workDir, { recursive: true, force: true });
  }
}

async function readJson(request, maxSize = 4096) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxSize) throw new Error("Request body is too large.");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function contentType(path) {
  return ({ ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml" })[extname(path)] || "application/octet-stream";
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  try {
    if (request.method === "GET" && url.pathname === "/api/status") {
      let connected = false;
      try {
        const output = await run(adb, ["devices"], { timeout: 4000 });
        connected = output.toString().split("\n").some(line => /^emulator-\d+\s+device$/.test(line.trim()));
      } catch {}
      return sendJson(response, 200, { available: connected || Boolean(avdName), connected, runningApp: currentPackage });
    }
    if (request.method === "POST" && url.pathname === "/api/upload") return await handleUpload(request, response);
    if (request.method === "GET" && url.pathname === "/api/screenshot") {
      if (!deviceSerial) return response.writeHead(204).end();
      const screenshot = await adbRun(["exec-out", "screencap", "-p"], { timeout: 10000, maxOutput: 12 * 1024 * 1024 });
      response.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "no-store" });
      return response.end(screenshot);
    }
    if (request.method === "POST" && url.pathname === "/api/touch") {
      if (!deviceSerial) return sendJson(response, 503, { error: "No emulator is running." });
      const body = await readJson(request);
      const values = ["x", "y", "deltaX", "deltaY", "duration"];
      if (!values.every(key => Number.isInteger(body[key])) || body.x < 0 || body.y < 0 || body.x > 10000 || body.y > 10000 || Math.abs(body.deltaX) > 10000 || Math.abs(body.deltaY) > 10000 || body.duration < 0 || body.duration > 1000) {
        return sendJson(response, 400, { error: "Invalid touch coordinates." });
      }
      const startX = body.x - Math.round(body.deltaX / 2);
      const startY = body.y - Math.round(body.deltaY / 2);
      const endX = body.x + Math.round(body.deltaX / 2);
      const endY = body.y + Math.round(body.deltaY / 2);
      const args = Math.abs(body.deltaX) + Math.abs(body.deltaY) < 12
        ? ["shell", "input", "tap", String(body.x), String(body.y)]
        : ["shell", "input", "swipe", String(startX), String(startY), String(endX), String(endY), String(body.duration)];
      await adbRun(args, { timeout: 5000 });
      return sendJson(response, 200, { ok: true });
    }
    if (request.method === "POST" && url.pathname === "/api/key") {
      if (!deviceSerial) return sendJson(response, 503, { error: "No emulator is running." });
      const body = await readJson(request);
      if (![3, 4, 187].includes(body.keyCode)) return sendJson(response, 400, { error: "Unsupported Android key." });
      await adbRun(["shell", "input", "keyevent", String(body.keyCode)], { timeout: 5000 });
      return sendJson(response, 200, { ok: true });
    }

    if (request.method !== "GET" && request.method !== "HEAD") return sendJson(response, 405, { error: "Method not allowed." });
    const requestedPath = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const filePath = resolve(here, `.${requestedPath}`);
    if (!filePath.startsWith(`${resolve(here)}${sep}`)) return sendJson(response, 403, { error: "Forbidden." });
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) return sendJson(response, 404, { error: "Not found." });
    response.writeHead(200, { "Content-Type": contentType(filePath), "Content-Length": fileStat.size, "X-Content-Type-Options": "nosniff" });
    if (request.method === "HEAD") return response.end();
    return createReadStream(filePath).pipe(response);
  } catch (error) {
    if (!response.headersSent) sendJson(response, 500, { error: error.message || "Runner error." });
    else response.destroy(error);
  }
});

server.listen(port, host, () => console.log(`APK Playground listening at http://${host}:${port}`));
server.on("close", () => {
  for (const child of activeProcesses) child.kill("SIGTERM");
});
