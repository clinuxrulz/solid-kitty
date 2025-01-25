import { Accessor } from "solid-js";
import { Node } from "./Node";

export type ModeParams = {
    nodes: Accessor<Node[]>,
    addNode: (node: Node) => void,
    removeNode: (node: Node) => void,
    onDone: () => void,
};
