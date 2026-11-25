import type {Ref, RefCallback} from "react";

import {useMemo} from "react";

/** Merges several refs (object or callback) into one callback ref. */
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> {
  return (value) => {
    const cleanups: Array<() => void> = [];

    for (const ref of refs) {
      if (typeof ref === "function") {
        const cleanup = ref(value);

        if (typeof cleanup === "function") cleanups.push(cleanup);
      } else if (ref) {
        (ref as {current: T | null}).current = value;
      }
    }

    if (cleanups.length) return () => cleanups.forEach((cleanup) => cleanup());
  };
}

/** Merges a forwarded ref with a local ref into a stable callback ref. */
export function useMergedRef<T>(forwarded: Ref<T> | undefined, local: Ref<T>): RefCallback<T> {
  return useMemo(() => mergeRefs(forwarded, local), [forwarded, local]);
}
