import { Mode } from "../Mode";
import { ModeParams } from "../ModeParams";

export class AddLinkMode implements Mode {
    constructor(params: {
        modeParams: ModeParams,
        type: "Single" | "Double",
    }) {

    }
}
