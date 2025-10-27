/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GA_ID: string;
  // Add other env variables here
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

type Gtag = import("gtag.js").Gtag;

interface Window {
  gtag: Gtag;
}
