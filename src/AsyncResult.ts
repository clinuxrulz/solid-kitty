export type AsyncResult<A,E=string> = {
    type: "Pending",
} | {
    type: "Success",
    value: A,
} | {
    type: "Failed",
    message: E,
};

export function asyncPending(): AsyncResult<never,never> {
    return { type: "Pending", };
}

export function asyncSuccess<A>(a: A): AsyncResult<A,never> {
    return { type: "Success", value: a, };
}

export function asyncFailed<E>(message: E): AsyncResult<never,E> {
    return { type: "Failed", message, };
}
