# Building an Android APK

This project is a Vite-powered Progressive Web App (PWA). The easiest way to ship it as a native Android package is to wrap the production build with [Capacitor](https://capacitorjs.com/). The steps below assume you have Android Studio and the Android SDK installed locally.

## 1. Install Capacitor dependencies

```bash
npm install --save @capacitor/core
npm install --save-dev @capacitor/cli @capacitor/android
npx cap init universe-connected com.example.universeconnected
```

Choose any app name and bundle ID you prefer when `cap init` prompts you (the values above are examples).

## 2. Create a production build

```bash
npm run build
```

This writes the compiled web assets to the `dist/` directory.

## 3. Add the Android platform

```bash
npx cap add android
```

Capacitor scaffolds an `android/` folder that contains a Gradle project.

## 4. Sync web assets

```bash
npx cap sync android
```

Repeat this command any time you rebuild the web app so the latest `dist/` assets are copied into the native project.

## 5. Open Android Studio and build

```bash
npx cap open android
```

Android Studio will open with the generated project. From here you can:

1. Use **Build > Build Bundle(s) / APK(s) > Build APK(s)** for a quick unsigned APK.
2. Configure signing in **Build > Generate Signed Bundle / APK...** to produce a release build.

## 6. Optional hardening tips

- Update `android/app/src/main/AndroidManifest.xml` with a custom app name, icon, and splash settings.
- Toggle Capacitor plugins (e.g., StatusBar) in `capacitor.config.ts` if you need native integrations.
- Automate builds on CI by running `npx cap sync android` followed by Gradle commands (`./gradlew assembleRelease`).

With these steps you can repeatedly ship refreshed APKs that mirror the latest state of the web game.
