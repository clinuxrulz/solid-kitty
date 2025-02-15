import { Accessor, createMemo } from "solid-js";
import { Mode } from "../Mode";
import { ModeParams } from "../ModeParams";
import { opToArr } from "../../../kitty-demo/util";

export class IdleMode implements Mode {
    highlightedEntities: Accessor<string[]>;

    constructor(modeParams: ModeParams) {
        let entityUnderMouse = modeParams.pickingSystem.mkEntityUnderMouse();
        //
        this.highlightedEntities = createMemo(() => opToArr(entityUnderMouse()));
    }
}
