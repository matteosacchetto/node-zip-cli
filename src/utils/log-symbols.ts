import { stripVTControlCharacters } from 'node:util';
import _logSymbols from 'log-symbols';

/**
 * By default, the package `log-symbols` includes colored symbols.
 * To have free control over how the symbols get colored, this wrapper re-exports
 * the symbols stripping away ansi codes
 **/
export default {
  error: stripVTControlCharacters(_logSymbols.error),
  info: stripVTControlCharacters(_logSymbols.info),
  warning: stripVTControlCharacters(_logSymbols.warning),
  success: stripVTControlCharacters(_logSymbols.success),
};
