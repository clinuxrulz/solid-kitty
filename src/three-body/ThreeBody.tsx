// A1(t) = (P2(t) - P1(t)) / sqrt((P2(t) - P1(t)).(P2(t) - P1(t)))^3 + (P3(t) - P1(t)) / sqrt((P3(t) - P1(t)).(P3(t) - P1(t)))^3
// A1(t)^2 = (P2(t) - P1(t))^2 / ((P2(t) - P1(t)).(P2(t) - P1(t)))^3 + (P3(t) - P1(t))^2 / ((P3(t) - P1(t)).(P3(t) - P1(t)))^3 + 2*(P2(t) - P1(t))*(P3(t) - P1(t)) / (sqrt((P2(t) - P1(t)).(P2(t) - P1(t)))^3*sqrt((P3(t) - P1(t)).(P3(t) - P1(t)))^3)
// let Q = P2(t) - P1(t)
// let R = P3(t) - P1(t)
// A1(t)^2 = Q^2 / (Q.Q)^3 + R^2 / (R.R)^3 + 2*Q*R / (sqrt(Q.Q)^3*sqrt(R.R)^3)
// 2*Q*R / (sqrt(Q.Q)^3*sqrt(R.R)^3) = A1(t)^2 - Q^2 / (Q.Q)^3 - R^2 / (R.R)^3
// sqrt(Q.Q)^3*sqrt(R.R)^3 = 2*Q*R / (A1(t)^2 - Q^2 / (Q.Q)^3 - R^2 / (R.R)^3)
// (Q.Q)^3*(R.R)^3 = (2*Q*R)^2 / ((A1(t)^2 - Q^2 / (Q.Q)^3 - R^2 / (R.R)^3))^2
// (Q.Q)^3*(R.R)^3*((A1(t)^2 - Q^2 / (Q.Q)^3 - R^2 / (R.R)^3))^2 = (2*Q*R)^2
// (Q.Q)^3*(R.R)^3*(A1(t)^2*(Q.Q)^3*(R.R)^3 - Q^2*(R.R)^3 - R^2*(Q.Q)^3)^2/((Q.Q)^6*(R.R)^6) = (2*Q*R)^2
// (A1(t)^2*(Q.Q)^3*(R.R)^3 - Q^2*(R.R)^3 - R^2*(Q.Q)^3)^2/((Q.Q)^3*(R.R)^3) = (2*Q*R)^2
// (A1(t)^2*(Q.Q)^3*(R.R)^3 - Q^2*(R.R)^3 - R^2*(Q.Q)^3)^2 = (2*Q*R)^2*(Q.Q)^3*(R.R)^3
// (A1(t)^2*(Q.Q)^3*(R.R)^3 - Q^2*(R.R)^3 - R^2*(Q.Q)^3)^2 - (2*Q*R)^2*(Q.Q)^3*(R.R)^3 = 0
// energy = (A1(t)^2*(Q.Q)^3*(R.R)^3 - Q^2*(R.R)^3 - R^2*(Q.Q)^3)^2 - (2*Q*R)^2*(Q.Q)^3*(R.R)^3

import { batch, Component, For } from "solid-js";
import { createStore } from "solid-js/store";
import { Vec2 } from "../Vec2";

const FPS = 60;
const TARGET_TIME_STEP = 1.0 / FPS;

function throttleUpdate(params: {
  dtOffset: number,
  dt: number,
  updateFn: () => void,
}): {
  dtOffset: number,
} {
  // Detect a need skip update catchup. (E.g. User changed tabs.)
  if (params.dt > 1.0) {
    return { dtOffset: 0.0 };
  }
  //
  return batch(() => {
    let dt2 = params.dtOffset + params.dt;
    while (dt2 > 0.0) {
      params.updateFn();
      dt2 -= TARGET_TIME_STEP;
    }
    return {
      dtOffset: dt2,
    };
  });
}


const ThreeBody: Component = () => {
    let [ state, setState ] = createStore<{
        objects: {
            pos: Vec2,
            vel: Vec2,
            acc: Vec2,
        }[],
    }>({
        objects: [
            {
                pos: Vec2.create(400,40),
                vel: Vec2.create(2,2),
                acc: Vec2.zero(),
            },
            {
                pos: Vec2.create(400,300),
                vel: Vec2.create(-4,-2),
                acc: Vec2.zero(),
            },
            {
                pos: Vec2.create(600,300),
                vel: Vec2.create(0,-6),
                acc: Vec2.zero(),
            },
        ],
    });
    let updateThreeBody = () => {
        let dummy1 = Vec2.zero();
        for (let i = 0; i < state.objects.length; ++i) {
            let objectI = state.objects[i];
            let acc = Vec2.zero();
            for (let j = 0; j < state.objects.length; ++j) {
                if (j == i) {
                    continue;
                }
                let objectJ = state.objects[j];
                dummy1.copy(objectJ.pos).sub(objectI.pos);
                let mag = dummy1.length();
                dummy1.multScalar(1000.0 / (mag*mag*mag));
                acc.add(dummy1);
            }
            objectI.acc.dispose();
            setState("objects", i, "acc", acc);
        }
        for (let i = 0; i < state.objects.length; ++i) {
            let objectI = state.objects[i];
            dummy1.copy(objectI.acc).multScalar(0.5);
            let tmp = objectI.pos;
            setState("objects", i, "pos", objectI.pos.clone().add(objectI.vel).add(dummy1));
            tmp.dispose();
            tmp = objectI.vel;
            setState("objects", i, "vel", objectI.vel.clone().add(objectI.acc));
            tmp.dispose();
        }
        dummy1.dispose();
    };
    {
        let first = true;
        let dtOffset = 0.0;
        let lastTime: number = 0.0;
        let update = (t: number) => {
            if (first) {
                lastTime = t / 1000.0;
                first = false;
                requestAnimationFrame(update);
                return;
            }
            let time = t / 1000.0;
            let dt = time - lastTime;
            lastTime = time;
            batch(() => {
                let { dtOffset: dtOffset2, } = throttleUpdate({
                    dtOffset,
                    dt,
                    updateFn: updateThreeBody,
                });
                dtOffset = dtOffset2;
            });
            requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    }
    return (
        <svg style="width: 100%; height: 100%; background-color: white;">
            <For each={state.objects}>
                {(object) => (
                    <circle
                        cx={object.pos.x}
                        cy={object.pos.y}
                        r={20.0}
                        stroke="black"
                        stroke-width={2}
                        fill="none"
                    />
                )}
            </For>
        </svg>
    );
};

export default ThreeBody;
