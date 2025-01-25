import { Accessor } from "solid-js";
import { Node } from "./Node";

export interface Mode {
    highlightNodes?: Accessor<Node[]>,
}
