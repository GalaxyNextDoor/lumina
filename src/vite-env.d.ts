/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GEMINI_API_KEY?: string
  /** Optional: first model tried before built-in fallbacks (e.g. gemini-1.5-flash). */
  readonly VITE_GEMINI_MODEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
