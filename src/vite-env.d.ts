/// <reference types="vite/client" />


interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string;
    // add more custom variables here if needed
  }
  
  // Extend the ImportMeta interface to include our env
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
