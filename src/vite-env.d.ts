// FIX: Manually define ImportMeta to resolve TypeScript errors with `import.meta.env`.
// The original `/// <reference types="vite/client" />` was failing due to a configuration
// issue where TypeScript could not locate Vite's type definitions. This provides the
// necessary types for the application to compile correctly.

interface ImportMetaEnv {
  readonly VITE_API_KEY: string;
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
