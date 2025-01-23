import { createMemo } from "solid-js";
import { Mode } from "../Mode";
import { ModeParams } from "../ModeParams";
import { Vec2 } from "../../Vec2";
import { Colour } from "../Colour";

export class DrawPixelsMode implements Mode {
    click: () => void;

    constructor(params: ModeParams) {
        let workingPoint = createMemo(() => {
            let mousePos = params.mousePos();
            if (mousePos == undefined) {
                return undefined;
            }
            return params.screenPtToWorldPt(mousePos);
        });
        //
        let writePixel = (pt: Vec2) => {
            params.writePixel(pt, new Colour(0, 0, 0, 0));
        };
        //
        this.click = () => {
            let pt = workingPoint();
            if (pt != undefined) {
                writePixel(pt);
            }
        };
    }
}
