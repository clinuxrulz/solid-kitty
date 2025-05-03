import { Result } from './kitty-demo/Result';
import { Vec2 } from './Vec2';
export type TypeSchema<A> = undefined extends A ? {
    type: "MaybeUndefined";
    element: TypeSchema<NonNullable<A>>;
} : null extends A ? {
    type: "MaybeNull";
    element: TypeSchema<NonNullable<A>>;
} : A extends boolean ? "Boolean" : A extends number ? "Number" : A extends string ? "String" : A extends unknown[] ? {
    type: "Array";
    element: TypeSchema<A[0]>;
} : A extends {
    type: string;
    value: unknown;
} ? {
    type: "Union";
    parts: {
        [K in A["type"]]: TypeSchema<Extract<A, {
            type: K;
        }>["value"]>;
    };
} : A extends object ? {
    type: "Object";
    properties: {
        [K in keyof A]: TypeSchema<A[K]>;
    };
} : {
    type: "Recursive";
    typeSchema: () => TypeSchema<A>;
} | {
    type: "Invariant";
    fn1: (a: unknown) => A;
    fn2: (a: A) => unknown;
    typeSchema: TypeSchema<unknown>;
} | {
    type: "WithDefault";
    default_: A;
    typeSchema: TypeSchema<A>;
};
export declare function makeInvariantTypeSchema<A, B>(fn1: (a: B) => A, fn2: (a: A) => B, typeSchema: TypeSchema<B>): TypeSchema<A>;
export declare function makeWithDefaultTypeSchema<A>(default_: A, typeSchema: TypeSchema<A>): TypeSchema<A>;
export declare const vec2TypeSchema: TypeSchema<Vec2>;
export declare function loadFromJsonViaTypeSchema<A>(typeSchema: TypeSchema<A>, x: any): Result<A>;
export declare function makeDefaultViaTypeSchema<A>(typeSchema: TypeSchema<A>): A;
export declare function saveToJsonViaTypeSchema<A>(typeSchema: TypeSchema<A>, x: A): any;
export declare function equalsViaTypeSchema<A>(typeSchema: TypeSchema<A>, a: A, b: A): boolean;
export declare function createJsonProjectionViaTypeSchemaV2<A>(typeSchema: TypeSchema<A>, json: any, changeJson: (callback: (json: any) => void) => void): Result<A>;
export declare function createJsonProjectionViaTypeSchema<A>(typeSchema: TypeSchema<A>, json: any, changeJson: (callback: (json: any) => void) => void): Result<A>;
