import { Component, For } from "solid-js";

const GravityTest: Component = () => {
    let p0 = 0;
    let v0 = 50;
    let a = -10;
    let heights1: number[] = [];
    // Actual formula
    {
        // p = p0 + v0.t + a.t.t
        for (let t = 0; t <= 50; ++t) {
            let height = p0 + v0*t + a*t*t;
            heights1.push(height);
        }
    }
    let heights2: number[] = [];
    // Modified Newton's Method
    {
        let dummy1 = p0;
        let dummy2 = v0;
        let dummy3 = a;
        let dummy4 = 0;
        let dummy5 = 0;
        let dummy6 = 0;
        let t = 0;
        while (t <= 50) {
            let height = dummy1 + dummy4 + dummy6;
            dummy4 += dummy2;
            dummy6 += dummy5;
            dummy5 += dummy3;
            heights2.push(height);
            ++t;
        }
    }
    return (
        <table
            style={{
                "width": "100%",
                "height": "100%",
            }}
        >
            <thead/>
            <tbody>
                <tr>
                    <td colSpan={2}>
                        p0 = {p0}<br/>
                        v0 = {v0}<br/>
                        a = {a}
                    </td>
                </tr>
                <tr>
                    <td>
                        <b>Actual Formula:</b><br/>
                        <code>
                            p = p0 + v0.t + a.t.t
                        </code>
                    </td>
                    <td>
                        <b>Modified Newton's Method</b><br/>
                        <code>
                            dummy1 = p0<br/>
                            dummy2 = v0<br/>
                            dummy3 = a<br/>
                            dummy4(0) = 0<br/>
                            dummy4(t + 1) = dummy4(t) + dummy2<br/>
                            dummy5(0) = 0<br/>
                            dummy5(t + 1) = dummy5(t) + dummy3<br/>
                            dummy6(0) = 0<br/>
                            dummy6(t + 1) = dummy6(t) + dummy5(t)<br/>
                            p(t) = dummy1 + dummy4(t) + dummy6(t)
                        </code>
                    </td>
                </tr>
                <tr>
                    <td>
                        <code>
                            <For each={heights1}>
                                {(height, t) => (<>p({t}) = {height}<br/></>)}
                            </For>
                        </code>
                    </td>
                    <td>
                    <code>
                            <For each={heights2}>
                                {(height, t) => (<>p({t}) = {height}<br/></>)}
                            </For>
                        </code>
                    </td>
                </tr>
            </tbody>
        </table>
    );
};

export default GravityTest;