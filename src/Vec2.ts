
export class Vec2 {
    x: number;
    y: number;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    static zero(): Vec2 {
        return new Vec2(0.0, 0.0);
    }

    clone(): Vec2 {
        return new Vec2(this.x, this.y);
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
}
