import { Accessor, Component, createComputed, createMemo, onCleanup, untrack } from "solid-js";
import { Mode } from "../Mode";
import { ModeParams } from "../ModeParams";
import { createStore } from "solid-js/store";
import { Vec2 } from "../../Vec2";
import { catmullRomSplineComponentType } from "../components/CatmullRomSpline";
import { opToArr } from "../../kitty-demo/util";

export class InsertCatmullRomSpline implements Mode {
    instructions: Component;
    click: () => void;
    constructor(modeParams: ModeParams) {
        let [ state, setState, ] = createStore<{
            controlPoints: Vec2[],
        }>({
            controlPoints: [],
        });
        let workingPt = createMemo(() => {
            let mousePos = modeParams.mousePos();
            if (mousePos == undefined) {
                return undefined;
            }
            return modeParams.screenPtToWorldPt(mousePos);
        });
        let wipControlPoints = createMemo(() => {
            if (state.controlPoints.length == 0) {
                return undefined;
            }
            let workingPt2 = workingPt();
            if (state.controlPoints.length == 1 && workingPt2 == undefined) {
                return undefined;
            }
            return [ ...state.controlPoints, ...opToArr(workingPt2), ];
        });
        let doInsert: () => void = () => {
            modeParams.onDone();
        };
        {
            let hasWipControlPoints = createMemo(() =>
                wipControlPoints() != undefined
            );
            createComputed(() => {
                if (!hasWipControlPoints()) {
                    return;
                }
                let wipControlPoints2 = wipControlPoints as Accessor<NonNullable<ReturnType<typeof wipControlPoints>>>;
                let world = modeParams.world();
                let spline = catmullRomSplineComponentType.create({
                    controlPoints: untrack(wipControlPoints2),
                    isClosed: false,
                })
                let entity = untrack(() => world.createEntity([
                    spline,
                ]));
                onCleanup(() => {
                    world.destroyEntity(entity);
                });
            });
        }
        this.instructions = () => {
            return (<>
                Click in the control points for your curve.<br/>
                <button
                    class="btn"
                    onClick={() => doInsert()}
                >
                    End Mode
                </button>
            </>);
        };
        this.click = () => {
            let pt = workingPt();
            if (pt != undefined) {
                setState("controlPoints", (x) => [...x, pt]);
            }
        };
    }
}
