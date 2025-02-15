import { Accessor, batch, Component, createComputed, createMemo, on } from "solid-js";
import { Vec2 } from "../../../Vec2";
import { Mode } from "../Mode";
import { ModeParams } from "../ModeParams";

export class ResizeMode implements Mode {
    dragEnd: () => void;

    constructor(params: {
        modeParams: ModeParams,
        rect: {
            initPos: Vec2,
            initSize: Vec2,
            setPos: (x: Vec2) => void,
            setSize: (x: Vec2) => void,
        },
        resizeCorner: {
            /** This is the world point the anchor was picked up at */
            pickupPt: Vec2,
            /** The x-type of the anchor point */
            xType: "Left" | "Centre" | "Right",
            /** The y-type of the anchor point */
            yType: "Top" | "Centre" | "Bottom",
        },
    }) {
        let modeParams = params.modeParams;
        let workingPt = createMemo(() => {
            let mousePos = modeParams.mousePos();
            if (mousePos == undefined) {
                return undefined;
            }
            return modeParams.screenPtToWorldPt(mousePos);
        });
        createComputed(on(
            workingPt,
            () => {
                let workingPt2 = workingPt();
                if (workingPt2 == undefined) {
                    return;
                }
                let offsetX = workingPt2.x - params.resizeCorner.pickupPt.x;
                let newX: number | undefined;
                let newWidth: number | undefined;
                if (params.resizeCorner.xType == "Left") {
                    newX = params.rect.initPos.x + offsetX;
                    newWidth = params.rect.initSize.x - offsetX;
                } else if (params.resizeCorner.xType == "Right") {
                    newX = undefined;
                    newWidth = params.rect.initSize.x + offsetX;
                } else {
                    newX = undefined;
                    newWidth = undefined;
                }
                let offsetY = workingPt2.y - params.resizeCorner.pickupPt.y;
                let newY: number | undefined;
                let newHeight: number | undefined;
                if (params.resizeCorner.yType == "Top") {
                    newY = params.rect.initPos.y + offsetY;
                    newHeight = params.rect.initSize.y - offsetY;
                } else if (params.resizeCorner.yType == "Bottom") {
                    newY = undefined;
                    newHeight =- params.rect.initSize.y + offsetY;
                } else {
                    newY = undefined;
                    newHeight == undefined;
                }
                batch(() => {
                    if (newX != undefined || newY != undefined) {
                        params.rect.setPos(
                            Vec2.create(
                                newX ?? params.rect.initPos.x,
                                newY ?? params.rect.initPos.y,
                            ),
                        );
                    }
                    params.rect.setSize(
                        Vec2.create(
                            newWidth ?? params.rect.initSize.x,
                            newHeight ?? params.rect.initSize.y,
                        ),
                    );
                });
            },
        ));
        //
        this.dragEnd = () => {
            modeParams.onDone();
        };
    }
}
