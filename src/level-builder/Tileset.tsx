import { Accessor, Component } from "solid-js";
import { Vec2 } from "../Vec2";

export class Tileset {
    private image: Accessor<HTMLImageElement>;

    constructor(params: {
        image: Accessor<HTMLImageElement>,
    }) {
        this.image = params.image;
    }

    Render: Component = (props) => {
        return (<>{this.image()}</>);
    };
}
