import {
  equalsViaTypeSchema,
  loadFromJsonViaTypeSchema,
  saveToJsonViaTypeSchema,
  TypeSchema,
} from "./TypeSchema";

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
