import { err, ok, Result } from "./kitty-demo/Result";
import { Vec2 } from "./Vec2";

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
