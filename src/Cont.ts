import { Accessor, createComputed, createMemo, mapArray } from "solid-js";

export class Cont<A> {
  private fn: (k: (a: A) => void) => void;

  private constructor(fn: (k: (a: A) => void) => void) {
    this.fn = fn;
  }

  static of<A>(fn: (k: (a: A) => void) => void): Cont<A> {
    return new Cont(fn);
  }

  static ofCC<A>(a: Accessor<A[]>): Cont<A> {
    return Cont.of((k: (a: A) => void) =>
      createMemo(mapArray(a, (a: A) => k(a))),
    );
  }

  /**
   * Creates a computed and lifts it into a Cont.
   * @param cb the callback to use inside the computed, the callback returns what will be passed to the continuation.
   * @returns `Cont<A>`
   */
  static liftCC<A>(cb: () => A): Cont<A> {
    return Cont.of((k: (a: A) => void) => createComputed(() => k(cb())));
  }

  /**
   * Creates a computed mapArray and lifts it into a Cont.
   * @param a the accessor of an array to feed to mapArray
   * @returns `Cont<A>`
   */
  static liftCCMAA<A>(a: Accessor<A[]>): Cont<A> {
    return Cont.of((k: (a: A) => void) => createComputed(mapArray(a, k)));
  }

  map<B>(fn: (a: A) => B): Cont<B> {
    return Cont.of((k: (b: B) => void) => this.fn((a) => k(fn(a))));
  }

  filterNonNullable(): Cont<NonNullable<A>> {
    return Cont.of((k: (a: NonNullable<A>) => void) =>
      this.fn((a) => {
        if (a !== undefined && a !== null) {
          k(a);
        }
      }),
    );
  }

  then<B>(fn: (a: A) => Cont<B>): Cont<B> {
    return Cont.of((k) => this.run((a) => fn(a).run(k)));
  }

  thenCont<B>(fn: (a: A, k: (b: B) => void) => void): Cont<B> {
    return this.then((a) => Cont.of((k) => fn(a, k)));
  }

  thenContCC<B>(fn: (a: A) => Accessor<B[]>): Cont<B> {
    return this.thenCont((a: A, k: (b: B) => void) =>
      createMemo(mapArray(fn(a), (b: B) => k(b))),
    );
  }

  thenContCCCC<B>(fn: (a: A) => Accessor<Accessor<B[]>[]>): Cont<B> {
    return this.thenCont((a: A, k: (b: B) => void) =>
      createMemo(
        mapArray(fn(a), (b: Accessor<B[]>) =>
          createMemo(mapArray(b, (b2) => k(b2))),
        ),
      ),
    );
  }

  run(k?: (a: A) => void) {
    this.fn(k ?? (() => {}));
  }
}

/*
Example:

let [ value1, setValue1, ] = createSignal(1);
let [ value2, setValue2, ] = createSignal(1);
let [ value3, setValue3, ] = createSignal(1);

function example() {
    Cont.of<number>
        ((k) => {
            createComputed(() =>
                k(value1() + 5)
            );
        })
        .thenCont<number>((a, k) => {
            createComputed(() =>
                k(a + value2() * 2)
            );
        })
        .thenCont<number>((a, k) => {
            createComputed(() =>
                k(a + value3() - 1)
            );
        })
        .run();
}
*/
