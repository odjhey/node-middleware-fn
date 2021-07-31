# Do not use this, not sure what value it brings yet over below libs that have better implementation and more adoption
## Use these instead
- https://www.npmjs.com/package/middy
- https://github.com/wooorm/trough
- https://ramdajs.com/docs/#compose or pipe
- https://gcanti.github.io/fp-ts/modules/function.ts.html#flow
- https://sanctuary.js.org/#compose or pipe	
- or just plain Promises, after all, this looks like just a bad monad implementation

## Reference (WIP)
So you're still interested eh? See below.

### `#create<T>: () => Pipeline<T>`
where `T` is the type of `state`.

### `Pipeline<T>#use: (Middleware<T> | Middleware<T>[]) => void`
where `T` is the type of `state`.

### `type Middleware<T>: (T, Next) => Promise<void> | void | Promise<T> | T`
where `T` is the type of `state`. and the `Next` fn should be called

This is the core, thinking of changing this to `(state, ctx, next)`  
where `state` is mutable and dynamic, and  
`ctx` is immutable

This begs the question of 'do we allow middlewares to update context?'  
like should the `bodyParser` update the `ctx.req` or add to the `state`

## TODO
- [ ] figure a way to chain fns preserving types along the way


## Musings
- [ ] remove `Next` and change to `ctx` where `ctx` has `ctx#next`
- [ ] try chain, ie, pipe.use().use().use().use(), this way, we can infer types
