import { Component, createMemo } from "solid-js";
import { Mode } from "../Mode";
import { ModeParams } from "../ModeParams";
import { createStore } from "solid-js/store";
import { Vec2 } from "../../Vec2";

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
        let doInsert: () => void = () => {};
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
