import {
  equalsViaTypeSchema,
  loadFromJsonViaTypeSchema,
  makeDefaultViaTypeSchema,
  saveToJsonViaTypeSchema,
  TypeSchema,
} from "./TypeSchema";

export function projectMutableOverAutomergeDocV2<T extends object>(
  json: any,
  updateJson: (cb: (json: any) => any) => void,
  typeSchema: TypeSchema<T>
): T {
  if (typeof typeSchema != "object" || typeSchema.type != "Object") {
    throw new Error("Expected object.");
  }
  let properties = typeSchema.properties;
  let result = new Proxy<T>(
    {} as T,
    {
      defineProperty(target, property, attributes) {
        console.log("defineProperty", target, property, attributes);
        return Reflect.defineProperty(target, property, attributes);
      },
      deleteProperty(target, p) {
        console.log("deleteProperty", target, p);
        return Reflect.deleteProperty(target, p);
      },
      getOwnPropertyDescriptor(target, p) {
        console.log("getOwnPropertyDescriptor", target, p);
        if ((properties as any)[p] != undefined) {
          let r = Reflect.getOwnPropertyDescriptor(properties, p);
          if (r == undefined) {
            return;
          }
          r = { ...r, };
          r.value = (result as any)[p];
          return r;
        }
        return Reflect.getOwnPropertyDescriptor(target, p);
      },
      getPrototypeOf(target) {
        console.log("getPrototypeOf", target);
        return Reflect.getPrototypeOf(target);
      },
      has(target, p) {
        console.log("has", target);
        if ((properties as any)[p] != undefined) {
          return true;
        }
        return Reflect.has(target, p);
      },
      isExtensible(target) {
        console.log("isExtendable", target);
        return Reflect.isExtensible(target);
      },
      ownKeys(target) {
        console.log("ownKeys", target);
        return [
          ...Reflect.ownKeys(properties),
          ...Reflect.ownKeys(target),
        ];
      },
      preventExtensions(target) {
        console.log("preventExtensions", target);
        return Reflect.preventExtensions(target);
      },
      setPrototypeOf(target, v) {
        console.log("setPrototypeOf", target, v);
        return Reflect.setPrototypeOf(target, v);
      },
      get(target, p, receiver) {
        if (typeof p == "symbol") {
          return (target as any)[p];
        }
        if (typeof p == "string") {
          let propertySchema = (properties as any)[p] as TypeSchema<any>;
          if (propertySchema != undefined) {
            if ((propertySchema as any).type == "Object") {
              return projectMutableOverAutomergeDocV2(
                json[p],
                (cb) => updateJson((json2) => cb(json2[p])),
                propertySchema,
              );
            } else if ((propertySchema as any).type == "Array") {
              return projectMutableOverAutomergeDocArrayV2(
                json[p],
                (cb) => updateJson((json2) => cb(json2[p])),
                propertySchema,
              );
            }
            let r = loadFromJsonViaTypeSchema(
              propertySchema as any,
              json[p]
            );
            if (r.type == "Err") {
              return makeDefaultViaTypeSchema(propertySchema as any);
            }
            return r.value;
          }
        }
        return Reflect.get(target, p, receiver);
      },
      set(target, p, newValue, receiver) {
        if (typeof p == "symbol") {
          (target as any)[p] = newValue;
          return true;
        }
        if (typeof p == "string") {
          let propertySchema = (properties as any)[p] as TypeSchema<any>;
          if (propertySchema != undefined) {
            let r = saveToJsonViaTypeSchema(propertySchema, newValue);
            updateJson((json2) => json2[p] = r);
            return true;
          }
        }
        return Reflect.set(target, p, newValue, receiver);
      },
    },
  );
  return result;
}

export function projectMutableOverAutomergeDocArrayV2<T extends object>(
  json: any,
  updateJson: (cb: (json: any) => any) => void,
  typeSchema: TypeSchema<T>
): T {
  if (typeof typeSchema != "object" || typeSchema.type != "Array") {
    throw new Error("Expected object.");
  }
  let elementSchema = typeSchema.element;
  let result = new Proxy<T>(
    [undefined] as T,
    {
      defineProperty(target, property, attributes) {
        console.log("defineProperty", target, property, attributes);
        return Reflect.defineProperty(target, property, attributes);
      },
      deleteProperty(target, p) {
        console.log("deleteProperty", target, p);
        return Reflect.deleteProperty(target, p);
      },
      getOwnPropertyDescriptor(target, p) {
        console.log("getOwnPropertyDescriptor", target, p);
        let idx = (typeof p == "string") ? Number.parseInt(p) : undefined;
        if (Number.isNaN(idx)) {
          idx = undefined;
        }
        if (idx != undefined) {
          let r = Reflect.getOwnPropertyDescriptor(target, 0);
          if (r == undefined) {
            return;
          }
          r = { ...r, };
          r.value = (result as any)[p];
          return r;
        }
        return Reflect.getOwnPropertyDescriptor(target, p);
      },
      getPrototypeOf(target) {
        console.log("getPrototypeOf", target);
        return Reflect.getPrototypeOf(target);
      },
      has(target, p) {
        console.log("has", target);
        let idx = (typeof p == "string") ? Number.parseInt(p) : undefined;
        if (Number.isNaN(idx)) {
          idx = undefined;
        }
        if (idx != undefined) {
          return 0 <= idx && idx < json.length;
        }
        return Reflect.has(target, p);
      },
      isExtensible(target) {
        console.log("isExtendable", target);
        return Reflect.isExtensible(target);
      },
      ownKeys(target) {
        console.log("ownKeys", target);
        return [
          ...Array(json.length).fill(undefined).map((_,idx) => idx.toString()),
          ...Reflect.ownKeys(target).filter((key) => key != "0"),
        ];
      },
      preventExtensions(target) {
        console.log("preventExtensions", target);
        return Reflect.preventExtensions(target);
      },
      setPrototypeOf(target, v) {
        console.log("setPrototypeOf", target, v);
        return Reflect.setPrototypeOf(target, v);
      },
      get(target, p, receiver) {
        if (typeof p == "symbol") {
          return (target as any)[p];
        }
        if (typeof p == "string") {
          let idx = (typeof p == "string") ? Number.parseInt(p) : undefined;
          if (Number.isNaN(idx)) {
            idx = undefined;
          }
          if (idx != undefined && 0 <= idx && idx < json.length) {
            if ((elementSchema as any).type == "Object") {
              return projectMutableOverAutomergeDocV2(
                json[idx],
                (cb) => updateJson((json2) => cb(json2[p])),
                elementSchema as any,
              );
            } else if ((elementSchema as any).type == "Array") {
              return projectMutableOverAutomergeDocArrayV2(
                json[idx],
                (cb) => updateJson((json2) => cb(json2[p])),
                elementSchema as any,
              );
            }
            let r = loadFromJsonViaTypeSchema(
              elementSchema as any,
              json[idx]
            );
            if (r.type == "Err") {
              return makeDefaultViaTypeSchema(elementSchema as any);
            }
            return r.value;
          }
        }
        return Reflect.get(target, p, receiver);
      },
      set(target, p, newValue, receiver) {
        if (typeof p == "symbol") {
          (target as any)[p] = newValue;
          return true;
        }
        if (typeof p == "string") {
          let idx = (typeof p == "string") ? Number.parseInt(p) : undefined;
          if (Number.isNaN(idx)) {
            idx = undefined;
          }
          if (idx != undefined) {
            let r = saveToJsonViaTypeSchema(elementSchema as any, newValue);
            updateJson((json2) => json2[p] = r);
            return true;
          }
        }
        return Reflect.set(target, p, newValue, receiver);
      },
    },
  );
  return result;
}

let wrappedMap = new WeakMap<any, any>();

function isWrapped(x: any): boolean {
  if (typeof x != "object") {
    return false;
  }
  return wrappedMap.has(x);
}

function unwrap(x: any): any {
  if (!isWrapped(x)) {
    return x;
  }
  return wrappedMap.get(x)!;
}

let objectProxiesMap = new WeakMap<any, any>();

export function projectMutableOverAutomergeDoc<T extends object>(
  doc: object,
  changeDoc: (cb: (doc: object) => void) => void,
  typeSchema: TypeSchema<T>,
): T {
  if (doc == undefined) {
    return undefined as unknown as T;
  }
  if (typeSchema.type != "Object") {
    throw new Error("Top level needs to be an object.");
  }
  {
    let result = objectProxiesMap.get(doc);
    if (result != undefined) {
      return result as T;
    }
  }
  let cache = new Map<any, any>();
  let symbols = {};
  let result = new Proxy<T>(symbols as T, {
    get(target, p, receiver) {
      if (typeof p == "symbol") {
        return (symbols as any)[p];
      }
      let innerTypeSchema = (typeSchema.properties as any)[p];
      // ???
      if (innerTypeSchema == undefined) {
        return Reflect.get(target, p, receiver);
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
      let v = loadFromJsonViaTypeSchema(innerTypeSchema, (doc as any)[p]);
      if (v.type != "Ok") {
        throw new Error();
      }
      let v2 = cache.get(p);
      if (v2 != undefined) {
        if (equalsViaTypeSchema(innerTypeSchema, v2, v.value)) {
          return v2;
        }
      }
      return v.value;
    },
    set(target, p, newValue, receiver) {
      if (typeof p == "symbol") {
        (symbols as any)[p] = newValue;
        return true;
      }
      let innerTypeSchema = (typeSchema.properties as any)[p];
      if (innerTypeSchema != undefined) {
        let v: any;
        if (isWrapped(newValue)) {
          v = unwrap(newValue);
        } else {
          v = saveToJsonViaTypeSchema(innerTypeSchema, newValue);
        }
        changeDoc((doc2) => ((doc2 as any)[p] = v));
        return true;
      }
      return Reflect.set(target, p, newValue, receiver);
    },
  });
  objectProxiesMap.set(doc, result);
  wrappedMap.set(result, doc);
  return result;
}

let arrayProxiesMap = new WeakMap<any, any>();

function projectMutableOverAutomergeDocArray<T extends any[]>(
  doc: object,
  changeDoc: (cb: (doc: object) => void) => void,
  typeSchema: TypeSchema<T>,
): T {
  if (doc == undefined) {
    return undefined as unknown as T;
  }
  let cache = new Map<any, any>();
  let symbols: any = [];
  {
    let result = arrayProxiesMap.get(doc);
    if (result != undefined) {
      return result;
    }
  }
  let iterator = function* () {
    for (let i = 0; i < (doc as any).length; ++i) {
      yield result[i];
    }
  };
  let innerTypeSchema = typeSchema.element as any;
  let result = new Proxy<T>(symbols as T, {
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
        let idx = Number.parseInt(p);
        if (innerTypeSchema.type == "Object") {
          return projectMutableOverAutomergeDoc(
            (doc as any)[idx],
            (cb) => changeDoc((doc2) => cb((doc2 as any)[idx])),
            innerTypeSchema,
          );
        } else if (innerTypeSchema.type == "Array") {
          return projectMutableOverAutomergeDocArray(
            (doc as any)[idx],
            (cb) => changeDoc((doc2) => cb((doc2 as any)[idx])),
            innerTypeSchema,
          );
        }
        let v = loadFromJsonViaTypeSchema(innerTypeSchema, (doc as any)[idx]);
        if (v.type != "Ok") {
          throw new Error();
        }
        let v2 = cache.get(p);
        if (v2 != undefined) {
          if (equalsViaTypeSchema(innerTypeSchema, v2, v.value)) {
            return v2;
          }
        }
        return v.value;
      }
      return Reflect.get(target, p, receiver);
    },
    set(target, p, newValue, receiver): boolean {
      if (typeof p == "symbol") {
        (symbols as any)[p] = newValue;
        return true;
      }
      if (Number.isFinite(Number.parseInt(p))) {
        let idx = Number.parseInt(p);
        let v: any;
        if (isWrapped(newValue)) {
          v = unwrap(newValue);
        } else {
          v = saveToJsonViaTypeSchema(innerTypeSchema, newValue);
        }
        changeDoc((doc2) => ((doc2 as any)[idx] = v));
        return true;
      }
      return Reflect.set(target, p, newValue, receiver);
    },
  });
  arrayProxiesMap.set(doc, result);
  wrappedMap.set(result, doc);
  return result as T;
}
