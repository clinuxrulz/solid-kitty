import { EcsComponentType } from "../lib";

export type LevelRefState = {
    levelFilename: string,
};

export const levelRefComponentType = new EcsComponentType<LevelRefState>({
    typeName: "LevelRef",
    typeSchema: {
        type: "Object",
        properties: {
            levelFilename: "String",
        }
    }
});
