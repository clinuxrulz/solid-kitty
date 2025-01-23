import { Accessor, batch, createMemo, createSignal, Setter } from "solid-js";

export type UndoUnit = {
    displayName: string,
    run(isUndo: boolean): void,
};

export class UndoManager {
    readonly canUndo: Accessor<boolean>;
    readonly canRedo: Accessor<boolean>;
    readonly undoDisplayName: Accessor<string | undefined>;
    readonly redoDisplayName: Accessor<string | undefined>;
    readonly undo: () => void;
    readonly redo: () => void;
    readonly pushUndoUnit: (undoUnit: UndoUnit) => void;

    constructor() {
        let [ undos, setUndos, ] = createSignal<UndoUnit[]>([]);
        let [ redos, setRedos, ] = createSignal<UndoUnit[]>([]);
        let canUndo = createMemo(() => undos().length != 0);
        let canRedo = createMemo(() => redos().length != 0);
        let undoDisplayName = createMemo(() => {
            let undos2 = undos();
            if (undos2.length == 0) {
                return undefined;
            }
            return undos2[undos2.length-1].displayName;
        });
        let redoDisplayName = createMemo(() => {
            let redos2 = redos();
            if (redos2.length == 0) {
                return undefined;
            }
            return redos2[redos2.length-1].displayName;
        });
        let undo = () => {
            let undos2 = [...undos()];
            let redos2 = [...redos()];
            let undo = undos2.pop();
            if (undo == undefined) {
                return;
            }
            undo.run(true);
            redos2.push(undo);
            batch(() => {
                setUndos(undos2);
                setRedos(redos2);
            });
        };
        let redo = () => {
            let undos2 = [...undos()];
            let redos2 = [...redos()];
            let redo = redos2.pop();
            if (redo == undefined) {
                return;
            }
            redo.run(false);
            undos2.push(redo);
            batch(() => {
                setUndos(undos2);
                setRedos(redos2);
            });
        };
        let pushUndoUnit = (undoUnit: UndoUnit) => {
            let undos2 = [...undos()];
            undos2.push(undoUnit);
            batch(() => {
                setUndos(undos2);
                setRedos([]);
            });
        };
        //
        this.canUndo = canUndo;
        this.canRedo = canRedo;
        this.undoDisplayName = undoDisplayName;
        this.redoDisplayName = redoDisplayName;
        this.undo = undo;
        this.redo = redo;
        this.pushUndoUnit = pushUndoUnit;
    }
}
