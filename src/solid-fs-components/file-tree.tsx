import {
  createSignal,
  type JSX,
  mergeProps,
  Show,
  Index,
  createContext,
  useContext,
  createEffect,
  createMemo,
  splitProps,
  createSelector,
  type ComponentProps,
  createRenderEffect,
  mapArray,
  onCleanup,
  type Accessor,
  batch,
} from "solid-js";
import { createStore } from "solid-js/store";
import { type FileSystem } from "./create-file-system";
import { Key } from "@solid-primitives/keyed";

function lastItem<T>(arr: Array<T>): T {
  return arr[arr.length - 1];
}

function isAncestor(path: string, ancestor: string) {
  if (path === ancestor) return false;
  const pathParts = path.split("/");
  const ancestorParts = ancestor.split("/");
  return ancestorParts.every((part, index) => part === pathParts[index]);
}

interface DirEntBase {
  path: string;
  indentation: number;
  name: string;
  select(): void;
  shiftSelect(): void;
  deselect(): void;
  selected: boolean;
}

interface File extends DirEntBase {
  type: "file";
}
interface Dir extends DirEntBase {
  type: "dir";
  open(): void;
  close(): void;
  opened: boolean;
}

type DirEnt = File | Dir;

interface FileTreeProps<T> {
  fs: FileSystem<T>;
  children: (props: DirEnt) => JSX.Element;
  base?: string;
  sort?(dirEnt1: DirEnt, dirEnt2: DirEnt): number;
}
interface FileTreeContext<T> extends FileTreeProps<T> {
  openDir(path: string): void;
  closeDir(path: string): void;
  isDirOpened(path: string): boolean;
  indentationFromPath(path: string): number;
  sortedDir(path: string): Array<DirEnt>;
  resetSelection(): void;
  move(path: string): void;
}

const FileTreeContext = createContext<FileTreeContext<unknown>>();
export function useFileTree() {
  const context = useContext(FileTreeContext);
  if (!context) throw `FileTreeContext is undefined`;
  return context;
}

const DirEntContext = createContext<DirEnt>();
export function useDirEnt() {
  const context = useContext(DirEntContext);
  if (!context) throw `DirEntContext is undefined`;
  return context;
}

type IndentGuideKind = "default" | "branch" | "leaf";

const IndentGuideContext = createContext<IndentGuideKind>();
export function useIndentGuide() {
  const context = useContext(IndentGuideContext);
  if (!context) throw `IndentGuideContext is undefined`;
  return context;
}

const getParentDirectory = (path: string) =>
  path.split("/").slice(0, -1).join("/");

export function FileTree<T>(
  props: FileTreeProps<T> &
    Omit<ComponentProps<"div">, "children" | "onPointerUp"> & {
      onPointerUp?(
        event: PointerEvent & {
          currentTarget: HTMLDivElement;
          target: Element;
        },
      ): void;
    },
) {
  const config = mergeProps({ base: "" }, props);

  const [dirEntSelection, setDirEntSelection] = createSignal<
    Array<[start: string, end?: string]>
  >([], { equals: false });

  const selectDirEnt = (path: string) =>
    setDirEntSelection((dirEnts) => [...dirEnts, [path]]);
  const deselectDirEnt = (path: string) => {
    setDirEntSelection((pairs) =>
      pairs
        .map((dirEnts) => dirEnts.filter((dirEnt) => dirEnt !== path))
        .filter((pair) => pair.length > 0),
    );
  };
  const shiftSelectDirEnt = (path: string) => {
    setDirEntSelection((dirEnts) => {
      if (dirEnts.length > 0) {
        dirEnts[dirEnts.length - 1] = [dirEnts[dirEnts.length - 1][0], path];
        return [...dirEnts];
      }
      return [[path]];
    });
  };

  const flattenedDirEntSelection = createMemo(() =>
    dirEntSelection()
      .flatMap(([start, end]) => {
        if (end) {
          const startIndex = dirEntList().findIndex(
            (dir) => dir.path === start,
          );
          const endIndex = dirEntList().findIndex((dir) => dir.path === end);

          return dirEntList()
            .slice(
              Math.min(startIndex, endIndex),
              Math.max(startIndex, endIndex) + 1,
            )
            .map((dirEnt) => dirEnt.path);
        }
        return start;
      })
      .sort((a, b) => (a < b ? -1 : 1)),
  );

  const isDirEntSelected = createSelector(
    flattenedDirEntSelection,
    (path: string, dirs) => dirs.includes(path),
  );

  const [openedDirs, setOpenedDirs] = createSignal<Array<string>>(new Array(), {
    equals: false,
  });
  const isDirOpened = createSelector(openedDirs, (path: string, dirs) =>
    dirs.includes(path),
  );
  const closeDir = (path: string) =>
    setOpenedDirs((dirs) => dirs.filter((dir) => dir !== path));
  const openDir = (path: string) => setOpenedDirs((dirs) => [...dirs, path]);

  function indentationFromPath(path: string) {
    return path.split("/").length - config.base.split("/").length;
  }

  const [sortedDirs, setSortedDirs] = createStore<
    Record<string, Accessor<Array<DirEnt>>>
  >({});

  createEffect(
    mapArray(
      () => [config.base, ...openedDirs()],
      (path) => {
        createRenderEffect(() => {
          if (!props.fs.exists(path)) {
            setOpenedDirs((dirs) => dirs.filter((dir) => dir !== path));
          }
        });
        const memo = createMemo(() => {
          try {
            const dir = props.fs.readdir(path, { withFileTypes: true });
            return dir
              .map((dirEnt) => {
                return {
                  ...dirEnt,
                  indentation: indentationFromPath(dirEnt.path),
                  name: lastItem(dirEnt.path.split("/")),
                  open() {
                    openDir(dirEnt.path);
                  },
                  close() {
                    closeDir(dirEnt.path);
                  },
                  get opened() {
                    return isDirOpened(dirEnt.path);
                  },
                  select() {
                    selectDirEnt(dirEnt.path);
                  },
                  deselect() {
                    deselectDirEnt(dirEnt.path);
                  },
                  shiftSelect() {
                    shiftSelectDirEnt(dirEnt.path);
                  },
                  get selected() {
                    return isDirEntSelected(dirEnt.path);
                  },
                };
              })
              .toSorted(
                props.sort ??
                  ((a, b) =>
                    a.type !== b.type
                      ? a.type === "dir"
                        ? -1
                        : 1
                      : a.path < b.path
                        ? -1
                        : 1),
              );
          } catch (error) {}
        });
        setSortedDirs(path, () => memo);
        onCleanup(() => setSortedDirs(path, undefined!));
      },
    ),
  );

  const sortedDir = (path: string) => sortedDirs[path]?.() || [];

  const dirEntList = createMemo(() => {
    const list = new Array<DirEnt>();
    const stack = [config.base];
    while (stack.length > 0) {
      const path = stack.shift()!;
      const dirEnts = sortedDir(path);
      stack.push(
        ...dirEnts
          .filter((dirEnt) => dirEnt.type === "dir" && isDirOpened(dirEnt.path))
          .map((dir) => dir.path),
      );
      list.splice(
        list.findIndex((dirEnt) => dirEnt.path === path) + 1,
        0,
        ...dirEnts,
      );
    }
    return list;
  });

  function move(target: string) {
    const selection = flattenedDirEntSelection();

    // Validate if any of the selected paths are ancestor of the target path
    for (const selected of selection) {
      if (isAncestor(target, selected)) {
        throw `Cannot move: ${selected} is ancestor of ${target}.`;
      }
    }

    const existingPaths = new Array<{ newPath: string; oldPath: string }>();

    const transforms = selection
      .sort((a, b) => (a < b ? -1 : 1))
      .map((oldPath, index, arr) => {
        const ancestor = arr
          .slice(0, index)
          .find((path) => isAncestor(oldPath, path));

        const newPath = (
          ancestor
            ? [
                target,
                lastItem(ancestor.split("/")),
                oldPath.replace(`${ancestor}/`, ""),
              ]
            : [target, lastItem(oldPath.split("/"))]
        )
          .filter(Boolean)
          .join("/");

        if (props.fs.exists(newPath)) {
          existingPaths.push({ oldPath, newPath });
        }

        console.log(oldPath, newPath);

        return { oldPath, newPath, hasAncestor: !!ancestor };
      });

    if (existingPaths.length > 0) {
      throw `Paths already exist: ${existingPaths.map(({ newPath }) => newPath)}`;
    }

    // TODO: this does assume that filesystem manipulations are immediately reflected
    batch(() => {
      // Rename the opened dirs (before they are cleaned up)
      setOpenedDirs((dirs) =>
        dirs.map((dir) => {
          const transform = transforms.find(({ oldPath }) => oldPath === dir);

          if (transform) {
            return transform.newPath;
          }

          return dir;
        }),
      );

      // Rename the selected dirEnts (before they are cleaned up)
      setDirEntSelection(() => transforms.map(({ newPath }) => [newPath]));

      // Rename the filesystem
      transforms.forEach(({ oldPath, newPath, hasAncestor }) => {
        if (!hasAncestor) {
          props.fs.rename(oldPath, newPath);
        }
      });

      // Open the target-dir if it wasn't opened yet
      if (!isDirOpened(target)) {
        openDir(target);
      }
    });
  }

  const fileTreeContext = mergeProps(config, {
    isDirOpened,
    closeDir,
    openDir,
    indentationFromPath,
    move,
    sortedDir,
    resetSelection() {
      setDirEntSelection([]);
    },
  });

  const handlers = {
    onPointerUp(
      event: PointerEvent & { currentTarget: HTMLDivElement; target: Element },
    ) {
      props.onPointerUp?.(event);
    },
    onDragOver(
      event: DragEvent & { currentTarget: HTMLDivElement; target: Element },
    ) {
      event.preventDefault();
    },
    onDrop(
      event: DragEvent & { currentTarget: HTMLDivElement; target: Element },
    ) {
      move(config.base);
    },
  };

  return (
    <div {...props} {...handlers}>
      <FileTreeContext.Provider value={fileTreeContext}>
        <Key each={dirEntList()} by={(item) => item.path}>
          {(dirEnt) => {
            return (
              <DirEntContext.Provider value={dirEnt()}>
                {props.children(dirEnt())}
              </DirEntContext.Provider>
            );
          }}
        </Key>
      </FileTreeContext.Provider>
    </div>
  );
}

FileTree.DirEnt = function (
  props: Omit<
    ComponentProps<"button">,
    "onClick" | "onDragStart" | "onDragOver" | "onDrop"
  > & {
    onClick?(
      event: MouseEvent & { currentTarget: HTMLButtonElement; target: Element },
    ): void;
    onDragStart?(
      event: DragEvent & { currentTarget: HTMLButtonElement; target: Element },
    ): void;
    onDragOver?(
      event: DragEvent & { currentTarget: HTMLButtonElement; target: Element },
    ): void;
    onDrop?(
      event: DragEvent & { currentTarget: HTMLButtonElement; target: Element },
    ): void;
    onMove?(parent: string): void;
  },
) {
  const fileTree = useFileTree();
  const dirEnt = useDirEnt();
  const [, rest] = splitProps(props, ["onClick"]);

  const handlers = {
    draggable: true,
    onPointerDown(
      event: PointerEvent & {
        currentTarget: HTMLButtonElement;
        target: Element;
      },
    ) {
      if (event.shiftKey) {
        dirEnt.shiftSelect();
      } else {
        const selected = dirEnt.selected;
        if (!selected) {
          if (!event.metaKey) {
            fileTree.resetSelection();
          }
          dirEnt.select();
        } /*  else {
          dirEnt.deselect();
        } */
      }
      props.onPointerDown?.(event);
    },
    onPointerUp(
      event: PointerEvent & {
        currentTarget: HTMLButtonElement;
        target: Element;
      },
    ) {
      if (dirEnt.type === "dir") {
        if (fileTree.isDirOpened(dirEnt.path)) {
          dirEnt.close();
        } else {
          dirEnt.open();
        }
      }
      props.onPointerUp?.(event);
    },
    onDragOver: (
      event: DragEvent & { currentTarget: HTMLButtonElement; target: Element },
    ) => {
      event.preventDefault();
      props.onDragOver?.(event);
    },
    onDrop: (
      event: DragEvent & { currentTarget: HTMLButtonElement; target: Element },
    ) => {
      event.preventDefault();
      event.stopPropagation();

      if (dirEnt.type === "dir") {
        fileTree.move(dirEnt.path);
      } else {
        const parent = dirEnt.path.split("/").slice(0, -1).join("/");
        fileTree.move(parent);
      }

      props.onDrop?.(event);
    },
  };

  return (
    <Show
      when={dirEnt.type === "dir"}
      fallback={<button {...props} {...handlers} />}
      children={(_) => (
        <Show when={dirEnt.path}>
          <button {...rest} {...handlers}>
            {props.children}
          </button>
        </Show>
      )}
    />
  );
};

FileTree.IndentGuides = function (props: {
  guide: (type: IndentGuideKind) => JSX.Element;
}) {
  const dirEnt = useDirEnt();
  const fileTree = useFileTree();
  const isLeafRow = createMemo(() => {
    const parentDirPath = getParentDirectory(dirEnt.path);
    const grandParentDirPath = getParentDirectory(parentDirPath);
    if (grandParentDirPath === fileTree.base) return false;
    const sortedParentDir = fileTree.sortedDir(parentDirPath);
    return lastItem(sortedParentDir).path === dirEnt.path;
  });
  return (
    <Index each={Array.from({ length: dirEnt.indentation })}>
      {(_, index) => {
        const isLast = dirEnt.indentation - index === 1;
        const kind =
          isLast && isLeafRow() ? "leaf" : isLast ? "branch" : "default";
        return (
          <IndentGuideContext.Provider value={kind}>
            {props.guide(kind)}
          </IndentGuideContext.Provider>
        );
      }}
    </Index>
  );
};

FileTree.Opened = function (
  props: ComponentProps<"span"> & {
    opened: JSX.Element;
    closed: JSX.Element;
  },
) {
  const [, rest] = splitProps(props, ["closed", "opened"]);
  const dirEnt = useDirEnt();
  const fileTree = useFileTree();
  return (
    <Show when={dirEnt.type === "dir"}>
      <span {...rest}>
        <Show when={fileTree.isDirOpened(dirEnt.path)} fallback={props.opened}>
          {props.closed}
        </Show>
      </span>
    </Show>
  );
};
