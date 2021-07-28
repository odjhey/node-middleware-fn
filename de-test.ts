// developer-experience

import { assertEquals } from "https://deno.land/std@0.103.0/testing/asserts.ts";

import { create, helpers } from "./main.ts";

Deno.test("de test", async () => {
  type None = undefined;
  type Event<T> = {
    queryParams: Record<string, string>[];
    payload: T;
  };

  type Response<T> = {
    statusCode: number;
    headers: Record<string, string>[];
    body: T;
  };

  const pipe = create<Event<string>>();
  pipe.use((ctx, next) => {
    const payload = "yow";
    next({ ...ctx, payload });
  });

  const res = await helpers.run<Event<string>, Response<string>>(
    {
      queryParams: [],
      payload: "",
    },
    pipe,
    (err, ctx) => {
      if (err) {
        return { statusCode: 500, headers: [], body: "" };
      }
      return {
        statusCode: 200,
        headers: [],
        body: ctx.payload,
      };
    },
  );

  assertEquals(res, { statusCode: 200, headers: [], body: "yow" });
});

Deno.test("de test - err", async () => {
  type None = undefined;
  type Event<T> = {
    queryParams: Record<string, string>[];
    payload: T;
  };

  type Response<T> = {
    statusCode: number;
    headers: Record<string, string>[];
    body: T;
  };

  const pipe = create<Event<string>>();
  pipe.use((ctx, next) => {
    const payload = "yow";
    next({ ...ctx, payload });
  });
  pipe.use((_ctx, _next) => {
    throw new Error("Forced err.");
  });

  const res = await helpers.run<Event<string>, Response<string>>(
    {
      queryParams: [],
      payload: "",
    },
    pipe,
    (err, ctx) => {
      if (err) {
        return { statusCode: 500, headers: [], body: err.message };
      }
      return {
        statusCode: 200,
        headers: [],
        body: ctx.payload,
      };
    },
  );

  assertEquals(res, { statusCode: 500, headers: [], body: "Forced err." });
});
