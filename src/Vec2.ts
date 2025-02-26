let vec2Pool: Vec2[] = [];

export class Vec2 {
    x: number;
    y: number;

    private constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    static create(x: number, y: number): Vec2 {
        let r = vec2Pool.pop();
        if (r != undefined) {
            r.x = x;
            r.y = y;
            return r;
        }
        r = new Vec2(x, y);
        return r;
    }

    static zero(): Vec2 {
        return Vec2.create(0, 0);
    }

    dispose() {
        vec2Pool.push(this);
    }

    clone(): Vec2 {
        return Vec2.create(this.x, this.y);
    }

    copy(other: Vec2): this {
        this.x = other.x;
        this.y = other.y;
        return this;
    }

    add(other: Vec2): this {
        this.x += other.x;
        this.y += other.y;
        return this;
    }

    sub(other: Vec2): this {
        this.x -= other.x;
        this.y -= other.y;
        return this;
    }

    multScalar(s: number): this {
        this.x *= s;
        this.y *= s;
        return this;
    }

    cross(other: Vec2): number {
        return this.x * other.y - this.y * other.x;
    }

    distanceSquared(other: Vec2): number {
        let dx = other.x - this.x;
        let dy = other.y - this.y;
        return dx * dx + dy * dy;
    }

    distance(other: Vec2): number {
        return Math.sqrt(this.distanceSquared(other));
    }

    lengthSquared(): number {
        return this.x * this.x + this.y * this.y;
    }

    length(): number {
        return Math.sqrt(this.lengthSquared());
    }

    normalize(): this {
        return this.multScalar(1.0 / this.length());
    }
}
