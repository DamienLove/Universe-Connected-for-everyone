# Universe Connected Game

A cosmic evolution game inspired by "Universe Connected for Everyone" by Damien Nichols.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure your Gemini API key in `.env`:
   ```
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Build for production:
   ```bash
   npm run build
   ```

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
