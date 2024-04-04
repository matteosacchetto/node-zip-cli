import { logger } from '@/logger';
import { log_indent } from './log';

/* c8 ignore start */
export const exit_success_on_error_ignore = async <T extends unknown[], R>(
  fn: (...params: T) => R,
  ...params: T
): Promise<R> => {
  try {
    return await fn(...params);
  } catch (e) {
    process.exit(0);
  }
};

export const exit_success = async <T extends unknown[], R>(
  fn: (...params: T) => R,
  ...params: T
) => {
  try {
    await fn(...params);
  } catch (e) {
    log_indent({
      fn: () => {
        logger.dimmed_error(e instanceof Error ? e.message : e);
      },
    });
  } finally {
    process.exit(0);
  }
};

export const exit_fail = async <T extends unknown[], R>(
  fn: (...params: T) => R,
  ...params: T
) => {
  try {
    await fn(...params);
  } catch (e) {
    log_indent({
      fn: () => {
        logger.dimmed_error(e instanceof Error ? e.message : e);
      },
    });
  } finally {
    process.exit(1);
  }
};

export const exit_success_on_error = async <T extends unknown[], R>(
  fn: (...params: T) => R,
  ...params: T
) => {
  try {
    await fn(...params);
  } catch (e) {
    log_indent({
      fn: () => {
        logger.dimmed_error(e instanceof Error ? e.message : e);
      },
    });
    process.exit(0);
  }
};

export const exit_fail_on_error = async <T extends unknown[], R>(
  fn: (...params: T) => R,
  ...params: T
) => {
  try {
    await fn(...params);
  } catch (e) {
    log_indent({
      fn: () => {
        logger.dimmed_error(e instanceof Error ? e.message : e);
      },
    });
    process.exit(2);
  }
};

export const exit_success_on_false = async <
  T extends unknown[],
  R extends Promise<boolean>,
>(
  fn: (...params: T) => R,
  ...params: T
) => {
  if (!(await fn(...params))) {
    process.exit(0);
  }
};

export const exit_on_finish = async <T extends unknown[], R>(
  fn: (...params: T) => R,
  ...params: T
) => {
  try {
    await fn(...params);
    process.exit(0);
  } catch (e) {
    log_indent({
      fn: () => {
        logger.dimmed_error(e instanceof Error ? e.message : e);
      },
    });
    process.exit(1);
  }
};

export const ignore_on_error = async <T extends unknown[], R>(
  fn: (...params: T) => R,
  ...params: T
) => {
  try {
    await fn(...params);
  } catch (e) {
    // Ignore
  }
};
/* c8 ignore end */