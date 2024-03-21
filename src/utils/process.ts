import { logger } from '@/logger';
import { log_indent } from './log';

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
