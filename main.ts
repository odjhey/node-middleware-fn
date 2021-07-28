type None = undefined;
type Maybe<T> = T | None;

type Next<T> = (ctx: T) => Promise<T> | T;
type Middleware<T> = (
  context: T,
  next: Next<T>,
) => Promise<void> | void | T | Promise<T>;
type Pipeline<T> = {
  use: (...midlewares: Middleware<T>[]) => void;
  getIter: () => {
    next: () => { middleware: Maybe<Middleware<T>>; hasNext: boolean };
  };
};

const helpers = {
  toMiddleware: <T>(fn: (ctx: T) => T) =>
    (ctx: T, next: Next<T>) => {
      next(fn(ctx));
    },
  run: async <T, Result>(
    ctx: T,
    pipeline: Pipeline<T>,
    endHandler?: (e: Maybe<Error>, ctx: T) => Promise<Result> | Result
  ) => {
    try {
      let context = ctx;
      const iter = pipeline.getIter();
      while (true) {
        const { middleware } = iter.next();
        if (middleware) {
          await middleware(context, (ctx: T) => {
            context = ctx;
            return context;
          });
        } else {
          break;
        }
      }
      if(endHandler){
        return await endHandler(undefined, context);
      }
      return context
    } catch (e) {
      if (endHandler) {
        return await endHandler(e, ctx);
      }
      throw e;
    }
  },
};

function create<T>(): Pipeline<T> {
  const stack: Middleware<T>[] = [];
  return {
    use: (...middlewares: Middleware<T>[]) => {
      stack.push(...middlewares);
    },
    getIter: () => {
      let prevIdx = -1;
      return {
        next: () => {
          const hasNext = prevIdx + 1 < (stack.length - 1);
          prevIdx++;
          return { hasNext, middleware: stack[prevIdx - 1 + 1] };
        },
      };
    },
  };
}

export { create, helpers };
