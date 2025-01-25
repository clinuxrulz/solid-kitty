import { createStore } from "solid-js/store";
import { Mode } from "../Mode";
import { ModeParams } from "../ModeParams";

export class AddLinkMode implements Mode {
    constructor(params: {
        modeParams: ModeParams,
        type: "Single" | "Double",
    }) {
        let [ state, setState, ] = createStore<{
            sourceNode: Node | undefined,
            tarketNode: Node | undefined,
        }>({
            sourceNode: undefined,
            tarketNode: undefined,
        });
        
    }
}
