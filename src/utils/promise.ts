export function defer<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  // biome-ignore lint/suspicious/noExplicitAny: here is ok to have any
  let reject!: (reason?: any) => void;

  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  return { promise, resolve, reject };
}
