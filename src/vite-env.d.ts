/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEFAULT_VOLUME?: "vol-01" | "vol-02";
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
