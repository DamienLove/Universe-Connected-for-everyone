// FIX: Manually define ImportMeta to resolve TypeScript errors with `import.meta.env`.
// The original `/// <reference types="vite/client" />` was failing due to a configuration
// issue where TypeScript could not locate Vite's type definitions. This provides the
// necessary types for the application to compile correctly.

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  // Add other environment variables used in the app here.
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
