import { Accessor, createComputed, createMemo, mapArray, on, untrack } from "solid-js";
import { err, ok, Result } from "./kitty-demo/Result";
import { Vec2 } from "./Vec2";
import { SetStoreFunction, Store } from "solid-js/store";

export type TypeSchema<A> = undefined extends A
    ? {
          type: "MaybeUndefined";
          element: TypeSchema<NonNullable<A>>;
      }
    : null extends A
      ? {
            type: "MaybeNull";
            element: TypeSchema<NonNullable<A>>;
        }
      : A extends boolean
        ? "Boolean"
        : A extends number
          ? "Number"
          : A extends string
            ? "String"
            : A extends unknown[]
              ? { type: "Array"; element: TypeSchema<A[0]> }
              : A extends { type: string; value: unknown }
                ? {
                      type: "Union";
                      parts: {
                          [K in A["type"]]: TypeSchema<
                              Extract<A, { type: K }>["value"]
                          >;
                      };
                  }
                : A extends object
                  ? {
                        type: "Object";
                        properties: {
                            [K in keyof A]: TypeSchema<A[K]>;
                        };
                    }
                  :
                        | {
                              type: "Recursive";
                              typeSchema: () => TypeSchema<A>;
                          }
                        | {
                              type: "Invariant";
                              fn1: (a: unknown) => A;
                              fn2: (a: A) => unknown;
                              typeSchema: TypeSchema<unknown>;
                          }
                        | {
                            type: "WithDefault",
                            default_: A,
                            typeSchema: TypeSchema<A>,
                        };

export function makeInvariantTypeSchema<A, B>(
    fn1: (a: B) => A,
    fn2: (a: A) => B,
    typeSchema: TypeSchema<B>,
): TypeSchema<A> {
    return {
        type: "Invariant",
        fn1,
        fn2,
        typeSchema,
    } as unknown as TypeSchema<A>;
}

export function makeWithDefaultTypeSchema<A>(
    default_: A,
    typeSchema: TypeSchema<A>,
): TypeSchema<A> {
    return {
        type: "WithDefault",
        default_,
        typeSchema,
    } as unknown as TypeSchema<A>;
}

export const vec2TypeSchema: TypeSchema<Vec2> = makeInvariantTypeSchema(
    (a: { x: number; y: number }) => Vec2.create(a.x, a.y),
    (a: Vec2) => ({ x: a.x, y: a.y }),
    {
        type: "Object",
        properties: {
            x: "Number",
            y: "Number",
        },
    },
);

type Example = {
    a: number;
    b: number | undefined;
    c:
        | {
              type: "X";
              value: string;
          }
        | {
              type: "Y";
              value: {
                  x: number;
                  y: number;
              };
          };
};

const exampleTypeSchema: TypeSchema<Example> = {
    type: "Object",
    properties: {
        a: "Number",
        b: {
            type: "MaybeUndefined",
            element: "Number",
        },
        c: {
            type: "Union",
            parts: {
                X: "String",
                Y: {
                    type: "Object",
                    properties: {
                        x: "Number",
                        y: "Number",
                    },
                },
            },
        },
    },
};

export function loadFromJsonViaTypeSchema<A>(
    typeSchema: TypeSchema<A>,
    x: any,
): Result<A> {
    if (typeSchema == "Boolean") {
        if (typeof x !== "boolean") {
            return err("Expected a boolean.");
        }
        return ok(x) as any;
    } else if (typeSchema == "Number") {
        if (typeof x !== "number") {
            return err("Expected a number.");
        }
        return ok(x) as any;
    } else if (typeSchema == "String") {
        if (typeof x !== "string") {
            return err("Expected a string.");
        }
        return ok(x) as any;
    }
    switch (typeSchema.type) {
        case "MaybeUndefined": {
            if (x == null) {
                return ok(undefined) as any;
            }
            return loadFromJsonViaTypeSchema(typeSchema.element, x);
        }
        case "MaybeNull": {
            if (x == null) {
                return ok(null) as any;
            }
            return loadFromJsonViaTypeSchema(typeSchema.element, x);
        }
        case "Union": {
            let type = x.type;
            if (typeof type !== "string") {
                return err("Missing type param for union.");
            }
            let value = x.value;
            let element = (typeSchema as any).parts[type];
            let res = loadFromJsonViaTypeSchema(element, value);
            if (res.type == "Err") {
                return err(
                    `Problem parsing union part ${type}: ${res.message}`,
                );
            }
            let x2 = res.value;
            return ok({
                type,
                value: x2,
            }) as any;
        }
        case "Array": {
            let res: any[] = [];
            for (let x2 of x) {
                let value = loadFromJsonViaTypeSchema(typeSchema.element, x2);
                if (value.type == "Err") {
                    return value;
                }
                res.push(value.value);
            }
            return ok(res) as any;
        }
        case "Object": {
            let res: any = {};
            for (let key of Object.keys(typeSchema.properties)) {
                let fieldTypeSchema = (typeSchema as any).properties[key];
                if (!Object.hasOwn(x, key)) {
                    res[key] = makeDefaultViaTypeSchema(fieldTypeSchema);
                }
                let value = loadFromJsonViaTypeSchema(
                    (typeSchema as any).properties[key],
                    x[key],
                );
                if (value.type == "Err") {
                    return err(
                        `Problem parsing field ${key}: ${value.message}`,
                    );
                }
                res[key] = value.value;
            }
            return ok(res);
        }
        case "Recursive": {
            let typeSchema2 = typeSchema.typeSchema();
            return loadFromJsonViaTypeSchema(typeSchema2, x);
        }
        case "Invariant": {
            let fn1 = typeSchema.fn1;
            let value = loadFromJsonViaTypeSchema(typeSchema.typeSchema, x);
            if (value.type == "Err") {
                return value;
            }
            return ok(fn1(value.value));
        }
        case "WithDefault": {
            let typeSchema2 = typeSchema.typeSchema;
            let r: Result<A>;
            try {
                r = loadFromJsonViaTypeSchema(typeSchema2, x);
            } catch (e) {
                r = err("" + e);
            }
            if (r.type == "Err") {
                return ok(typeSchema.default_);
            }
            return ok(r.value);
        }
    }
}

export function makeDefaultViaTypeSchema<A>(
    typeSchema: TypeSchema<A>,
): A {
    if (typeSchema == "Boolean") {
        return false as A;
    } else if (typeSchema == "Number") {
        return 0.0 as A;
    } else if (typeSchema == "String") {
        return "" as A;
    }
    switch (typeSchema.type) {
        case "MaybeUndefined": {
            return undefined as A;
        }
        case "MaybeNull": {
            return null as A;
        }
        case "Union": {
            let type = Object.keys(typeSchema.parts)[0];
            return {
                type,
                value: makeDefaultViaTypeSchema((typeSchema.parts as any)[type])
            } as A;
        }
        case "Array": {
            return [] as A;
        }
        case "Object": {
            let res: any = {};
            for (let key of Object.keys(typeSchema.properties)) {
                let fieldTypeSchema = (typeSchema as any).properties[key];
                res[key] = makeDefaultViaTypeSchema(fieldTypeSchema);
            }
            return res as A;;
        }
        case "Recursive": {
            let typeSchema2 = typeSchema.typeSchema();
            return makeDefaultViaTypeSchema(typeSchema2);
        }
        case "Invariant": {
            let fn1 = typeSchema.fn1;
            let value = makeDefaultViaTypeSchema(typeSchema.typeSchema);
            return fn1(value as any);
        }
        case "WithDefault": {
            return typeSchema.default_;
        }
    }
}

export function saveToJsonViaTypeSchema<A>(
    typeSchema: TypeSchema<A>,
    x: A,
): any {
    if (typeSchema == "Boolean") {
        return x;
    } else if (typeSchema == "Number") {
        return x;
    } else if (typeSchema == "String") {
        return x;
    }
    switch (typeSchema.type) {
        case "MaybeUndefined": {
            if (x == undefined) {
                return null;
            }
            return saveToJsonViaTypeSchema(typeSchema.element, x);
        }
        case "MaybeNull": {
            if (x == null) {
                return null;
            }
            return saveToJsonViaTypeSchema(typeSchema.element, x);
        }
        case "Union": {
            let type = (x as any).type as string;
            let value = (x as any)[type];
            return {
                type: type,
                value: saveToJsonViaTypeSchema(
                    (typeSchema as any).parts[type],
                    value,
                ),
            };
        }
        case "Object": {
            let res: any = {};
            for (let key of Object.keys(typeSchema.properties)) {
                res[key] = saveToJsonViaTypeSchema(
                    (typeSchema as any).properties[key],
                    (x as any)[key],
                );
            }
            return res;
        }
        case "Array": {
            return (x as any).map((x2: any) =>
                saveToJsonViaTypeSchema((typeSchema as any).element, x2),
            );
        }
        case "Recursive": {
            let typeSchema2 = typeSchema.typeSchema();
            return saveToJsonViaTypeSchema(typeSchema2, x);
        }
        case "Invariant": {
            let fn2 = typeSchema.fn2;
            let x2 = fn2(x);
            return saveToJsonViaTypeSchema(typeSchema.typeSchema, x2);
        }
        case "WithDefault": {
            return saveToJsonViaTypeSchema(typeSchema.typeSchema, x);
        }
    }
}

export function equalsViaTypeSchema<A>(typeSchema: TypeSchema<A>, a: A, b: A): boolean {
    // the lazy way for now
    return saveToJsonViaTypeSchema(typeSchema, a) == saveToJsonViaTypeSchema(typeSchema, b);
}

const objProjectionMap = new WeakMap();
const arrProjectionMap = new WeakMap();

export function createJsonProjectionViaTypeSchemaV2<A>(typeSchema: TypeSchema<A>, json: Accessor<any>, changeJson: (callback: (json: any) => void) => void): Result<A> {
    if (typeof typeSchema != "object" || typeSchema.type != "Object") {
        return err("Only projections of objects are supported");
    }
    {
        let json2 = untrack(json);
        if (objProjectionMap.has(json2)) {
            return ok(objProjectionMap.get(json2)!);
        }
    }
    let result: any = {};
    let lastValues: any = {};
    for (let [fieldName, fieldTypeSchema] of Object.entries(typeSchema.properties)) {
        let fieldTypeSchema2 = fieldTypeSchema as TypeSchema<any>;
        Object.defineProperty(result, fieldName, {
            get() {
                if (typeof fieldTypeSchema == "object") {
                    if ((fieldTypeSchema as any).type == "Object") {
                        let r = createJsonProjectionViaTypeSchemaV2(
                            fieldTypeSchema2 as any,
                            createMemo(() => json()[fieldName]),
                            (callback) => changeJson((json2) => callback(json2[fieldName])),
                        );
                        if (r.type == "Err") {
                            throw new Error("Unreachable");
                        }
                        return r.value;
                    }
                    if ((fieldTypeSchema as any).type == "Array") {
                        let r = createJsonArrayProjectionViaTypeSchemaV2(
                            fieldTypeSchema2 as any,
                            createMemo(() => json()[fieldName]),
                            (callback) => changeJson((json2) => {
                                callback(json2[fieldName])
                            }),
                        );
                        if (r.type == "Err") {
                            throw new Error("Unreachable");
                        }
                        return r.value;
                    }
                }
                let r = loadFromJsonViaTypeSchema<any>(fieldTypeSchema2, json()[fieldName]);
                if (r.type == "Err") {
                    return makeDefaultViaTypeSchema(fieldTypeSchema2);
                }
                let lastValue = lastValues[fieldName];
                if (lastValue != undefined) {
                    if (equalsViaTypeSchema(fieldTypeSchema2, lastValue, r.value)) {
                        return lastValue;
                    }
                }
                return r.value;
            },
            set(v) {
                let newValue = saveToJsonViaTypeSchema(fieldTypeSchema2, v);
                if (JSON.stringify(json()[fieldName]) == JSON.stringify(newValue)) {
                    return;
                }
                changeJson((json2) => json2[fieldName] = newValue);
            },
        });
    }
    {
        let json2 = untrack(json);
        objProjectionMap.set(json2, result);
    }
    return ok(result as A);
}

function createJsonArrayProjectionViaTypeSchemaV2<A>(typeSchema: TypeSchema<A>, json: Accessor<any>, changeJson: (callback: (json: any) => void) => void): Result<A> {
    if (typeof typeSchema != "object" || typeSchema.type != "Array") {
        return err("Expected an array for projection");
    }
    {
        let json2 = untrack(json);
        if (arrProjectionMap.has(json2)) {
            return ok(arrProjectionMap.get(json2)!);
        }
    }
    let elementTypeSchema = typeSchema.element;
    let dummy: any = [];
    createComputed(on(
        json,
        (json2) => {
            let r = loadFromJsonViaTypeSchema(typeSchema, json2);
            if (r.type == "Ok") {
                dummy = r.value as any;
            }
        },
    ));
    let lastValues: any[] = [];
    let result = new Proxy(
        dummy,
        {
            get(target, p, receiver) {
                if (p == "length") {
                    return json().length;
                }
                if (typeof p == "string" && !Number.isNaN(Number.parseInt(p))) {
                    let idx = Number.parseInt(p);
                    if (typeof elementTypeSchema == "object") {
                        if (elementTypeSchema.type == "Object") {
                            let r = createJsonProjectionViaTypeSchemaV2(
                                elementTypeSchema as any,
                                createMemo(() => json()[p]),
                                (callback) => changeJson((json2) => {
                                    callback(json2[p]);
                                }),
                            );
                            if (r.type == "Err") {
                                throw new Error("Unreachable");
                            }
                            return r.value;
                        }
                        if (elementTypeSchema.type == "Array") {
                            let r = createJsonArrayProjectionViaTypeSchemaV2(
                                elementTypeSchema as any,
                                createMemo(() => json()[p]),
                                (callback) => changeJson((json2) => {
                                    callback(json2[p]);
                                }),
                            );
                            if (r.type == "Err") {
                                throw new Error("Unreachable");
                            }
                            return r.value;
                        }
                    }
                    let r = loadFromJsonViaTypeSchema(elementTypeSchema, json()[p]);
                    if (r.type == "Err") {
                        return makeDefaultViaTypeSchema(elementTypeSchema);
                    }
                    let lastValue = lastValues[Number.parseInt(p)];
                    if (lastValue != undefined) {
                        if (equalsViaTypeSchema(elementTypeSchema as any, lastValue, r.value)) {
                            return lastValue;
                        }
                    }
                    return r.value;
                }
                return Reflect.get(dummy, p, dummy);
            },
            set(target, p, newValue, receiver) {
                if (typeof p == "string" && !Number.isNaN(Number.parseInt(p))) {
                    let newValue2 = saveToJsonViaTypeSchema(elementTypeSchema as any, newValue);
                    if (JSON.stringify(json()[p]) == JSON.stringify(newValue)) {
                        return false;
                    }
                    changeJson((json2) => json2[p] = newValue2);
                }
                return Reflect.set(dummy, p, newValue, dummy);
            },
        },
    );
    {
        let json2 = untrack(json);
        arrProjectionMap.set(json2, result);
    }
    return ok(result as A);
}

export function createJsonProjectionViaTypeSchema<A>(typeSchema: TypeSchema<A>, json: any, changeJson: (callback: (json: any) => void) => void): Result<A> {
    if (typeof typeSchema != "object") {
        return err("Only projections of objects are supported");
    }
    if (typeSchema.type != "Object") {
        return err("Only projections of objects are supported");
    }
    if (objProjectionMap.has(json)) {
        return ok(objProjectionMap.get(json) as A);
    }
    let target2 = makeDefaultViaTypeSchema(typeSchema);
    let projection = new Proxy(
        target2,
        {
            get(_target, p, _receiver) {
                let fieldTypeSchema = (typeSchema.properties as any)[p] as (TypeSchema<any> | undefined);
                if (fieldTypeSchema == undefined) {
                    return (target2 as any)[p]
                }
                if ((fieldTypeSchema as any).type == "Object") {
                    let r = createJsonProjectionViaTypeSchema(
                        fieldTypeSchema as any,
                        json[p],
                        (callback) => changeJson((json2) => callback(json2[p])),
                    );
                    if (r.type == "Ok") {
                        return r.value;
                    }
                }
                if ((fieldTypeSchema  as any).type == "Array") {
                    let r = createJsonArrayProjectionViaTypeSchema(
                        fieldTypeSchema  as any,
                        json[p],
                        (callback) => changeJson((json2) => callback(json2[p])),
                    );
                    if (r.type == "Ok") {
                        return r.value;
                    }
                }
                let x = loadFromJsonViaTypeSchema<any>(fieldTypeSchema, json[p]);
                if (x.type == "Err") {
                    return (target2 as any)[p];
                }
                let x2 = x.value;
                let last = (target2 as any)[p];
                if (equalsViaTypeSchema(fieldTypeSchema, last, x2)) {
                    return last;
                }
                (target2 as any)[p] = x2;
                return (target2 as any)[p];
            },
            set(target, p, newValue, receiver) {
                (target2 as any)[p] = newValue;
                let fieldTypeSchema = (typeSchema.properties as any)[p] as (TypeSchema<any> | undefined);
                if (fieldTypeSchema == undefined) {
                    return true;
                }
                let x = saveToJsonViaTypeSchema(fieldTypeSchema, newValue);
                changeJson((json2: any) => json2[p] = x);
                return true;
            }
        },
    ) as A;
    objProjectionMap.set(json, projection);
    return ok(projection);
}

type JsonValue =
    null |
    boolean |
    number |
    string |
    JsonValue[] |
    { [key: string]: JsonValue };

function createJsonArrayProjectionViaTypeSchema<A>(typeSchema: TypeSchema<A>, json: any, changeJson: (callback: (json: any) => void) => void): Result<A> {
    if (typeof typeSchema != "object") {
        return err("expected an array type schema");
    }
    if (typeSchema.type != "Array") {
        return err("expected an array type schema");
    }
    if (arrProjectionMap.has(json)) {
        return ok(arrProjectionMap.get(json)! as A)
    }
    let target2 = makeDefaultViaTypeSchema(typeSchema) as any[];
    createComputed(on(
        () => json.length,
        (len) => {
            while (target2.length > len) {
                target2.pop();
            }
            while (target2.length < len) {
                target2.push(makeDefaultViaTypeSchema(typeSchema.element));
            }
        }
    ));
    let elemTypeSchema = typeSchema.element;
    let projection = new Proxy(
        target2,
        {
            get(target, p, receiver) {
                if (typeof p !== "symbol" && !Number.isNaN(Number.parseInt(p))) {
                    if ((elemTypeSchema as any).type == "Object") {
                        let r = createJsonProjectionViaTypeSchema(
                            elemTypeSchema as any,
                            json[p],
                            (callback) => changeJson((json2) => callback(json2[p])),
                        );
                        if (r.type == "Ok") {
                            return r.value;
                        }
                    }
                    if ((elemTypeSchema as any).type == "Array") {
                        let r = createJsonArrayProjectionViaTypeSchema(
                            elemTypeSchema as any,
                            json[p],
                            (callback) => changeJson((json2) => callback(json2[p])),
                        );
                        if (r.type == "Ok") {
                            return r.value;
                        }
                    }
                    let x = loadFromJsonViaTypeSchema<any>(elemTypeSchema as any, json[p]);
                    if (x.type == "Err") {
                        return (target2 as any)[p];
                    }
                    let x2 = x.value;
                    let last = (target2 as any)[p];
                    if (equalsViaTypeSchema(elemTypeSchema as any, last, x2)) {
                        return last;
                    }
                    (target2 as any)[p] = x2;
                    return (target2 as any)[p];
                }
                return Reflect.get(target, p, receiver);
            },
            set(target, p, newValue, receiver) {
                if (typeof p !== "symbol" && !Number.isNaN(Number.parseInt(p))) {
                    (target2 as any)[p] = newValue;
                    let x = saveToJsonViaTypeSchema(elemTypeSchema as any, newValue);
                    changeJson((json2: any) => json2[p] = x);
                    return true;
                }
                return Reflect.set(target, p, newValue, receiver);
            }
        },
    ) as A;
    arrProjectionMap.set(json, projection);
    return ok(projection);
}
