/**
 * @vitest-environment node
 */

import { describe, expect, test } from "vitest";
import { levelComponentType, LevelState } from './level-builder/components/LevelComponent';
import { createJsonProjectionViaTypeSchema, saveToJsonViaTypeSchema } from './TypeSchema';
import { createRoot } from "solid-js";
import { createStore } from 'solid-js/store';

describe("TypeSchema json projection for automerge", () => {
    test("Sample projection 1", () => {
        let json = {
            tileToShortIdTable: [
                {
                    textureAtlasRef: "ref1",
                    frames: [
                        {
                            frameId: "1",
                            shortId: 1,
                        },
                        {
                            frameId: "2",
                            shortId: 2,
                        },
                    ],
                },
            ],
            mapData: [
                [ 1, 1, 1, 1, ],
                [ 2, 2, 2, 2, ],
            ],
        };
        createRoot((dispose) => {
            let state = createJsonProjectionViaTypeSchema<LevelState>(
                levelComponentType.typeSchema,
                json,
                (callback) => callback(json),
            );
            if (state.type == "Err") {
                throw new Error(state.message);
            }
            let state2 = state.value;
            let [ state3, setState3, ] = createStore(state2);
            setState3("mapData", 0, 2, 2);
            expect(json.mapData[0][2]).toBe(2);
            expect(state3.mapData[0][2]).toBe(2);
            dispose();
        });
    });

    test("another one", () => {
        let jsonString = '{"mapData":[[1,0,0,0,0,0,0,0,0,0],[0,0,2,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,3,0,3,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0]],"tileToShortIdTable":[{"frames":[{"frameId":"381c2d7c-6030-436f-9338-4d0e3b166ca0","shortId":1},{"frameId":"400490fc-e79d-4992-962f-103cec9741e8","shortId":3}],"textureAtlasRef":"ss.json"},{"frames":[{"frameId":"48d2763d-3993-41d6-bdcd-ac2659071e14","shortId":2}],"textureAtlasRef":"aa.json"}]}';
        let json = JSON.parse(jsonString);
        // jsonString = JSON.stringify(json);
        createRoot((dispose) => {
            let levelComponent = levelComponentType.createJsonProjection(
                () => json,
                (callback) => callback(json),
            )();
            expect(levelComponent.type).toBe("Ok");
            if (levelComponent.type != "Ok") {
                throw new Error(levelComponent.message);
            }
            let levelComponent2 = levelComponent.value;
            let json2 = saveToJsonViaTypeSchema(levelComponentType.typeSchema, levelComponent2.state);
            expect(json2).toStrictEqual(json);
            dispose();
        });
    });
});
