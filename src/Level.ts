import { createStore, SetStoreFunction, Store } from "solid-js/store";
import { tilesetAtlasData } from "./tileset";

type LevelState = {
    blocks: string[][],
};

export class Level {
    state: Store<LevelState>;
    setState: SetStoreFunction<LevelState>;

    constructor(initLevel: string[]) {
        let [ state, setState, ] = createStore<LevelState>({
            blocks: initLevel.map((row) => new Array(row.length).fill(undefined).map((_, idx) => row.charAt(idx))),
        });
        this.state = state;
        this.setState = setState;
    }

    readBlock(xIdx: number, yIdx: number): string | undefined {
        let blocks = this.state.blocks;
        if (yIdx < 0 || yIdx >= blocks.length) {
            return undefined;
        }
        let row = blocks[yIdx];
        if (xIdx < 0 || xIdx >= row.length) {
            return undefined;
        }
        return this.state.blocks[yIdx][xIdx];
    }

    readTile(xIdx: number, yIdx: number): keyof (typeof tilesetAtlasData)["frames"] | undefined {
        let blocks = this.state.blocks;
        if (yIdx < 0 || yIdx >= blocks.length) {
            return undefined;
        }
        let row = blocks[yIdx];
        if (xIdx < 0 || xIdx >= row.length) {
            return undefined;
        }
        let char = this.state.blocks[yIdx][xIdx];
        if (char == "G") {
            let hasGroundLeft = xIdx > 0 && row[xIdx-1] == "G";
            let hasGroundRight = xIdx < row.length-1 && row[xIdx+1] == "G";
            let hasGroundUp = yIdx > 0 && xIdx < blocks[yIdx-1].length && blocks[yIdx-1][xIdx] == "G";
            if (hasGroundUp) {
                if (!hasGroundLeft) {
                    return "woodGroundCentreLeft";
                }
                if (!hasGroundRight) {
                    return "woodGroundCentreRight";
                }
                return "woodGroundCentreCentre";
            } else {
                if (!hasGroundLeft) {
                    return "woodGroundTopLeft";
                }
                if (!hasGroundRight) {
                    return "woodGroundTopRight";
                }
                return "woodGroundTopCentre";
            }
        }
        return undefined;
    }
}

export const level1: string[] = [
    "                     ",
    "                 GG  ",
    "                     ",
    "                     ",
    "            GG       ",
    "                     ",
    "      GG             ",
    "                 GG  ",
    "                 GG  ",
    "     GG   GGG    GG  ",
    "                     ",
    "                     ",
    "GGGGGGGGGGGGGGGGGGGGG",
    "GGGGGGGGGGGGGGGGGGGGG",
    "GGGGGGGGGGGGGGGGGGGGG",
];
