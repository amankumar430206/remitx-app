# remitx-mobile

Expo React Native app for the RemitX cross-border payment platform.
Expo SDK 54 · React Native · TypeScript · TanStack Query · Zustand

---

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | >= 20 | |
| npm | >= 10 | |
| Expo Go | latest | Install on physical device from App Store / Play Store |
| Android Studio | latest | For Android emulator (optional) |
| Xcode | latest | For iOS simulator — Mac only (optional) |

> Requires **remitx-api** running and reachable on your local network before launching the app.

---

## Environment

Create `.env` in the project root:

```env
EXPO_PUBLIC_API_URL=http://<YOUR_LAN_IP>:3000/api/v1
EXPO_PUBLIC_TENANT_SLUG=remitx
```

Replace `<YOUR_LAN_IP>` with your machine's local network IP.
**Do not use `localhost`** — on a physical device or emulator it resolves to the device itself, not your machine.

**Find your LAN IP:**
```bash
# macOS / Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr "IPv4"
```

---

## Setup

```bash
npm install
npm start       # starts the Expo dev server
```

Then connect a client:

| Client | How |
|--------|-----|
| Physical device | Scan the QR code with **Expo Go** |
| Android emulator | Press `a` in the terminal |
| iOS simulator (Mac) | Press `i` in the terminal |

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Expo dev server |
| `npm run android` | Open directly on Android emulator |
| `npm run ios` | Open directly on iOS simulator (Mac only) |
| `npm run web` | Open in browser (limited functionality) |

---

## Logging in

Use any seed account with workspace slug **`remitx`**:

| Email | Password | Role |
|-------|----------|------|
| `admin@remitx.com` | `Admin@RemitX2024!` | super_admin |
| `cadmin@remitx.com` | `Test@1234!` | client_admin |
| `maker1@remitx.com` | `Test@1234!` | maker |
| `checker1@remitx.com` | `Test@1234!` | checker |

---

## Notes

- **Auth tokens** are stored in `expo-secure-store` only — never AsyncStorage.
- **Biometric re-auth** triggers automatically on every app resume from background.
- **Android URL crash (Hermes engine):** already patched in `index.js` — no action needed.

---

## Troubleshooting

**`Network request failed` when logging in**
- Confirm `EXPO_PUBLIC_API_URL` uses your machine's LAN IP, not `localhost`.
- Test reachability by opening `http://<LAN_IP>:3000/health` in your phone's browser.
- Make sure your phone/emulator and machine are on the same Wi-Fi network.

**QR code not scanning**
- Switch the Expo server to tunnel mode: press `s` → select **Tunnel**.
- Install the latest version of Expo Go from the App Store / Play Store.

**App crashes immediately on Android**
- This is the Hermes `URL.protocol` bug. Confirm `index.js` contains the `URL.prototype.protocol` patch at the top of the file.
