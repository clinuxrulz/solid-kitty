import { Component, createMemo } from "solid-js";
import { Mode } from "../Mode";
import { ModeParams } from "../ModeParams";
import { Vec2 } from "../../Vec2";
import { Colour } from "../Colour";
import { UndoUnit } from "../UndoManager";

export class DrawPixelsMode implements Mode {
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
        let writePixel = (pt: Vec2) => {
            let oldColour = params.readPixel(pt);
            if (oldColour == undefined) {
                return;
            }
            let newColour = params.currentColour();
            params.writePixel(pt, newColour);
            let undoUnit: UndoUnit = {
                displayName: "Draw Pixel",
                run(isUndo) {
                    if (isUndo) {
                        params.writePixel(pt, oldColour);
                    } else {
                        params.writePixel(pt, newColour);
                    }
                },
            };
            params.undoManager.pushUndoUnit(undoUnit);
        };
        //
        this.instructions = () => {
            return "Click to draw pixels, press escape when done.";
        };
        this.click = () => {
            let pt = workingPoint();
            if (pt != undefined) {
                writePixel(pt);
            }
        };
    }
}
