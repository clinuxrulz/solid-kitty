export class Cont<A> {
    private fn: (k: (a: A) => void) => void;

    private constructor(fn: (k: (a: A) => void) => void) {
        this.fn = fn;
    }

    static of<A>(fn: (k: (a: A) => void) => void): Cont<A> {
        return new Cont(fn);
    }

    then<B>(fn: (a: A) => Cont<B>): Cont<B> {
        return Cont.of((k) => this.run((a) => fn(a).run(k)));
    }

    thenCont<B>(fn: (a: A, k: (b: B) => void) => void): Cont<B> {
        return this.then((a) => Cont.of((k) => fn(a, k)));
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
