/**
 * All these variables are populated at transpile-time by @rollup/plugin-replace
 *
 * @see rollup.config.mjs for details on how this is done
 */
export const name = process.env.PKG_NAME ?? '<cmd>';
export const version = process.env.PKG_VERSION ?? '<version>';
export const description = process.env.PKG_DESCRIPTION ?? '<description>';
