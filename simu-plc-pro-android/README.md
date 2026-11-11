# Simu PLC Pro — wrapper Android (Capacitor)

Encapsule le clone local `../simu-plc-pro/` dans une WebView hors-ligne.

- **Package ID:** `dz.electro.simuplc`
- **Nom:** Simu PLC Pro
- **APK livré:** `../simu-plc-pro/android-apk/SimuPLC-Pro-debug.apk`

## Rebuild

```bash
export ANDROID_HOME=$HOME/android-sdk
npm install
./sync-www.sh
cd android && ./gradlew assembleDebug
```

Nécessite JDK 17+ et Android SDK (platform 34, build-tools 34).
