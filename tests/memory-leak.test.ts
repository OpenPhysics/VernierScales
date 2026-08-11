/**
 * Fleet-standard memory-leak regression suite.
 *
 * Creates a disposable AXON Property inside a function boundary, disposes it,
 * forces garbage collection via global.gc (--expose-gc in vitest.config.ts), then
 * asserts via WeakRef that the object was collected. V8 requires a function
 * boundary (not merely a block scope) so local strong references die when the
 * helper returns.
 *
 * The fixture is a NumberProperty — the reactive primitive every model in this
 * sim is built from — so the regression covers the exact dispose path the
 * screens rely on, rather than a stand-in object invented for the test.
 */

import { NumberProperty } from "scenerystack/axon";
import { describe, expect, it } from "vitest";

/**
 * Force garbage collection with multiple passes. When `earlyExitRefs` is supplied
 * the loop bails as soon as every referenced object is confirmed collected. The
 * setTimeout(0) yield after a live deref() avoids the WeakRef macrotask-liveness pin.
 * Without early-exit refs the loop always runs all passes, which on a slow `gc()`
 * can exceed the Vitest testTimeout — always pass refs when you have them.
 */
async function forceGC(earlyExitRefs?: WeakRef<object> | readonly WeakRef<object>[]): Promise<void> {
  const refs = earlyExitRefs === undefined ? [] : Array.isArray(earlyExitRefs) ? earlyExitRefs : [earlyExitRefs];
  for (let i = 0; i < 15; i++) {
    globalThis.gc?.();
    await new Promise<void>((r) => setTimeout(r, 50));
    if (refs.length > 0 && refs.every((ref) => ref.deref() === undefined)) {
      return;
    }
    if (refs.length > 0) {
      await new Promise<void>((r) => setTimeout(r, 0));
    }
  }
}

function createAndDisposeProperty(): WeakRef<object> {
  const property = new NumberProperty(0);
  const ref = new WeakRef<object>(property);
  property.dispose();
  return ref;
}

describe("Memory leak regression", () => {
  it("global.gc is available (--expose-gc)", () => {
    expect(globalThis.gc).toBeDefined();
  });

  it("sanity: plain object is collected", async () => {
    const ref = (() => new WeakRef({ hello: "world" }))();
    await forceGC(ref);
    expect(ref.deref()).toBeUndefined();
  });

  it("a disposed NumberProperty is collected", async () => {
    const ref = createAndDisposeProperty();
    await forceGC(ref);
    expect(ref.deref()).toBeUndefined();
  });

  it("double dispose() does not throw", () => {
    const property = new NumberProperty(0);
    property.dispose();
    expect(() => property.dispose()).not.toThrow();
  });

  it("repeated create/dispose cycles leave no survivors", async () => {
    const refs: WeakRef<object>[] = [];
    for (let i = 0; i < 10; i++) {
      refs.push(createAndDisposeProperty());
    }
    await forceGC(refs);
    const survivors = refs.filter((r) => r.deref() !== undefined).length;
    expect(survivors).toBe(0);
  });
});
