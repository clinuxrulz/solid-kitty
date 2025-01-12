export const SM_SPRITES = "smb3-spritesheet.png";
const GOOMBA_WIDTH = 16;
const GOOMBA_HEIGHT = 16;
const GOOMBA_1_OFFSET_X = 47;
const GOOMBA_2_OFFSET_X = 65;
const GOOMBA_3_OFFSET_X = 83;
const GOOMBA_OFFSET_Y = 724;

export const smSpriteAtlasData = {
    frames: {
        goomba_walking_1: {
            frame: { x: GOOMBA_1_OFFSET_X, y: GOOMBA_OFFSET_Y, w: GOOMBA_WIDTH, h: GOOMBA_HEIGHT, },
        },
        goomba_walking_2: {
            frame: { x: GOOMBA_2_OFFSET_X, y: GOOMBA_OFFSET_Y, w: GOOMBA_WIDTH, h: GOOMBA_HEIGHT, },
        },
        goomba_flat: {
            frame: { x: GOOMBA_3_OFFSET_X, y: GOOMBA_OFFSET_Y, w: GOOMBA_WIDTH, h: GOOMBA_HEIGHT, },
        },
    },
    meta: {
        image: SM_SPRITES,
        format: "RGBA8888",
        scale: 1.0,
    },
    animations: {
        goomba_walking: [
            "goomba_walking_1",
            "goomba_walking_2",
        ],
    },
};
