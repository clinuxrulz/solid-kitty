import { Accessor, createMemo, mapArray } from "solid-js";

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
