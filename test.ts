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
  // const final = await pipe.execute(given);
  const final = await helpers.run(given, pipe);

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
    console.log("corser", ctx);
    const res = ctx.res;
    const headers = {
      "cors": "*",
      "x-stuff": true,
    };
    next({ ...ctx, res: { ...res, headers } });
  };

  pipe.use(helpers.toMiddleware(
    (ctx: http) => {
      console.log("add body", ctx);
      const res = ctx.res;
      const body = { hello: "world" };
      return { ...ctx, res: { ...res, body } };
    },
  ));

  pipe.use(corser);
  // const final = await pipe.execute(Object.freeze(given));
  const final = await helpers.run<http, http>(given, pipe);

  assertObjectMatch(final.res, {
    body: {
      hello: "world",
    },
    headers: { cors: "*", "x-stuff": true },
  });
});

Deno.test("test - reject handler", async () => {
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

  pipe.use(helpers.toMiddleware(
    (_ctx: http) => {
      throw new Error("Error here");
    },
  ));

  const corser = (ctx: http, next: Function) => {
    const res = ctx.res;
    const headers = {
      "cors": "*",
      "x-stuff": true,
    };
    next({ ...ctx, res: { ...res, headers } });
  };
  pipe.use(corser);
  const final = await helpers.run<http, http>(given, pipe, (e) => {
    return { req: {}, res: {} };
  });

  assertObjectMatch(final.res, {});
});

Deno.test("test - endHandler should not be called", async () => {
  const given = {
    req: {
      body: { payload: "1" },
      queryParams: {},
    },
    res: {},
  };
  type http = {
    req: any;
    res: any;
  };
  const pipe = create<http>();

  pipe.use(helpers.toMiddleware(
    (ctx: http) => {
      try {
        throw new Error("Error here");
      } catch (e) {
        console.log(e.message);
        return ctx;
      }
    },
  ));

  const corser = (ctx: http, next: Function) => {
    const res = ctx.res;
    const headers = {
      "cors": "*",
      "x-stuff": true,
    };
    next({ ...ctx, res: { ...res, headers } });
  };

  pipe.use(corser);

  const final = await helpers.run<http, http>(given, pipe, (e, ctx) => {
    return ctx;
  });

  assertObjectMatch(final || {}, {
    req: { body: { payload: "1" } },
    res: {
      headers: { cors: "*" },
    },
  });
});
