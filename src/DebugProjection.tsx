import { Component, createRoot } from "solid-js";
import { Vec2 } from "./Vec2";
import { createJsonProjectionViaTypeSchemaV2, TypeSchema, vec2TypeSchema } from "./TypeSchema";
import { createStore } from "solid-js/store";
import { createComputed } from "solid-js";

const DebugProjection: Component = () => {
    return (
        <div
            style={{
                "width": "100%",
                "height": "100%",
                "padding": "5px",
            }}
        >
            <button
                class="btn btn-primary"
                onClick={() => runTest()}
            >
                Run Test
            </button>
        </div>
    );
};

function runTest() {
    
    let json = {
            firstName: "John",
            lastName: "Smith",
            /**
             * This is a non-json object (Vec2) in the surrounding state
             */
            location: {
                x: 10.0,
                y: 15.0,
            },
            targets: [
                {
                    x: 1,
                    y: 3,
                },
                {
                    x: 2,
                    y: 2,
                },
                {
                    x: 3,
                    y: 1,
                },
            ],
            secretCodes: [
                [ 1, 3, 3, 7, ],
                [ 3, 1, 3, 3, 7, ],
                [ 4, 0, ],
            ],
        };
        type State = {
            firstName: string,
            lastName: string,
            location: Vec2,
            targets: Vec2[],
            secretCodes: number[][],
        };
        let objTypeSchema: TypeSchema<State> = {
            type: "Object",
            properties: {
                firstName: "String",
                lastName: "String",
                location: vec2TypeSchema,
                targets: {
                    type: "Array",
                    element: vec2TypeSchema,
                },
                secretCodes: {
                    type: "Array",
                    element: {
                        type: "Array",
                        element: "Number",
                    },
                },
            },
        };
        createRoot((dispose) => {
            let projection = createJsonProjectionViaTypeSchemaV2<State>(objTypeSchema, () => json, (callback) => callback(json));
            expect(projection.type == "Ok");
            if (projection.type != "Ok") {
                return;
            }
            let projection2 = projection.value;
            let [ state, setState ] = createStore(projection2);
            let x: number | undefined = undefined;
            createComputed(() => {
                x = state.secretCodes[2][1];
            });
            expect(x).toBe(0);
            setState("firstName", "Apple");
            setState("location", Vec2.create(1, 2));
            setState("targets", 1, Vec2.create(7, 7));
            setState("secretCodes", 2, 1, 2);
            expect(x).toBe(2);
            dispose();
        });
        expect(json.firstName).toBe("Apple");
        expect(json.lastName).toBe("Smith");
        expect(json.location.x).toBe(1);
        expect(json.location.y).toBe(2);
        expect(json.targets[1].x).toBe(7);
        expect(json.targets[1].y).toBe(7);
        expect(json.secretCodes[2][0]).toBe(4);
        expect(json.secretCodes[2][1]).toBe(2);
}

function expect(val: any) {
    return {
toBe: (val2: any) => {
            if (val !== val2) {
                throw new Error(`${val} !== ${val2}`);
            }
        },
    };
}

export default DebugProjection;

