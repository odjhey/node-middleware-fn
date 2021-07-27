type None = undefined;
type Maybe<T> = T | None;
type Next<T> = (ctx: T) => Promise<T> | T;
type Middleware<T> = (
  context: T,
  next: Next<T>,
) => Promise<void> | void | T | Promise<T>;
type Pipeline<T> = {
  use: (...midlewares: Middleware<T>[]) => void;
  getIter: () => () => { value: Maybe<Middleware<T>>; hasNext: boolean };
};

const helpers = {
  toMiddleware: <T>(fn: (ctx: T) => T) =>
    (ctx: T, next: Next<T>) => {
      next(fn(ctx));
    },
  run: async <T>(ctx: T, pipeline: Pipeline<T>) => {
    let context = ctx;

    const iter = pipeline.getIter();
    while (true) {
      const { value: middleware } = iter();
      if (middleware) {
        await middleware(context, (ctx: T) => {
          context = ctx;
          return context;
        });
      } else {
        break;
      }
    }
    return context;
  },
};

function create<T>(): Pipeline<T> {
  const stack: Middleware<T>[] = [];
  let context: T;
  return {
    use: (...middlewares: Middleware<T>[]) => {
      stack.push(...middlewares);
    },
    getIter: () => {
      let prevIdx = -1;
      return () => {
        const hasNext = prevIdx + 1 < (stack.length - 1);
        prevIdx++;
        return { hasNext, value: stack[prevIdx - 1 + 1] };
      };
    },
  };
}

export { create, helpers };
