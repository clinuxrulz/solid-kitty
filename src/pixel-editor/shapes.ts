
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

// untested
export function drawEllipse(
  centerX: number,
  centerY: number,
  radiusX: number,
  radiusY: number,
  drawPixel: (x: number, y: number) => void
): void {
    let x = 0;
    let y = -radiusY;
    let a = Math.sqrt(radiusY);
    let b = Math.sqrt(radiusX);
    let errL1 = 0;
    let errL2x = a;
    let errL2y = 2*b*y + b;
    let draw4 = () => {
        drawPixel(centerX + x, centerY + y);
        drawPixel(centerX - x, centerY + y);
        drawPixel(centerX + x, centerY - y);
        drawPixel(centerX - x, centerY - y);
    };
    while (y < 0) {
        draw4();
        errL1 += errL2x;
        errL2x += a + a;
        ++x;
        while (errL1 > 0) {
            errL1 += errL2y;
            errL2y += b + b;
            y++;
            draw4();
            if (y >= 0) {
                return;
            }
        }
    }
}

