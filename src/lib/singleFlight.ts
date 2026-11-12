/** Coalesce concurrent refreshes; settled results are never cached. */
export function singleFlight<T>(operation: () => Promise<T>): () => Promise<T> {
  let pending: Promise<T> | undefined;
  return () => {
    if (pending) return pending;
    pending = Promise.resolve().then(operation).finally(() => { pending = undefined; });
    return pending;
  };
}