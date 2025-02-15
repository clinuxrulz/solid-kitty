import { Accessor, createMemo } from "solid-js";
import { Mode } from "../Mode";
import { ModeParams } from "../ModeParams";
import { opToArr } from "../../../kitty-demo/util";
import { createStore } from "solid-js/store";

export class IdleMode implements Mode {
    highlightedEntities: Accessor<string[]>;
    selectedEntities: Accessor<string[]>;
    click: () => void;

    constructor(modeParams: ModeParams) {
        let [ state, setState, ] = createStore<{
            selectedEntities: string[],
        }>({
            selectedEntities: [],
        });
        //
        let entityUnderMouse = modeParams.pickingSystem.mkEntityUnderMouse();
        //
        this.highlightedEntities = createMemo(() => opToArr(entityUnderMouse()));
        this.selectedEntities = () => state.selectedEntities;
        this.click = () => {
            let entity = entityUnderMouse();
            setState("selectedEntities", opToArr(entity));
        };
    }
}
