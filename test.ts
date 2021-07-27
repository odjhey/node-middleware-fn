import {
  assertEquals,
  assertObjectMatch,
} from "https://deno.land/std@0.103.0/testing/asserts.ts";

import { create, helpers } from "./main.ts";

Deno.test("test1", async () => {
  const given = 1;
  const pipe = create<number>();

  const adder = (ctx: number, next: any) => {
    ctx = ctx + 10;
    next(ctx);
  };

  pipe.use(adder);
  const final = await pipe.execute(given);

  assertEquals(given + 10, final);
});

Deno.test("test2", async () => {
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
  const pipe = create<http>();

  const corser = (ctx: http, next: Function) => {
    const res = ctx.res;
    const headers = {
      "cors": "*",
      "x-stuff": true,
    };
    next({ ...ctx, res: { ...res, headers } });
  };

  pipe.use(helpers.toMiddleware(
    (ctx: http) => {
      const res = ctx.res;
      const body = { hello: "world" };
      return { ...ctx, res: { ...res, body } };
    },
  ));

  pipe.use(corser);
  const final = await pipe.execute(Object.freeze(given));

  assertObjectMatch(final.res, {
    headers: { cors: "*", "x-stuff": true },
    body: {
      hello: "world",
    },
  });
});
