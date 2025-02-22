import { EcsComponent } from "../../../ecs/EcsComponent";
import { FrameState } from "../components/FrameComponent";
import { Mode } from "../Mode";
import { ModeParams } from "../ModeParams";

export class EditDataMode implements Mode {
    constructor(params: {
        modeParams: ModeParams,
        frameComponent: EcsComponent<FrameState>,
    }) {

    }
}
