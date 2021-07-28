import {
  assertEquals,
  assertObjectMatch,
} from "https://deno.land/std@0.103.0/testing/asserts.ts";

import { create, helpers } from "./main.ts";

Deno.test("test1", async () => {
  const given = 1;
  const pipe = create<number>();

  const adder = (state: number, next: any) => {
    state = state + 10;
    next(state);
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

  const corser = (state: http, next: Function) => {
    console.log("corser", state);
    const res = state.res;
    const headers = {
      "cors": "*",
      "x-stuff": true,
    };
    next({ ...state, res: { ...res, headers } });
  };

  pipe.use(helpers.toMiddleware(
    (state: http) => {
      console.log("add body", state);
      const res = state.res;
      const body = { hello: "world" };
      return { ...state, res: { ...res, body } };
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
    (_state: http) => {
      throw new Error("Error here");
    },
  ));

  const corser = (state: http, next: Function) => {
    const res = state.res;
    const headers = {
      "cors": "*",
      "x-stuff": true,
    };
    next({ ...state, res: { ...res, headers } });
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
    (state: http) => {
      try {
        throw new Error("Error here");
      } catch (e) {
        console.log(e.message);
        return state;
      }
    },
  ));

  const corser = (state: http, next: Function) => {
    const res = state.res;
    const headers = {
      "cors": "*",
      "x-stuff": true,
    };
    next({ ...state, res: { ...res, headers } });
  };

  pipe.use(corser);

  const final = await helpers.run<http, http>(given, pipe, (e, state) => {
    return state;
  });

  assertObjectMatch(final || {}, {
    req: { body: { payload: "1" } },
    res: {
      headers: { cors: "*" },
    },
  });
});
