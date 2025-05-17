import { describe, expect, test } from "vitest";
import {
  levelComponentType,
  LevelState,
} from "./level-builder/components/LevelComponent";
import {
  createJsonProjectionViaTypeSchema,
  createJsonProjectionViaTypeSchemaV2,
  saveToJsonViaTypeSchema,
  TypeSchema,
  vec2TypeSchema,
} from "./TypeSchema";
import { createComputed, createRoot, createSignal, on } from "solid-js";
import { createStore } from "solid-js/store";
import { Vec2 } from "./math/Vec2";
import { makeDocumentProjection } from "solid-automerge";
import { Repo } from "@automerge/automerge-repo";

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
        [1, 1, 1, 1],
        [2, 2, 2, 2],
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
      let [state3, setState3] = createStore(state2);
      setState3("mapData", 0, 2, 2);
      expect(json.mapData[0][2]).toBe(2);
      expect(state3.mapData[0][2]).toBe(2);
      dispose();
    });
  });

  test("another one", () => {
    let jsonString =
      '{"mapData":[[1,0,0,0,0,0,0,0,0,0],[0,0,2,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,3,0,3,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0,0]],"tileToShortIdTable":[{"frames":[{"frameId":"381c2d7c-6030-436f-9338-4d0e3b166ca0","shortId":1},{"frameId":"400490fc-e79d-4992-962f-103cec9741e8","shortId":3}],"textureAtlasRef":"ss.json"},{"frames":[{"frameId":"48d2763d-3993-41d6-bdcd-ac2659071e14","shortId":2}],"textureAtlasRef":"aa.json"}]}';
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
      let json2 = saveToJsonViaTypeSchema(
        levelComponentType.typeSchema,
        levelComponent2.state,
      );
      expect(json2).toStrictEqual(json);
      dispose();
    });
  });

  test("TypeSchema json projection v2", () => {
    type State = {
      firstName: string;
      lastName: string;
      location: Vec2;
      targets: Vec2[];
      secretCodes: number[][];
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
    let repo = new Repo();
    let docHandle = repo.create({
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
        [1, 3, 3, 7],
        [3, 1, 3, 3, 7],
        [4, 0],
      ],
    });
    createRoot((dispose) => {
      let json = makeDocumentProjection(docHandle);
      let projection = createJsonProjectionViaTypeSchemaV2<State>(
        objTypeSchema,
        json,
        (callback) => docHandle.change((json2) => callback(json2)),
      );
      expect(projection.type == "Ok");
      if (projection.type != "Ok") {
        return;
      }
      let projection2 = projection.value;
      let [state, setState] = createStore(projection2);
      let x: number | undefined = undefined;
      createComputed(() => {
        x = state.secretCodes[2][1];
      });
      expect(x).toBe(0);
      setState("firstName", "Apple");
      setState("location", Vec2.create(1, 2));
      setState("targets", 1, Vec2.create(7, 7));
      createComputed(
        on(
          () => state.secretCodes,
          () => {
            console.log("A");
          },
          { defer: true },
        ),
      );
      createComputed(
        on(
          () => state.secretCodes[2],
          () => {
            console.log("B");
          },
          { defer: true },
        ),
      );
      createComputed(
        on(
          () => state.secretCodes[2][1],
          () => {
            console.log("C");
          },
          { defer: true },
        ),
      );
      setState("secretCodes", 2, 1, 2);
      expect(x).toBe(2);
      //
      expect(json.firstName).toBe("Apple");
      expect(json.lastName).toBe("Smith");
      expect(json.location.x).toBe(1);
      expect(json.location.y).toBe(2);
      expect(json.targets[1].x).toBe(7);
      expect(json.targets[1].y).toBe(7);
      expect(json.secretCodes[2][0]).toBe(4);
      expect(json.secretCodes[2][1]).toBe(2);
      //
      dispose();
    });
  });
});
