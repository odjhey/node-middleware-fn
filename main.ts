type None = undefined;
type Maybe<T> = T | None;

type Next<T> = (state: T) => Promise<T> | T;
type Middleware<T> = (
  state: T,
  next: Next<T>,
) => Promise<void> | void | T | Promise<T>;
type Pipeline<T> = {
  use: (...midlewares: Middleware<T>[]) => void;
  getIter: () => {
    next: () => { middleware: Maybe<Middleware<T>>; hasNext: boolean };
  };
};

const helpers = {
  toMiddleware: <T>(fn: (state: T) => T) =>
    (state: T, next: Next<T>) => {
      next(fn(state));
    },
  run: async <T, Result>(
    state: T,
    pipeline: Pipeline<T>,
    endHandler?: (e: Maybe<Error>, state: T) => Promise<Result> | Result
  ) => {
    try {
      let newState = state;
      const iter = pipeline.getIter();
      while (true) {
        const { middleware } = iter.next();
        if (middleware) {
          await middleware(newState, (state: T) => {
            newState = state;
            return state;
          });
        } else {
          break;
        }
      }
      if(endHandler){
        return await endHandler(undefined, newState);
      }
      return newState
    } catch (e) {
      if (endHandler) {
        return await endHandler(e, state);
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
