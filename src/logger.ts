import { inspect, stripVTControlCharacters } from 'node:util';
import chalk from 'chalk';
import logSymbols from './utils/log-symbols';

enum STD_FD {
  OUT = 0,
  ERR = 1,
}

class Logger {
  #spaces = '';

  #strip_ansi<T>(isTTY: boolean, value: T): T {
    return (
      typeof value === 'string' && !isTTY
        ? stripVTControlCharacters(value)
        : value
    ) as T;
  }

  #format_message(isTTY: boolean, msg: unknown): string {
    if (typeof msg !== 'string') {
      return inspect(msg, { colors: isTTY, breakLength: 60 });
    }
    return this.#strip_ansi(isTTY, msg);
  }

  #indent_message(indent: string, msg: string): string {
    return msg
      .split('\n')
      .map((line, index) => (index === 0 ? line : this.#spaces + indent + line))
      .join('\n');
  }

  #log(std: STD_FD, raw: boolean, ...msg: unknown[]) {
    const stream = std === STD_FD.OUT ? process.stdout : process.stderr;
    const isTTY = stream.isTTY ?? false;

    const output = raw
      ? msg.map((el) => this.#format_message(isTTY, el)).join(' ')
      : msg
          .map((el, i) =>
            i === 0
              ? `${this.#spaces}${this.#format_message(isTTY, el)}`
              : this.#indent_message('  ', this.#format_message(isTTY, el))
          )
          .join(' ');

    stream.write(`${output}\n`);
  }

  write(...msg: unknown[]) {
    this.#log(STD_FD.OUT, true, ...msg);
  }
  write_error(...msg: unknown[]) {
    this.#log(STD_FD.ERR, true, ...msg);
  }
  log(...msg: unknown[]) {
    this.#log(STD_FD.ERR, false, ' ', ...msg);
  }
  info(...msg: unknown[]) {
    this.#log(STD_FD.ERR, false, chalk.cyan(logSymbols.info), ...msg);
  }
  error(...msg: unknown[]) {
    this.#log(STD_FD.ERR, false, chalk.red(logSymbols.error), ...msg);
  }
  warning(...msg: unknown[]) {
    this.#log(STD_FD.ERR, false, chalk.yellow(logSymbols.warning), ...msg);
  }
  success(...msg: unknown[]) {
    this.#log(STD_FD.ERR, false, chalk.green(logSymbols.success), ...msg);
  }
  skip(...msg: unknown[]) {
    this.#log(
      STD_FD.ERR,
      false,
      chalk.yellow('↓'),
      ...msg,
      chalk.dim('[SKIPPED]')
    );
  }
  dimmed_log(...msg: unknown[]) {
    this.#log(STD_FD.ERR, false, chalk.gray.dim('>'), chalk.gray.dim(...msg));
  }
  dimmed_error(...msg: unknown[]) {
    this.#log(STD_FD.ERR, false, chalk.gray.dim('>'), chalk.gray.dim(...msg));
  }
  empty(fd: 'stdout' | 'stderr' = 'stdout') {
    this.#log(fd === 'stdout' ? STD_FD.OUT : STD_FD.ERR, true);
  }
  indent(indentation = 0) {
    this.#spaces = ' '.repeat(indentation);
  }
  get indentation() {
    return this.#spaces.length;
  }
  set indentation(indentation: number) {
    this.indent(indentation);
  }
}

export const logger = new Logger();
