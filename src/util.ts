import { Accessor, createMemo, createRoot, onCleanup } from "solid-js";
import { getOwner } from "solid-js/web";

export function makeRefCountedMakeReactiveObject<A>(
    fn: () => A,
    cleanup?: () => void,
): () => A {
    let cache: Accessor<A> | undefined = undefined;
    let dispose: () => void = () => {};
    let refCount = 0;
    return () => {
        if (getOwner() == undefined) {
            return fn();
        }
        if (cache == undefined) {
            let { cache: cache2, dispose: dispose2 } = createRoot((dispose) => {
                return {
                    cache: createMemo(fn),
                    dispose,
                };
            });
            cache = cache2;
            dispose = dispose2;
            refCount = 1;
        } else {
            ++refCount;
        }
        onCleanup(() => {
            if (--refCount == 0) {
                dispose();
                dispose = () => {};
                cleanup?.();
                cache = undefined;
            }
        });
        return cache();
    };
}

export class NoTrack<A> {
    value: A;
    constructor(value: A) {
        this.value = value;
    }
}
