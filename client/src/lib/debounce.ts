// utils/debounce.ts
export const debounce=<T extends (...args: any[]) => void>(
  fn: T,
  delay: number,
  options: { leading?: boolean; trailing?: boolean } = { trailing: true }
): ((...args: Parameters<T>) => void) =>{
  let timeout: NodeJS.Timeout | null;
  let lastArgs: Parameters<T> | null = null;
  let called = false;

  const { leading = false, trailing = true } = options;

  return function (...args: Parameters<T>) {
    lastArgs = args;

    if (!timeout) {
      if (leading && !called) {
        fn(...args);
        called = true;
      }

      timeout = setTimeout(() => {
        if (trailing && lastArgs) {
          fn(...lastArgs);
        }
        timeout = null;
        called = false;
        lastArgs = null;
      }, delay);
    } else {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        if (trailing && lastArgs) {
          fn(...lastArgs);
        }
        timeout = null;
        called = false;
        lastArgs = null;
      }, delay);
    }
  };
}