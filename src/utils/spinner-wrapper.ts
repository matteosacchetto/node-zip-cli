import chalk from 'chalk';
import ora, { type Ora } from 'ora';

export const spinner_wrapper = async <
  T extends () => PromiseLike<unknown>,
  R extends ReturnType<T>,
>({
  spinner_text,
  success_text,
  fail_text,
  fn,
}: {
  spinner_text: string;
  success_text?: string;
  fail_text?: string;
  fn: (spinner: Ora) => R;
}) => {
  const spinner = ora(spinner_text);
  try {
    spinner.start();
    const res = await fn(spinner);
    spinner.succeed(success_text);
    return res;
  } catch (e) {
    spinner.fail(fail_text);
    throw e;
  }
};

export const scoped_spinner_wrapper = async <
  T extends () => PromiseLike<unknown>,
  R extends ReturnType<T>,
>({
  scope,
  message,
  fn,
}: {
  scope: string;
  message: string;
  fn: (spinner: Ora) => R;
}) => {
  return await spinner_wrapper({
    spinner_text: `${chalk.bold(scope)} ${chalk.dim(message)}`,
    success_text: `${chalk.bold(scope)} ${chalk.green(message)}`,
    fail_text: `${chalk.bold(scope)} ${chalk.red(message)}`,
    fn,
  });
};
