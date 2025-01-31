import { A } from "@solidjs/router";
import { Component } from "solid-js";

const App: Component = (props) => {
    return (
        <div style="flex-grow: 1; overflow: auto; ">
            <b>Links:</b>
            <ul>
                <li><A href="/kitty-demo">Kitty Demo</A></li>
                <li><A href="/pixel-editor">Pixel Editor</A></li>
                <li><A href="/colour-picker">Colour Picker</A></li>
                <li><A href="/reactive-sim">Reactive Simulator</A></li>
            </ul>
        </div>
    );
};

export default App;
