import { Accessor } from "solid-js";
import { createStore, SetStoreFunction, Store } from "solid-js/store";

type ActorState = {
    pos: {
        x: number,
        y: number,
    },
    vel: {
        x: number,
        y: number,
    },
    acc: {
        x: number,
        y: number,
    },
    maxVel: {
        x: number,
        y: number,
    },
};

export interface IsActor {
    get actor(): ActorBase;
}

export interface IsAnimated {
    readonly flipX: Accessor<boolean>;
    readonly animation: Accessor<string>;
}

export class ActorBase {
    state: Store<ActorState>;
    setState: SetStoreFunction<ActorState>;

    constructor(params: {
        initPos?: {
            x: number,
            y: number,
        },
        initVel?: {
            x: number,
            y: number,
        },
    }) {
        let [ state, setState ] = createStore<ActorState>({
            pos: {
                x: params.initPos?.x ?? 0,
                y: params.initPos?.y ?? 0,
            },
            vel: {
                x: params.initVel?.x ?? 0,
                y: params.initVel?.y ?? 0,
            },
            acc: {
                x: 0.0,
                y: 0.0,
            },
            maxVel: {
                x: 10.0,
                y: 10.0,
            },
        });
        this.state = state;
        this.setState = setState;
    }
}
