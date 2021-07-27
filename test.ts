import { assertEquals } from "https://deno.land/std@0.103.0/testing/asserts.ts";

Deno.test("test1", async () => {
  const given = 1;
  const pipe = newPipe<number>();

  const adder = (ctx: number, next: any) => {
    ctx = ctx + 10;
    next(ctx);
  };

  pipe.use(adder);
  const final = await pipe.execute(given);

  assertEquals(given + 10, final);
});

Deno.test("test1", async () => {
  const given = {
    req: {
      body: {},
      queryParams: {},
    },
    res: {},
  };
  type http = {
    req: any;
    res: any;
  };
  const pipe = newPipe<http>();

  const corser = (ctx: http, next: Function) => {
    const res = ctx.res;
    const headers = {
      "cors": "*",
      "x-stuff": true,
    };
    next({ ...ctx, res: { ...res, headers } });
  };

  pipe.handler((ctx: http) => {
    const res = ctx.res;
    const body = { hello: "world" };
    return { ...ctx, res: { ...res, body } };
  });

  pipe.use(corser);
  console.log("--- given", given);
  const final = await pipe.execute(Object.freeze(given));
  console.log("--- given", given);
  console.log("--- final", final);

  assertEquals(given, final);
});

type Next<T> = (ctx: T) => Promise<T> | T;
type Middleware<T> = (
  context: T,
  next: Next<T>,
) => Promise<void> | void | T | Promise<T>;
type Pipeline<T> = {
  use: (...midlewares: Middleware<T>[]) => void;
  handler: (fn: (ctx: T) => Promise<T> | T) => void;
  execute: (context: T) => Promise<T>;
};

function newPipe<T>(): Pipeline<T> {
  const stack: Middleware<T>[] = [];
  let context: T;
  return {
    use: (...middlewares: Middleware<T>[]) => {
      stack.push(...middlewares);
    },
    handler: (fn) => {
      stack.push(async (ctx, next) => {
        const result = await fn(ctx);
        next(result);
      });
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
