/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA_ID: string;
  // Add other env variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  gtag?: (command: string, eventName: string, params: Record<string, unknown>) => void;
}