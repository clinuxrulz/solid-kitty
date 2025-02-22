import { Component } from "solid-js";
import { EcsComponent } from "../../../ecs/EcsComponent";
import { FrameState } from "../components/FrameComponent";
import { Mode } from "../Mode";
import { ModeParams } from "../ModeParams";

export class EditDataMode implements Mode {
    overlayHtmlUI: Component;

    constructor(params: {
        modeParams: ModeParams,
        frameComponent: EcsComponent<FrameState>,
    }) {
        let modeParams = params.modeParams;
        let frameComponent = params.frameComponent;
        this.overlayHtmlUI = () => (
            <div
                style={{
                    "position": "absolute",
                    "left": "0",
                    "top": "0",
                    "right": "0",
                    "bottom": "0",
                    "background-color": "rgba(0,0,0,0.5)",
                    "pointer-events": "auto",
                }}
            >
                <button
                    class="btn"
                    onClick={() => modeParams.onDone()}
                >
                    Close
                </button>
            </div>
        );
    }
}
