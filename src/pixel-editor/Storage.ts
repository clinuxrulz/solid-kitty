import { err, ok, Result } from "../Result";

export class Storage {
    db: IDBDatabase;

    private constructor(db: IDBDatabase) {
        this.db = db;
    }

    static init(): Promise<Result<Storage>> {
        return new Promise<Result<Storage>>((resolve) => {
            let dbOpenRequest = window.indexedDB.open("pixel-editor");
            dbOpenRequest.onerror = () => {
                resolve(err("Failed to load database."));
            };
            dbOpenRequest.onsuccess = () => {
                let db = dbOpenRequest.result;
                resolve(ok(new Storage(db)));
            };
        });
    }

    loadPreviousWork(): Promise<Result<Blob | undefined>> {
        return new Promise<Result<Blob | undefined>>((resolve) => {
            let cursor = this.db.transaction("previos_work").objectStore("previous_work").get("image");
            cursor.onerror = (e) => {
                resolve(err("Failed to load previous work."));
            };
            cursor.onsuccess = (e) => {
                let imgFile = cursor.result;
                if (imgFile == null) {
                    // there was no previous work
                    resolve(ok(undefined));
                    return;
                }
                resolve(ok(imgFile));
            };
        });
    }

    saveWork(imgFile: Blob): Promise<Result<{}>> {
        return new Promise<Result<{}>>((resolve) => {
            let cursor = this.db.transaction("previous_work").objectStore("previous_work").put(imgFile, "image");
            cursor.onerror = () => {
                resolve(err("Failed to save work."));
            };
            cursor.onsuccess = () => {
                resolve(ok({}));
            };
        });
    }
}
