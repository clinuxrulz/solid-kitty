import { Accessor } from "solid-js";
import { Node } from "./Node";
import { Vec2 } from "../Vec2";

export type ModeParams = {
    mousePos: Accessor<Vec2 | undefined>,
    screenPtToWorldPt: (pt: Vec2) => Vec2 | undefined,
    worldPtToScreenPt: (pt: Vec2) => Vec2 | undefined,
    nodes: Accessor<Node[]>,
    addNode: (node: Node) => void,
    removeNode: (node: Node) => void,
    onDone: () => void,
};
