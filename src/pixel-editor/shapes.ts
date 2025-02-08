
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
    if (adx >= ady) {
        let dn = ady % adx;
        let n = (dn + adx>>1) % adx;
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
        drawPixel(x, y);
    } else {
        let dn = adx % ady;
        let n = (dn + ady>>1) % ady;
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
        drawPixel(x, y);
    }
}

