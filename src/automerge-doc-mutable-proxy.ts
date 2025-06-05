import { loadFromJsonViaTypeSchema, saveToJsonViaTypeSchema, TypeSchema } from "./TypeSchema";

let objectProxiesMap = new WeakMap<any,any>();

export function projectMutableOverAutomergeDoc<T extends object>(
    doc: object,
    changeDoc: (cb: (doc: object) => void) => void,
    typeSchema: TypeSchema<T>,
): T {
    if (typeSchema.type != "Object") {
        throw new Error("Top level needs to be an object.");
    }
    {
        let result = objectProxiesMap.get(doc);
        if (result != undefined) {
            return result as T;
        }
    }
    let symbols = {};
    let result = new Proxy<T>(
        symbols as T,
        {
            get(target, p, receiver) {
                if (typeof p == "symbol") {
                    return (symbols as any)[p];
                }
                let innerTypeSchema = (typeSchema.properties as any)[p];
                // ???
                if (innerTypeSchema == undefined) {
                    return undefined;
                }
                //
                if (innerTypeSchema.type == "Object") {
                    return projectMutableOverAutomergeDoc(
                        (doc as any)[p],
                        (cb) => changeDoc((doc2) => cb((doc2 as any)[p])),
                        innerTypeSchema,
                    );
                } else if (innerTypeSchema.type == "Array") {
                    return projectMutableOverAutomergeDocArray(
                        (doc as any)[p],
                        (cb) => changeDoc((doc2) => cb((doc2 as any)[p])),
                        innerTypeSchema,
                    );
                }
                let v = loadFromJsonViaTypeSchema(
                    innerTypeSchema,
                    (doc as any)[p],
                );
                if (v.type != "Ok") {
                    throw new Error();
                }
                return v.value;
            },
            set(target, p, newValue) {
                if (typeof p == "symbol") {
                    (symbols as any)[p] = newValue;
                    return true;
                }
                let innerTypeSchema = (typeSchema.properties as any)[p];
                if (innerTypeSchema != undefined) {
                    let v = saveToJsonViaTypeSchema(
                        innerTypeSchema,
                        newValue,
                    );
                    changeDoc((doc2) => (doc2 as any)[p] = v);
                    return true;
                }
                return false;
            }
        },
    );
    objectProxiesMap.set(doc, result);
    return result;
}

let arrayProxiesMap = new WeakMap<any,any>();

function projectMutableOverAutomergeDocArray<T extends any[]>(
    doc: object,
    changeDoc: (cb: (doc: object) => void) => void,
    typeSchema: TypeSchema<T>,
): T {
    {
        let result = objectProxiesMap.get(doc);
        if (result != undefined) {
            return result as T;
        }
    }
    let symbols: any = [];
    {
        let result = arrayProxiesMap.get(doc);
        if (result != undefined) {
            return result;
        }
    }
    let iterator = function*() {
        for (let i = 0; i < (doc as any).length; ++i) {
            yield result[i];
        }
    };
    let innerTypeSchema = typeSchema.element as any;
    let result = new Proxy<T>(
        symbols as T,
        {
            get(target, p, receiver) {
                if (p == Symbol.iterator) {
                    return iterator;
                }
                if (p == "length") {
                    return (doc as any).length;
                }
                if (typeof p == "symbol") {
                    return (symbols as any)[p];
                }
                if (Number.isFinite(Number.parseInt(p))) {
                    if (innerTypeSchema.type == "Object") {
                        return projectMutableOverAutomergeDoc(
                            (doc as any)[p],
                            (cb) => changeDoc((doc2) => cb((doc2 as any)[p])),
                            innerTypeSchema,
                        );
                    } else if (innerTypeSchema.type == "Array") {
                        return projectMutableOverAutomergeDocArray(
                            (doc as any)[p],
                            (cb) => changeDoc((doc2) => cb((doc2 as any)[p])),
                            innerTypeSchema,
                        );
                    }
                    let v = loadFromJsonViaTypeSchema(
                        innerTypeSchema,
                        (doc as any)[p],
                    );
                    if (v.type != "Ok") {
                        throw new Error();
                    }
                    return v.value;
                }
                return (doc as any)[p];
            },
            set(target, p, newValue, receiver) {
                if (typeof p == "symbol") {
                    (symbols as any)[p] = newValue;
                    return true;
                }
                if (Number.isFinite(Number.parseInt(p))) {
                    let v = saveToJsonViaTypeSchema(
                        innerTypeSchema,
                        newValue,
                    );
                    changeDoc((doc2) => (doc2 as any)[p] = v);
                    return true;
                }
                return false;
            },
        }
    );
    arrayProxiesMap.set(doc, result);
    return result as T;
}