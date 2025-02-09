
export function drawLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    drawPixel: (x: number, y: number) => void,
) {
    let dx = x2 - x1;
    let dy = y2 - y1;
    let adx = Math.abs(dx);
    let ady = Math.abs(dy);
    let xDir = Math.sign(dx);
    let yDir = Math.sign(dy);
    // Overshoot by 1, but don't include last points.
    // This will make all the tail sizes throughout the line the same size.
    x2 += xDir;
    y2 += yDir;
    ++adx;
    ++ady;
    //
    if (adx > ady) {
        let dn = ady % adx;
        let n = 0;
        let d = adx;
        let y = y1;
        let x = x1;
        for (; x != x2; x += xDir) {
            drawPixel(x, y);
            n += dn;
            if (n >= d) {
                y += yDir;
                n -= d;
            }
        }
    } else if (adx < ady) {
        let dn = adx % ady;
        let n = 0;
        let d = ady;
        let x = x1;
        let y = y1;
        for (; y != y2; y += yDir) {
            drawPixel(x, y);
            n += dn;
            if (n >= d) {
                x += xDir;
                n -= d;
            }
        }
    } else {
        for (let x = x1, y = y1; x != x2; x += xDir, y += yDir) {
            drawPixel(x, y);
        }
    }
}

export function drawEllipse(
  centreX: number,
  centreY: number,
  radiusX: number,
  radiusY: number,
  drawPixel: (x: number, y: number) => void
): void {
    if (radiusX == 0) {
        for (let y = centreY - radiusY; y <= centreY + radiusY; ++y) {
            drawPixel(centreX, y);
        }
        return;
    }
    if (radiusY == 0) {
        for (let x = centreX - radiusX; x <= centreX + radiusX; ++x) {
            drawPixel(x, centreY);
        }
        return;
    }
    let x = 1;
    let y = -radiusY;
    let a = radiusY;
    let b = radiusX;
    let errL1 = 0;
    let errL2x = 3*a*a;
    let errL2y = 2*b*b*y + b*b;
    let twoA2 = 2*a*a;
    let twoB2 = 2*b*b;
    let lastX: number | undefined = undefined;
    let lastY: number | undefined = undefined;
    let draw4 = () => {
        if (x == lastX && y == lastY) {
            return;
        }
        lastX = x;
        lastY = y;
        drawPixel(centreX + x, centreY + y);
        drawPixel(centreX - x, centreY + y);
        drawPixel(centreX + x, centreY - y);
        drawPixel(centreX - x, centreY - y);
    };
    drawPixel(centreX, centreY + radiusY);
    drawPixel(centreX, centreY - radiusY);
    drawPixel(centreX + radiusX, centreY);
    drawPixel(centreX - radiusX, centreY);
    while (y < -1) {
        draw4();
        errL1 += errL2x;
        errL2x += twoA2;
        ++x;
        while (errL1 > 0) {
            errL1 += errL2y;
            errL2y += twoB2;
            ++y;
            draw4();
            if (y >= -1) {
                return;
            }
        }
    }
}

export function floodFill(
    x: number,
    y: number,
    isSourceColour: (x: number, y: number) => boolean,
    drawPixel: (x: number, y: number) => void,
) {
    let toVisitStack: number[] = [];
    toVisitStack.push(y);
    toVisitStack.push(x);
    while (toVisitStack.length >= 2) {
        let atX = toVisitStack.pop()!;
        let atY = toVisitStack.pop()!;
        if (!isSourceColour(atX, atY)) {
            continue;
        }
        drawPixel(atX, atY);
        for (let atX2 = atX+1; isSourceColour(atX2, atY); ++atX2) {
            drawPixel(atX2, atY);
            if (isSourceColour(atX2, atY-1) && !isSourceColour(atX2-1, atY-1)) {
                toVisitStack.push(atY-1);
                toVisitStack.push(atX2);
            }
            if (isSourceColour(atX2, atY+1) && !isSourceColour(atX2-1, atY+1)) {
                toVisitStack.push(atY+1);
                toVisitStack.push(atX2);
            }
        }
        for (let atX2 = atX-1; isSourceColour(atX2, atY); --atX2) {
            drawPixel(atX2, atY);
            if (isSourceColour(atX2, atY-1) && !isSourceColour(atX+1, atY-1)) {
                toVisitStack.push(atY-1);
                toVisitStack.push(atX2);
            }
            if (isSourceColour(atX2, atY+1) && !isSourceColour(atX+1, atY+1)) {
                toVisitStack.push(atY+1);
                toVisitStack.push(atX2);
            }
        }
        if (isSourceColour(atX, atY-1)) {
            toVisitStack.push(atY-1);
            toVisitStack.push(atX);
        }
        if (isSourceColour(atX, atY+1)) {
            toVisitStack.push(atY+1);
            toVisitStack.push(atX);
        }
    }
}
