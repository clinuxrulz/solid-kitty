import { DefaultIndentGuide } from "./file-tree-defaults";
import { render } from "solid-js/web";
import { createFileSystem } from "./create-file-system";
import { FileTree } from "./file-tree";

function Counter() {
  const fs = createFileSystem();

  function mockData(parts: Array<string>) {
    if (parts.length > 4) return;
    fs.mkdir(parts.join("/"));

    for (let i = 0; i < 3; i++) {
      const path = `${parts.join("/")}/index${parts.length}_${i}.ts`;
      fs.writeFile(path, `export const value = 'Hello World from ${path}'`);
    }

    for (let i = 0; i < 3; i++) {
      mockData([...parts, `test${parts.length}_${i}` ]);
    }
  }

  mockData([""]);

  return (
    <FileTree
      fs={fs}
      style={{ display: "grid", height: "100vh", "align-content": "start" }}
    >
      {(dirEnt) => {
        return (
          <FileTree.DirEnt
            style={{
              "text-align": "left",
              display: "flex",
              margin: "0px",
              padding: "0px",
              border: "none",
              color: "white",
              background: dirEnt.selected ? "blue" : "none",
            }}
          >
            <FileTree.IndentGuides
              guide={() => <DefaultIndentGuide color="white" width={15} />}
            />
            <FileTree.Opened
              closed="+"
              opened="-"
              style={{ width: "15px", "text-align": "center" }}
            />
            {dirEnt.name}
          </FileTree.DirEnt>
        );
      }}
    </FileTree>
  );
}

render(() => <Counter />, document.getElementById("app")!);
