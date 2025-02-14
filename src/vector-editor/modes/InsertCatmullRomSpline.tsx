import { Component } from "solid-js";
import { Mode } from "../Mode";
import { ModeParams } from "../ModeParams";

export class InsertCatmullRomSpline implements Mode {
    instructions: Component;

    constructor(modeParams: ModeParams) {

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
    }
}
