import { Vec2 } from "./Vec2";
import { Complex } from './Complex';

export class Transform2D {
    /*private*/ _origin : Vec2;

    /*private*/ _orientation : Complex;

    public static identity : Transform2D = new Transform2D(
        Vec2.zero(),
        Complex.rot0,
    );

    constructor(origin : Vec2, orientation : Complex) {
        this._origin = origin;
        this._orientation = orientation;
    }

    public static create(origin : Vec2, orientation : Complex): Transform2D {
        return new Transform2D(origin, orientation);
    }

    public get origin(): Vec2 {
        return this._origin;
    }

    public get orientation(): Complex {
        return this._orientation;
    }

    public get u(): Vec2 {
        return this._orientation.u;
    }

    public get v(): Vec2 {
        return this._orientation.v;
    }

    public getOrigin() : Vec2 {
        return this._origin;
    }

    public getOrientation() : Complex {
        return this._orientation;
    }

    public pointFromSpace(p : Vec2) : Vec2 {
        return this._orientation.rotate(p).add(this._origin);
    }

    public pointToSpace(p : Vec2) : Vec2 {
        return this._orientation.conjugate().rotate(p.sub(this._origin));
    }

    public vectorFromSpace(v : Vec2) : Vec2 {
        return this._orientation.rotate(v);
    }

    public vectorToSpace(v : Vec2) : Vec2 {
        return this._orientation.conjugate().rotate(v);
    }

    public transformFromSpace(a : Transform2D) : Transform2D {
        return Transform2D.create(
            this.pointFromSpace(a.getOrigin()),
            a.getOrientation().times(this._orientation),
        );
    }

    public transformToSpace(a : Transform2D) : Transform2D {
        return Transform2D.create(
            this.pointToSpace(a.getOrigin()),
            this.getOrientation().conjugate().times(a.getOrientation()),
        );
    }
}
