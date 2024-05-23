export function defer<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  // biome-ignore lint/suspicious/noExplicitAny: official type of the Promise reject function
  let reject!: (reason?: any) => void;

  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });

  return { promise, resolve, reject };
}
