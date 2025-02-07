import { Accessor, Component } from "solid-js";

export interface Mode {
    instructions?: Component,
    overlaySvgUI?: Component,
    dragStart?: (params: { isMouse: boolean, }) => void,
    dragEnd?: (params: { isMouse: boolean, }) => void,
    click?: (params: { isMouse: boolean, }) => void,
    disableOneFingerPan?: Accessor<boolean>,
}
