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
  pipe.use((state, next) => {
    const payload = "yow";
    next({ ...state, payload });
  });

  const res = await helpers.run<Event<string>, Response<string>>(
    {
      queryParams: [],
      payload: "",
    },
    pipe,
    (err, state) => {
      if (err) {
        return { statusCode: 500, headers: [], body: "" };
      }
      return {
        statusCode: 200,
        headers: [],
        body: state.payload,
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
  pipe.use((state, next) => {
    const payload = "yow";
    next({ ...state, payload });
  });
  pipe.use((_state, _next) => {
    throw new Error("Forced err.");
  });

  const res = await helpers.run<Event<string>, Response<string>>(
    {
      queryParams: [],
      payload: "",
    },
    pipe,
    (err, state) => {
      if (err) {
        return { statusCode: 500, headers: [], body: err.message };
      }
      return {
        statusCode: 200,
        headers: [],
        body: state.payload,
      };
    },
  );

  assertEquals(res, { statusCode: 500, headers: [], body: "Forced err." });
});

Deno.test("de test - body parser", async () => {
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

  function bodyParser(state: Event<string>, next: Function) {
    const { payload } = state;
    const objPayload = JSON.parse(payload);
    next({ ...state, payload: objPayload });
  }

  const pipe = create<Event<string>>();

  pipe.use(bodyParser);

  const givenPayload = JSON.stringify({ hello: "World" });

  // FIX: this type is lying
  const res = await helpers.run<Event<string>, Response<string>>(
    {
      queryParams: [],
      payload: givenPayload,
    },
    pipe,
    (err, state) => {
      if (err) {
        return { statusCode: 500, headers: [], body: "" };
      }
      return {
        statusCode: 200,
        headers: [],
        body: state.payload,
      };
    },
  );

  assertEquals(res, { statusCode: 200, headers: [], body: { hello: "World" } });
});
