import { createStore, SetStoreFunction, Store } from "solid-js/store";
import { Result } from "../kitty-demo/Result";

export interface IsEcsComponentType {
    readonly typeName: string;
    readonly toJson: (value: any) => object;
    readonly fromJson: (x: any) => Result<any>;
}

export interface IsEcsComponent {
    readonly type: IsEcsComponentType;
}

export class EcsComponentType<S extends object> implements IsEcsComponentType {
    readonly typeName: string;
    readonly toJson: (value: S) => object;
    readonly fromJson: (x: any) => Result<S>;

    constructor(params: {
        typeName: string;
        toJson: (value: S) => object;
        fromJson: (x: any) => Result<S>;
    }) {
        this.typeName = params.typeName;
        this.toJson = params.toJson;
        this.fromJson = params.fromJson;
    }

    create(s: S): EcsComponent<S> {
        let [state, setState] = createStore(s);
        return new EcsComponent({
            type: this,
            state,
            setState,
        });
    }
}

export class EcsComponent<S extends object> implements IsEcsComponent {
    readonly type: EcsComponentType<S>;
    readonly state: Store<S>;
    readonly setState: SetStoreFunction<S>;

    constructor(params: {
        type: EcsComponentType<S>;
        state: Store<S>;
        setState: SetStoreFunction<S>;
    }) {
        this.type = params.type;
        this.state = params.state;
        this.setState = params.setState;
    }
}
