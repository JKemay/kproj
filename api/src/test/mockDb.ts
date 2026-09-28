// A minimal stand-in for a Drizzle query builder.
//
// Real call sites chain an arbitrary sequence of .from()/.where()/.orderBy()/
// .limit()/.groupBy()/.leftJoin()/.values()/.set() and then either await the
// chain directly or call .returning() on it. Modeling Drizzle's actual
// builder types would be a project of its own, so instead every chain method
// here just returns the same object (so any chain shape resolves) and the
// object is itself thenable, resolving to whatever rows the test configured.
//
// This means a mocked db doesn't apply `where`/`limit`/etc. — it always
// returns the exact rows a test hands it. Tests that need to assert *which*
// filter reached the DB (e.g. the Heaven `ne()` clause in /media/recent)
// inspect the recorded call args on the relevant vi.fn() instead.
import { vi } from 'vitest';

export interface Chain<T> extends PromiseLike<T> {
  from: ReturnType<typeof vi.fn>;
  where: ReturnType<typeof vi.fn>;
  limit: ReturnType<typeof vi.fn>;
  orderBy: ReturnType<typeof vi.fn>;
  groupBy: ReturnType<typeof vi.fn>;
  leftJoin: ReturnType<typeof vi.fn>;
  innerJoin: ReturnType<typeof vi.fn>;
  values: ReturnType<typeof vi.fn>;
  set: ReturnType<typeof vi.fn>;
  returning: ReturnType<typeof vi.fn>;
}

export function queryChain<T>(value: T): Chain<T> {
  const resolved = Promise.resolve(value);
  const chain = {} as Chain<T>;
  chain.from = vi.fn(() => chain);
  chain.where = vi.fn(() => chain);
  chain.limit = vi.fn(() => chain);
  chain.orderBy = vi.fn(() => chain);
  chain.groupBy = vi.fn(() => chain);
  chain.leftJoin = vi.fn(() => chain);
  chain.innerJoin = vi.fn(() => chain);
  chain.values = vi.fn(() => chain);
  chain.set = vi.fn(() => chain);
  chain.returning = vi.fn(() => resolved);
  chain.then = resolved.then.bind(resolved) as Chain<T>['then'];
  return chain;
}

export interface MockDb {
  select: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
}

export function createMockDb(): MockDb {
  return {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}
