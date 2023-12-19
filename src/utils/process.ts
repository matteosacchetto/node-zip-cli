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
