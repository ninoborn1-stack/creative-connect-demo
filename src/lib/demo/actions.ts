// Server Actions laufen in der Browser-Demo als normale async-Funktionen. Der Wrapper übersetzt
// redirect()/notFound() in Client-Navigation und lädt danach alle Ansichten neu (wie revalidatePath).
import { emitRefresh, navSignal, navigate } from "./events";

let depth = 0;

export function wrapAction<A extends unknown[], R>(fn: (...args: A) => Promise<R> | R) {
  return async function demoAction(this: unknown, ...args: A): Promise<R | undefined> {
    depth++;
    try {
      return await fn.apply(this, args);
    } catch (e) {
      // verschachtelter Aufruf (Action ruft Action): Signal an den äußeren Wrapper weiterreichen
      if (depth > 1) throw e;
      const signal = navSignal(e);
      if (signal?.type === "redirect") {
        navigate(signal.url, signal.mode);
        return undefined;
      }
      throw e;
    } finally {
      depth--;
      emitRefresh();
    }
  };
}
