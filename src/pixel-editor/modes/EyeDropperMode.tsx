import { Component, createMemo } from "solid-js";
import { Mode } from "../Mode";
import { ModeParams } from "../ModeParams";
import { Vec2 } from "../../Vec2";

export class EyeDropperMode implements Mode {
    instructions: Component;
    click: () => void;

    constructor(params: ModeParams) {
        let workingPoint = createMemo(() => {
            let mousePos = params.mousePos();
            if (mousePos == undefined) {
                return undefined;
            }
            let pt = params.screenPtToWorldPt(mousePos);
            if (pt == undefined) {
                return undefined;
            }
            return Vec2.create(
                Math.floor(pt.x),
                Math.floor(pt.y),
            );
        });
        //
        this.instructions = () => {
            return "Click on a pixel to grab the colour of.";
        };
        this.click = () => {
            let pt = workingPoint();
            if (pt == undefined) {
                return;
            }
            let c = params.readPixel(pt);
            if (c != undefined) {
                params.setCurrentColour(c);
            }
        };
    }
}
