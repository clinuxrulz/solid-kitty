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
        // p(t) = p0 + v0.t + a.t.t
        // p(t+1) = p0 + v0.(t+1) + a.(t+1).(t+1)
        // p(t+1) = p0 + v0.t + a.t.t + v0 + 2.a.t + a
        // p(t+1) = p(t) + v0 + a + 2.a.t
        // 
        /*
        dummy1 = v0 + a
        dummy2(0) = 0
        dummy2(t + 1) = dummy2(t) + a + a
        p(0) = p0
        p(t + 1) = p(t) + dummy1 + dummy2(t)
        */
        let twoA = a + a;
        let dummy1 = v0 + a;
        let dummy2 = 0;
        let height = p0;
        let t = 0;
        while (t <= 50) {
            heights2.push(height);
            ++t;
            height += dummy1 + dummy2;
            dummy2 += twoA;
        }
    }
    return (
        <div
            style={{
                "width": "100%",
                "height": "100%",
                "overflow-y": "auto",
            }}
        >
            <table
                style={{
                    "width": "100%",
                }}
            >
                <thead/>
                <tbody>
                    <tr>
                        <td colSpan={2} style="border: 1px solid blue;">
                            p0 = {p0}<br/>
                            v0 = {v0}<br/>
                            a = {a}
                        </td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid blue;">
                            <b>Actual Formula:</b><br/>
                            <code>
                                p = p0 + v0.t + a.t.t
                            </code>
                        </td>
                        <td style="border: 1px solid blue;">
                            <b>Modified Newton's Method</b><br/>
                            <code>
                                dummy1 = v0 + a<br/>
                                dummy2(0) = 0<br/>
                                dummy2(t + 1) = dummy2(t) + a + a<br/>
                                p(0) = p0<br/>
                                p(t + 1) = p(t) + dummy1 + dummy2(t)
                            </code>
                        </td>
                    </tr>
                    <tr>
                        <td style="border: 1px solid blue;">
                            <code>
                                <For each={heights1}>
                                    {(height, t) => (<>p({t}) = {height}<br/></>)}
                                </For>
                            </code>
                        </td>
                        <td style="border: 1px solid blue;">
                            <code>
                                <For each={heights2}>
                                    {(height, t) => (<>p({t}) = {height}<br/></>)}
                                </For>
                            </code>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    );
};

export default GravityTest;