import { createStore, SetStoreFunction, Store } from "solid-js/store";

export interface IsEcsComponentType {
    readonly typeName: string;
}

export interface IsEcsComponent {
    readonly type: IsEcsComponentType,
};

export class EcsComponentType<S extends object> implements IsEcsComponentType {
    readonly typeName: string;
    
    constructor(params: {
        typeName: string
    }) {
        this.typeName = params.typeName;
    }

    create(s: S): EcsComponent<S> {
        let [ state, setState, ] = createStore(s);
        return new EcsComponent({
            type: this,
            state,
            setState,
        });
    }
};

export class EcsComponent<S extends object> implements IsEcsComponent {
    readonly type: EcsComponentType<S>;
    readonly state: Store<S>;
    readonly setState: SetStoreFunction<S>;

    constructor(params: {
        type: EcsComponentType<S>,
        state: Store<S>,
        setState: SetStoreFunction<S>,
    }) {
        this.type = params.type;
        this.state = params.state;
        this.setState = params.setState;
    }
}
