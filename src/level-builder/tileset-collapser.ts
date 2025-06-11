export function collapseTileset(
    numTilesPerRow: number,
    map: number[][],
): number[][] {
    let maxTileIndex = map.reduce((a, row) => row.reduce((b, c) => Math.max(b, c), a), 0);
    const dirs = [
        "Left" as const,
        "Right" as const,
        "Up" as const,
        "Down" as const,
    ];
    type Dir = typeof dirs[number];
    let dirToOpposite = (dir: Dir): Dir => {
        switch (dir) {
            case "Left": return "Right";
            case "Right": return "Left";
            case "Up": return "Down";
            case "Down": return "Up";
        }
    };
    let dirToOffset = (dir: Dir, out: { x: number, y: number }): void => {
        switch (dir) {
            case "Left": {
                out.x = -1;
                out.y = 0;
                return;
            }
            case "Right": {
                out.x = 1;
                out.y = 0;
                return;
            }
            case "Up": {
                out.x = 0;
                out.y = -1;
                return;
            }
            case "Down": {
                out.x = 0;
                out.y = 1;
                return;
            }
            default: {
                let x: never = dir;
                throw new Error(`Unreachable: ${x}`);
            }
        }
    };
    let model = new Map<string,Map<number,number>>();
    let accumulate = (sourceTile: number, edge: Dir, targetTile: number) => {
        let k = `${sourceTile}/${edge}`;
        let v = model.get(k);
        if (v == undefined) {
            v = new Map<number,number>();
            model.set(k, v);
        }
        v.set(targetTile, (v.get(targetTile) ?? 0) + 1);
    };
    // build model
    for (let i = 0; i < map.length; ++i) {
        let row = map[i];
        let rowAbove: number[] | undefined;
        if (i > 0) {
            rowAbove = map[i-1];
        } else {
            rowAbove = undefined;
        }
        let rowBelow: number[] | undefined;
        if (i < map.length-1) {
            rowBelow = map[i+1];
        } else {
            rowBelow = undefined;
        }
        for (let j = 0; j < row.length; ++j) {
            if (j > 0) {
                accumulate(row[j], "Left", row[j - 1]);
            }
            if (j < row.length-1) {
                accumulate(row[j], "Right", row[i + 1]);
            }
            if (rowAbove != undefined) {
                if (j < rowAbove.length) {
                    accumulate(row[j], "Up", rowAbove[j]);
                }
            }
            if (rowBelow != undefined) {
                if (j < rowBelow.length) {
                    accumulate(row[j], "Down", rowBelow[j]);
                }
            }
        }
    }
    let result = [[0]];
    let getTotal = (sourceTile: number, edge: Dir) => {
        let k = `${sourceTile}/${edge}`;
        let v = model.get(k);
        if (v == undefined) {
            return 0;
        }
        return v.values().reduce((a, b) => a + b, 0);
    };
    let getTargetCount = (sourceTile: number, edge: Dir, targetTile: number): number => {
        let k = `${sourceTile}/${edge}`;
        let v = model.get(k);
        if (v == undefined) {
            return 0;
        }
        return v.get(targetTile) ?? 0;
    };
    let readResultTileAt = (xIdx: number, yIdx: number) => {
        if (yIdx < 0 || yIdx >= result.length) {
            return 0;
        }
        let row = result[yIdx];
        if (xIdx < 0 || xIdx >= row.length) {
            return 0;
        }
        return row[xIdx];
    };
    let finishedTiles = new Set<number>();
    let getProbabilitiesAt = (xIdx: number, yIdx: number): Map<number,number> => {
        let probabilities = new Map<number,number>();
        for (let i = 1; i <= maxTileIndex; ++i) {
            if (finishedTiles.has(i)) {
                continue;
            }
            probabilities.set(i, 1.0);
        }
        let offset = { x: 0, y: 0, };
        for (let dir of dirs) {
            dirToOffset(dir, offset);
            let tileAtDir = readResultTileAt(xIdx + offset.x, yIdx + offset.y);
            let oppositeDir = dirToOpposite(dir);
            let denominator = getTotal(tileAtDir, oppositeDir);
            if (denominator == 0) {
                // ???: What to do here?
                continue;
            }
            for (let i = 1; i <= maxTileIndex; ++i) {
                if (finishedTiles.has(i)) {
                    continue;
                }
                let numerator = getTargetCount(tileAtDir, oppositeDir, i);
                let p = numerator / denominator;
                probabilities.set(i, (probabilities.get(i) ?? 0) * p);
            }
        }
        return probabilities;
    }
    let getEntropyAt = (xIdx: number, yIdx: number) => {
        let probabilities = getProbabilitiesAt(xIdx, yIdx);
        let entropy = 0.0;
        for (let i = 1; i <= maxTileIndex; ++i) {
            if (finishedTiles.has(i)) {
                continue;
            }
            let p = probabilities.get(i) ?? 0;
            if (p == 0) {
                continue;
            }
            entropy += -p * Math.log2(p);
        }
        return entropy;
    };
    let writeResultCell = (xIdx: number, yIdx: number, tile: number) => {
        while (result.length < yIdx) {
            result.push([]);
        }
        let row = result[yIdx];
        while (row.length < xIdx) {
            row.push(0);
        }
        row[xIdx] = tile;
    };
    while (true) {
        let maxEntropy: undefined | number = undefined;
        let maxEntropyAtYIdx: number | undefined = undefined;
        let maxEntropyAtXIdx: number | undefined = undefined;
        for (let yIdx = 0; yIdx <= result.length+1; ++yIdx) {
            for (let xIdx = 0; xIdx < numTilesPerRow; ++xIdx) {
                let entropy = getEntropyAt(xIdx, yIdx);
                if (maxEntropy == undefined || entropy > maxEntropy) {
                    maxEntropy = entropy;
                    maxEntropyAtYIdx = yIdx;
                    maxEntropyAtXIdx = xIdx;
                }
            }
        }
        if (maxEntropyAtXIdx == undefined || maxEntropyAtYIdx == undefined) {
            break;
        }
        let xIdx = maxEntropyAtXIdx;
        let yIdx = maxEntropyAtYIdx;
        let probabilities = getProbabilitiesAt(xIdx, yIdx);
        let maxProbability: number | undefined = undefined;
        let maxProbabilityTile: number | undefined = undefined;
        for (let i = 1; i <= maxTileIndex; ++i) {
            if (finishedTiles.has(i)) {
                continue;
            }
            let p = probabilities.get(i);
            if (p == undefined) {
                continue;
            }
            if (maxProbability == undefined || p > maxProbability) {
                maxProbability == p;
                maxProbabilityTile = i;
            }
        }
        if (maxProbabilityTile == undefined) {
            break;
        }
        writeResultCell(xIdx, yIdx, maxProbabilityTile);
    }
    return result;
}
