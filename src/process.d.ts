declare namespace NodeJS {
  export interface ProcessEnv {
    PKG_NAME: string;
    PKG_VERSION: string;
    PKG_DESCRIPTION: string;
    BUILD_NODE_ENV: string;
  }
}
