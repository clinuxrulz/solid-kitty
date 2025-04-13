import { Match, Switch } from "solid-js";
import { useIndentGuide } from "./file-tree";


export function DefaultIndentGuide(props: { color: string; width: number }) {
  const indentGuide = useIndentGuide();
  return (
    <span style={{ position: "relative", width: `${props.width}px` }}>
      <Switch>
        <Match when={indentGuide === "leaf"}>
          <span
            style={{
              position: "absolute",
              left: "calc(50% - 0.5px)",
              width: "calc(50% - 0.5px)",
              "border-left": `1px solid ${props.color}`,
              height: "50%",
            }}
          />
          <span
            style={{
              position: "absolute",
              left: "calc(50% - 0.5px)",
              width: "calc(50% - 0.5px)",
              height: "50%",
              "border-left": `1px solid ${props.color}`,
              "border-bottom": `1px solid ${props.color}`,
              "border-bottom-left-radius": "2px",
            }}
          />
        </Match>
        <Match when={indentGuide === "branch"}>
          <span
            style={{
              position: "absolute",
              left: "calc(50% - 0.5px)",
              width: "calc(50% - 0.5px)",
              "border-left": `1px solid ${props.color}`,
              height: "100%",
            }}
          />
          <span
            style={{
              position: "absolute",
              left: "calc(50% - 0.5px)",
              width: "calc(50% - 0.5px)",
              height: "50%",
              "border-left": `1px solid ${props.color}`,
              "border-bottom": `1px solid ${props.color}`,
              "border-bottom-left-radius": "2px",
            }}
          />
        </Match>
        <Match when={indentGuide === "default"}>
          <span
            style={{
              position: "absolute",
              width: "100%",
              top: "0%",
              left: "calc(50% - 0.5px)",
              "border-left": `1px solid ${props.color}`,
              height: "100%",
            }}
          />
        </Match>
      </Switch>
    </span>
  );
}
