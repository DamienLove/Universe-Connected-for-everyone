# Universe Connected Game

A cosmic evolution game inspired by "Universe Connected for Everyone" by Damien Nichols.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. (Optional) Configure your Gemini API key in `.env` if you want live AI-assisted lore:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```
   The game now ships with offline fallback prose so it will run even without the key.

3. (Optional) If you are building for a sub-path (for example GitHub Pages) provide the public base path:
   ```
   VITE_PUBLIC_BASE_PATH=/Universe-Connected-for-everyone/
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Continuous Deployment

This repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml` that:

- Runs `npm run build` on every pull request to the `main` branch.
- Builds and deploys the `dist/` folder to GitHub Pages on pushes to `main`.

No additional configuration is required beyond enabling GitHub Pages for the repository. The workflow automatically sets `VITE_PUBLIC_BASE_PATH` to match the repository name so generated assets resolve correctly in production.

## Building APK

To build this as an Android APK, you'll need to use a tool like Capacitor:

1. Install Capacitor:
   ```bash
   npm install @capacitor/core @capacitor/cli @capacitor/android
   npx cap init
   ```

2. Build the web app:
   ```bash
   npm run build
   ```

3. Add Android platform:
   ```bash
   npx cap add android
   ```

4. Sync and open in Android Studio:
   ```bash
   npx cap sync
   npx cap open android
   ```

5. Build APK from Android Studio

For a deeper walkthrough, troubleshooting tips, and release signing guidance see [`docs/BUILDING_APK.md`](docs/BUILDING_APK.md).
