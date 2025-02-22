import { Component, onMount } from "solid-js";
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
                }}
            >
                <div
                    style={{
                        "position": "absolute",
                        "left": "50%",
                        "top": "50%",
                        "transform": "translate(-50%,-50%)",
                        "background-color": "black",
                        "border-radius": "10px",
                        "padding": "20px",
                    }}
                >
                    <table>
                        <thead/>
                        <tbody>
                            <tr>
                                <td style="padding-right: 10px;"><b>Name:</b></td>
                                <td>
                                    <input
                                        type="text"
                                        style="color: black;"
                                    />
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <br/>
                    <div style="text-align: right;">
                        <button
                            class="btn"
                            onClick={() => modeParams.onDone()}
                        >
                            OK
                        </button>
                        <button
                            class="btn"
                            onClick={() => modeParams.onDone()}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }
}
