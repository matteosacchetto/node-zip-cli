import { Console } from 'node:console';
import { inspect } from 'node:util';
import chalk from 'chalk';
import logSymbols from 'log-symbols';
import stripAnsi from 'strip-ansi';

enum STD_FD {
  OUT = 0,
  ERR = 1,
}

class Logger {
  #spaces: string;
  #stdout: NodeJS.WritableStream;
  #stderr: NodeJS.WritableStream;
  #console: Console;

  constructor() {
    this.#spaces = '';
    this.#stdout = process.stdout;
    this.#stderr = process.stderr;
    this.#console = new Console({ stdout: this.#stdout, stderr: this.#stderr });
  }

  #log(std: STD_FD, raw: boolean, ...msg: unknown[]) {
    let logger: (...data: unknown[]) => void;
    let stream: NodeJS.WritableStream & { isTTY?: boolean };
    switch (std) {
      case STD_FD.OUT:
        logger = this.#console.log;
        stream = this.#stdout;
        break;
      case STD_FD.ERR:
        logger = this.#console.error;
        stream = this.#stderr;
        break;
    }

    if (msg[0] && typeof msg[0] === 'string') {
      logger(
        `${this.#spaces}${stream.isTTY ? msg[0] : stripAnsi(msg[0] as string)}`,
        ...msg.slice(1).map((el) =>
          (typeof el !== 'string'
            ? inspect(el, {
                colors: stream.isTTY,
                breakLength: 60,
              })
            : el.toString()
          )
            .split('\n')
            .map(
              (el: string, index: number) =>
                `${
                  index === 0
                    ? ''
                    : this.#spaces +
                      ' '.repeat(stripAnsi(msg[0] as string).length + 1)
                }${el}`
            )
            .map((el) => (stream.isTTY ? el : stripAnsi(el)))
            .join('\n')
        )
      );
    } else {
      logger(
        ...msg.map((el) =>
          (typeof el !== 'string'
            ? inspect(el, { colors: stream.isTTY, breakLength: 60 })
            : el.toString()
          )
            .split('\n')
            .map(
              (el: string, index: number) =>
                `${index === 0 ? '' : this.#spaces}${el}`
            )
            .map((el) => (stream.isTTY ? el : stripAnsi(el)))
            .join('\n')
        )
      );
    }
  }
  write(...msg: unknown[]) {
    this.#log(STD_FD.OUT, true, ' ', ...msg);
  }
  log(...msg: unknown[]) {
    this.#log(STD_FD.ERR, true, ' ', ...msg);
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
  dimmed_log(...msg: unknown[]) {
    this.#log(STD_FD.ERR, false, chalk.gray.dim('>'), chalk.gray.dim(...msg));
  }
  dimmed_error(...msg: unknown[]) {
    this.#log(STD_FD.ERR, false, chalk.gray.dim('>'), chalk.gray.dim(...msg));
  }
  empty(fd: 'stdout' | 'stderr' = 'stdout') {
    if (fd === 'stdout') {
      this.#log(STD_FD.OUT, true);
    } else {
      this.#log(STD_FD.ERR, true);
    }
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
