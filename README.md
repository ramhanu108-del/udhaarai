# SmartUdhaar AI — Android Mobile App

SmartUdhaar AI is an offline-first premium ledger and shop management assistant. This repository is configured to automatically package and build the Android application via GitHub Actions of your repository.

---

## How to Download the APK

You do **not** need Android Studio installed locally to obtain the test APK. Every time code is pushed to the `main` branch, or when triggered manually, GitHub Actions will compile a portable debug APK for you.

Follow these simple steps:
1. Go to your repository on **GitHub**.
2. Click on the **Actions** tab at the top.
3. Select **Android APK Build** from the left sidebar.
4. Click on the **latest run** (indicated by green checkmark or currently running).
5. Scroll down to the **Artifacts** section at the bottom.
6. Click on **smartudhaar-ai-debug-apk** to download the ZIP file.
7. Extract the ZIP to get your `app-debug.apk` file.
8. Send this APK to any Android device, enable installation from *Unknown Sources*, and run!

---

## Local Development Commands

If you ever wish to build or test the Capacitor/Android project locally, you can use these custom NPM scripts:

### 1. Synchronize Web Build with Android Platform
This command builds the React/Vite assets and updates the native Android source directory:
```bash
npm run cap:sync
```

### 2. Compile Debug APK Locally
This compiles the debug APK directly from the console (requires JDK 17 to be installed and available):
```bash
npm run android:debug
```

The compiled APK will be output to:
`android/app/build/outputs/apk/debug/app-debug.apk`
