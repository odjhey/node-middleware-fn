type Next<T> = (ctx: T) => Promise<T> | T;
type Middleware<T> = (
  context: T,
  next: Next<T>,
) => Promise<void> | void | T | Promise<T>;
type Pipeline<T> = {
  use: (...midlewares: Middleware<T>[]) => void;
  execute: (context: T) => Promise<T>;
};

const helpers = {
  toMiddleware: <T>(fn: (ctx: T) => T) =>
    (ctx: T, next: Next<T>) => {
      next(fn(ctx));
    },
};

function create<T>(): Pipeline<T> {
  const stack: Middleware<T>[] = [];
  let context: T;
  return {
    use: (...middlewares: Middleware<T>[]) => {
      stack.push(...middlewares);
    },
    execute: async (ctx: T) => {
      context = ctx;
      let prevIdx = -1;
      const runner = async (index: number) => {
        if (index === prevIdx) {
          throw new Error("Problem with your middlewares error.");
        }
        prevIdx = index;
        const middleware = stack[index];

        if (middleware) {
          await middleware(context, (ctx: T) => {
            context = ctx;
            return runner(index + 1);
          });
        }

        return context;
      };
      return await runner(0);
    },
  };
}

export { create, helpers };
