# APK Playground

Run Android apps in a local Android Virtual Device (AVD) and control them from a browser. The browser displays emulator screenshots and forwards taps, swipes, Back, Home, and Recent Apps actions to the emulator.

This guide targets Ubuntu/Debian on an **x86-64 Linux server**. The Android Emulator requires a working virtualization setup; a VPS without nested virtualization/KVM may not be able to run it.

## 1. Install system packages

```sh
sudo apt update
sudo apt install -y openjdk-17-jdk unzip curl ca-certificates nginx apache2-utils qemu-kvm
```

Install Node.js 20 or newer if it is not already available:

```sh
node --version
```

Use your preferred Node.js installation method if that command is missing or reports a version below 20.

Check that hardware virtualization is available:

```sh
sudo usermod -aG kvm "$USER"
```

Log out and back in after changing group membership. Verify KVM access before continuing:

```sh
id
test -r /dev/kvm && test -w /dev/kvm && echo "KVM is accessible"
```

If `/dev/kvm` is unavailable, enable virtualization/nested virtualization in the host or VPS configuration first.

## 2. Install the Android SDK

Download the current **Linux command-line tools** ZIP from [Android Studio downloads](https://developer.android.com/studio#command-line-tools-only), then install it into `/opt/android-sdk` (replace the downloaded filename if it differs):

```sh
sudo mkdir -p /opt/android-sdk/cmdline-tools
mkdir -p /tmp/android-cmdline-tools
unzip -q /tmp/commandlinetools-linux-*.zip -d /tmp/android-cmdline-tools
sudo mv /tmp/android-cmdline-tools/cmdline-tools /opt/android-sdk/cmdline-tools/latest
```

Set the SDK environment for the current shell and install the emulator, ADB, build tools (`aapt`), and Android 35 Google APIs image:

```sh
export ANDROID_SDK_ROOT=/opt/android-sdk
export PATH="$ANDROID_SDK_ROOT/cmdline-tools/latest/bin:$ANDROID_SDK_ROOT/platform-tools:$ANDROID_SDK_ROOT/emulator:$PATH"
sudo chown -R "$USER":"$(id -gn)" "$ANDROID_SDK_ROOT"
yes | sdkmanager --licenses
sdkmanager "platform-tools" "emulator" "build-tools;35.0.0" "platforms;android-35" "system-images;android-35;google_apis;x86_64"
```

Create an AVD called `apk-test`:

```sh
avdmanager create avd --force --name apk-test --package "system-images;android-35;google_apis;x86_64"
```

Keep the AVD and SDK available to the same Linux user that will run `server.js`. If using a dedicated service account, install the SDK and create the AVD as that account instead; Android stores AVD configuration in that user's home directory.

## 3. Start the runner

From the repository checkout:

```sh
cd /path/to/lla/s/apk
ANDROID_SDK_ROOT=/opt/android-sdk ANDROID_AVD=apk-test HOST=127.0.0.1 PORT=4178 node server.js
```

The server starts a headless emulator automatically when the first app is uploaded. Open `http://127.0.0.1:4178` for a local test. Upload an APK, or a ZIP containing exactly one APK. Uploads are limited to 300 MB and extracted APKs to 500 MB.

For an always-on service, run the command under a service manager such as systemd, using the same Linux account that owns the AVD. Keep `HOST=127.0.0.1` so the runner is reachable only through the local machine and your reverse proxy.

Optional variables:

- `PORT` — runner port (default `4178`)
- `HOST` — bind address (default `127.0.0.1`)
- `ANDROID_SDK_ROOT` (or `ANDROID_HOME`) — Android SDK location
- `ANDROID_AVD` — installed AVD name to start on demand; without it, an already-running emulator must be available
- `ADB_PATH`, `EMULATOR_PATH`, `AAPT_PATH` — override Android tool paths
- `APK_RUNNER_TMP` — temporary upload directory (defaults to the system temp directory)

## 4. Publish at `https://lla.ipv64.net/s/apk/`

The supplied [`example.nginx`](./example.nginx) contains a TLS virtual-host example. Add its two `location` blocks to the existing HTTPS `server` block for `lla.ipv64.net` (or adapt the complete example if setting up a separate virtual host). It expects a certificate at `/etc/letsencrypt/live/lla.ipv64.net/`; use your actual certificate paths if they differ.

The example requires HTTP Basic Authentication so the public internet cannot upload arbitrary apps to your emulator. Create a password file and enter a strong password when prompted:

```sh
sudo htpasswd -c /etc/nginx/.htpasswd-apk YOUR_LOGIN_NAME
sudo chmod 640 /etc/nginx/.htpasswd-apk
sudo chown root:www-data /etc/nginx/.htpasswd-apk
```

Make sure the existing TLS server can read the password file. Then validate and reload Nginx:

```sh
sudo nginx -t
sudo systemctl reload nginx
```

The root path `/s/apk` redirects to `/s/apk/`, and the reverse proxy strips `/s/apk/` before forwarding requests to the runner on port 4178.

## Security notes

Uploaded apps execute inside the configured Android emulator, not in the browser. Use a dedicated AVD with no personal accounts, credentials, or sensitive data. Keep the runner bound to localhost and put authentication in front of it; APK Playground itself does not implement user accounts. The Nginx example protects the page, API, and uploads with Basic Authentication. Treat APKs as untrusted software even when uploaded by an authenticated user.
