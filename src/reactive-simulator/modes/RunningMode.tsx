import { untrack } from "solid-js/web";
import { Mode } from "../Mode";
import { Node } from "../Node";
import { ModeParams } from "../ModeParams";
import { Accessor, Component, createMemo, createSignal, onCleanup, Signal } from "solid-js";
import { opToArr } from "../../util";

const ALGORITHM_STEP_DELAY_MS = 1000;

type AlgorithmnState = {
    nodesToVisit: Node[],
    stepCounter: Signal<number>,
    cursorAt: Signal<Node | undefined>,
};

export class RunningMode implements Mode {
    instructions: Component;
    highlightNodes: Accessor<Node[]>;

    constructor(modeParams: ModeParams) {
        // Gather all dirty nodes.
        // They would normally automatically go into a collection as they are
        // marked diry.
        let nodesToVisit: Node[] = untrack(() => {
            let result: Node[] = [];
            for (let node of modeParams.nodes()) {
                if (node.state.flag == "Dirty") {
                    result.push(node);
                }
            }
            return result;
        });
        //
        let algorithmnState: AlgorithmnState = {
            nodesToVisit,
            stepCounter: createSignal<number>(0),
            cursorAt: createSignal<Node | undefined>(undefined),
        };
        let intervalId = setInterval(
            () => this.stepAlgorithmn(algorithmnState),
            ALGORITHM_STEP_DELAY_MS,
        );
        onCleanup(() => {
            clearInterval(intervalId);
        });
        //
        this.instructions = () => {
            return (
                <div>
                    Simulation is running.<br/>
                    Step: {algorithmnState.stepCounter[0]()}
                </div>
            );
        };
        this.highlightNodes = createMemo(() => opToArr(algorithmnState.cursorAt[0]()));
    }

    stepAlgorithmn(state: AlgorithmnState) {
        if (state.cursorAt[0]() == undefined) {
            let node = state.nodesToVisit.pop();
            if (node == undefined) {
                return;
            }
            state.cursorAt[1](node);
            state.stepCounter[1]((x) => x + 1);
            return;
        }
    }
}
