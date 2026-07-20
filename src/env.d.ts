/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly AFFILIATE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
