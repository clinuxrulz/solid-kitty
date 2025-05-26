import { Cont } from "./Cont";
import { do_, exec, read } from "./cont-do";


export const nop = Cont.nop;

export function callCC(fn: (k: Cont<void>) => void): void {
  exec(Cont.callCC((k) => do_(() => fn(k()))));
}

export type Label = () => Cont<void>;

let nextFrame_: (k: Cont<void>) => void = () => {};
export function provideNextFrame(nextFrame: (k: Cont<void>) => void): (cb: () => void) => void {
  return (cb) => {
    let outer = nextFrame_;
    try {
      outer = nextFrame;
      cb();
    } finally {
      nextFrame_ = outer;
    }
  }
}

export function nextFrame() {
  exec(Cont.callCC((k) => {
    nextFrame_(k());
    return Cont.of((_) => {});
  }));
}

export function makeLabel(): Label {
  let label = nop;
  callCC((k) => label = k);
  return () => label;
}

export function goto(label: Label): void {
  exec(Cont.of((k) => label().run(k)));
}

export function while_(cond: Cont<boolean> | (() => boolean)): (body: () => void) => void {
  if (typeof cond == "function") {
    let cond2 = cond;
    cond = Cont.of((k) => k(cond2()));
  }
  return (body) => {
    let loopStart = makeLabel();
    read(
      cond,
      (cond) =>
        cond ?
          do_(() => {
            body();
            goto(loopStart);
          }) :
          nop
    );
  };
}

export function sideEffect(cb: () => void) {
  exec(Cont.of((k) => { cb(); k(); }));
}
