export declare class Vec2 {
    x: number;
    y: number;
    private constructor();
    static create(x: number, y: number): Vec2;
    static zero(): Vec2;
    dispose(): void;
    clone(): Vec2;
    copy(other: Vec2): this;
    add(other: Vec2): this;
    sub(other: Vec2): this;
    multScalar(s: number): this;
    cross(other: Vec2): number;
    distanceSquared(other: Vec2): number;
    distance(other: Vec2): number;
    lengthSquared(): number;
    length(): number;
    normalize(): this;
}
